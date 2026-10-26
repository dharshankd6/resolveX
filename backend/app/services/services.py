import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from app.models.models import (
    User, Customer, Interaction, Complaint, ComplaintStatusHistory,
    Transaction, Prediction, Dispute, Recommendation, AuditLog
)
from app.schemas.schemas import (
    CustomerCreate, CustomerUpdate, ComplaintCreate, ComplaintUpdate,
    ComplaintStatusUpdate, InteractionCreate, TransactionCreate,
    DisputeCreate, DisputeReviewUpdate, RecommendationCreate, RecommendationReview,
    DashboardOverview
)
from app.ml.sentiment_model import sentiment_model
from app.ml.churn_model import churn_model
from app.ml.dispute_engine import dispute_engine
from app.ml.recommendation_engine import recommendation_engine

# --- Audit Service ---
class AuditService:
    @staticmethod
    def log(db: Session, action: str, entity_type: str, entity_id: Optional[str] = None,
            user_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None,
            ip_address: Optional[str] = None):
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()

# --- Customer Service ---
class CustomerService:
    @staticmethod
    def list_customers(db: Session, skip: int = 0, limit: int = 50,
                       search: Optional[str] = None, status: Optional[str] = None,
                       contract_type: Optional[str] = None):
        query = db.query(Customer)
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(or_(
                Customer.full_name.ilike(search_fmt),
                Customer.email.ilike(search_fmt),
                Customer.customer_id.ilike(search_fmt)
            ))
        if status:
            query = query.filter(Customer.account_status == status)
        if contract_type:
            query = query.filter(Customer.contract_type == contract_type)
        
        total = query.count()
        customers = query.order_by(desc(Customer.created_at)).offset(skip).limit(limit).all()
        
        # Enrich with latest churn risk
        results = []
        for c in customers:
            latest_pred = db.query(Prediction).filter(
                Prediction.customer_id == c.id,
                Prediction.prediction_type == "churn"
            ).order_by(desc(Prediction.created_at)).first()
            
            c_dict = {
                "id": c.id,
                "customer_id": c.customer_id,
                "full_name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "tenure_months": c.tenure_months,
                "contract_type": c.contract_type,
                "payment_method": c.payment_method,
                "monthly_spending": c.monthly_spending,
                "account_status": c.account_status,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "latest_churn_risk": latest_pred.churn_risk_tier if latest_pred else "Low",
                "latest_churn_probability": latest_pred.churn_probability if latest_pred else 0.15
            }
            results.append(c_dict)
        return results, total

    @staticmethod
    def get_customer(db: Session, customer_id: int):
        return db.query(Customer).filter(Customer.id == customer_id).first()

    @staticmethod
    def create_customer(db: Session, customer_in: CustomerCreate, user_id: Optional[int] = None):
        customer = Customer(**customer_in.dict())
        db.add(customer)
        db.commit()
        db.refresh(customer)

        # Initial baseline churn score
        churn_res = churn_model.predict(
            tenure_months=customer.tenure_months,
            monthly_spending=customer.monthly_spending,
            complaint_count=0,
            contract_type=customer.contract_type,
            payment_method=customer.payment_method
        )
        pred = Prediction(
            customer_id=customer.id,
            prediction_type="churn",
            churn_probability=churn_res["churn_probability"],
            churn_risk_tier=churn_res["churn_risk_tier"],
            contributing_factors=churn_res["contributing_factors"],
            model_name="LexIntel-Predictor",
            model_version=churn_res["model_version"]
        )
        db.add(pred)
        db.commit()

        AuditService.log(db, "CREATE", "Customer", str(customer.id), user_id=user_id,
                         details={"customer_id": customer.customer_id, "name": customer.full_name})
        return customer

    @staticmethod
    def update_customer(db: Session, customer_id: int, customer_in: CustomerUpdate, user_id: Optional[int] = None):
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return None
        
        update_data = customer_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(customer, field, value)
        
        customer.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(customer)

        # Refresh churn prediction
        complaint_count = db.query(Complaint).filter(Complaint.customer_id == customer.id).count()
        churn_res = churn_model.predict(
            tenure_months=customer.tenure_months,
            monthly_spending=customer.monthly_spending,
            complaint_count=complaint_count,
            contract_type=customer.contract_type,
            payment_method=customer.payment_method
        )
        pred = Prediction(
            customer_id=customer.id,
            prediction_type="churn",
            churn_probability=churn_res["churn_probability"],
            churn_risk_tier=churn_res["churn_risk_tier"],
            contributing_factors=churn_res["contributing_factors"],
            model_name="LexIntel-Predictor",
            model_version=churn_res["model_version"]
        )
        db.add(pred)
        db.commit()

        AuditService.log(db, "UPDATE", "Customer", str(customer.id), user_id=user_id, details=update_data)
        return customer

    @staticmethod
    def delete_customer(db: Session, customer_id: int, user_id: Optional[int] = None):
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return False
        c_code = customer.customer_id
        db.delete(customer)
        db.commit()
        AuditService.log(db, "DELETE", "Customer", str(customer_id), user_id=user_id, details={"customer_id": c_code})
        return True

# --- Interaction & Sentiment Service ---
class InteractionService:
    @staticmethod
    def create_interaction(db: Session, interaction_in: InteractionCreate, user_id: Optional[int] = None):
        # Run LexIntel Sentiment Model
        res = sentiment_model.predict(interaction_in.raw_text)
        
        interaction = Interaction(
            customer_id=interaction_in.customer_id,
            channel=interaction_in.channel,
            raw_text=interaction_in.raw_text,
            sentiment=res["sentiment"],
            sentiment_score=res["confidence"],
            model_version=res["model_version"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)

        AuditService.log(db, "INTERACTION_RECORDED", "Interaction", str(interaction.id),
                         user_id=user_id, details={"sentiment": res["sentiment"], "confidence": res["confidence"]})
        return interaction

    @staticmethod
    def list_interactions(db: Session, customer_id: Optional[int] = None, sentiment: Optional[str] = None,
                          limit: int = 50, skip: int = 0):
        query = db.query(Interaction)
        if customer_id:
            query = query.filter(Interaction.customer_id == customer_id)
        if sentiment:
            query = query.filter(Interaction.sentiment == sentiment)
        return query.order_by(desc(Interaction.created_at)).offset(skip).limit(limit).all()

# --- Complaint Service ---
class ComplaintService:
    @staticmethod
    def list_complaints(db: Session, status: Optional[str] = None, priority: Optional[str] = None,
                        category: Optional[str] = None, customer_id: Optional[int] = None,
                        assigned_agent_id: Optional[int] = None, search: Optional[str] = None,
                        skip: int = 0, limit: int = 50):
        query = db.query(Complaint)
        if status:
            query = query.filter(Complaint.status == status)
        if priority:
            query = query.filter(Complaint.priority == priority)
        if category:
            query = query.filter(Complaint.category == category)
        if customer_id:
            query = query.filter(Complaint.customer_id == customer_id)
        if assigned_agent_id:
            query = query.filter(Complaint.assigned_agent_id == assigned_agent_id)
        if search:
            s_fmt = f"%{search}%"
            query = query.filter(or_(
                Complaint.subject.ilike(s_fmt),
                Complaint.description.ilike(s_fmt),
                Complaint.complaint_id.ilike(s_fmt)
            ))
        
        total = query.count()
        complaints = query.order_by(desc(Complaint.created_at)).offset(skip).limit(limit).all()
        
        # Enrich responses
        items = []
        for c in complaints:
            c_dict = {
                "id": c.id,
                "complaint_id": c.complaint_id,
                "customer_id": c.customer_id,
                "customer_name": c.customer.full_name if c.customer else "Unknown",
                "category": c.category,
                "subject": c.subject,
                "description": c.description,
                "priority": c.priority,
                "status": c.status,
                "assigned_agent_id": c.assigned_agent_id,
                "assigned_agent_name": c.assigned_agent.full_name if c.assigned_agent else "Unassigned",
                "resolution_notes": c.resolution_notes,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "resolved_at": c.resolved_at
            }
            items.append(c_dict)
        return items, total

    @staticmethod
    def create_complaint(db: Session, complaint_in: ComplaintCreate, user_id: Optional[int] = None):
        cid = complaint_in.complaint_id or f"CMP-{int(datetime.datetime.utcnow().timestamp()) % 100000:05d}"
        complaint = Complaint(
            complaint_id=cid,
            customer_id=complaint_in.customer_id,
            category=complaint_in.category,
            subject=complaint_in.subject,
            description=complaint_in.description,
            priority=complaint_in.priority,
            status="Open",
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        # Log status history
        history = ComplaintStatusHistory(
            complaint_id=complaint.id,
            old_status=None,
            new_status="Open",
            changed_by_id=user_id,
            notes="Initial complaint creation",
            timestamp=datetime.datetime.utcnow()
        )
        db.add(history)
        db.commit()

        # Update customer churn score
        customer = db.query(Customer).filter(Customer.id == complaint.customer_id).first()
        if customer:
            cnt = db.query(Complaint).filter(Complaint.customer_id == customer.id).count()
            c_res = churn_model.predict(
                tenure_months=customer.tenure_months,
                monthly_spending=customer.monthly_spending,
                complaint_count=cnt,
                contract_type=customer.contract_type,
                payment_method=customer.payment_method
            )
            pred = Prediction(
                customer_id=customer.id,
                prediction_type="churn",
                churn_probability=c_res["churn_probability"],
                churn_risk_tier=c_res["churn_risk_tier"],
                contributing_factors=c_res["contributing_factors"],
                model_name="LexIntel-Predictor",
                model_version=c_res["model_version"]
            )
            db.add(pred)
            db.commit()

            # Auto-generate recommendation for this complaint
            recs = recommendation_engine.generate_recommendations(customer=customer, complaint=complaint)
            for r in recs:
                rec_id = f"REC-{int(datetime.datetime.utcnow().timestamp()) % 100000:05d}"
                rec_obj = Recommendation(
                    recommendation_id=rec_id,
                    customer_id=r["customer_id"],
                    complaint_id=r["complaint_id"],
                    dispute_id=r.get("dispute_id"),
                    recommended_action=r["recommended_action"],
                    reason=r["reason"],
                    supporting_evidence=r["supporting_evidence"],
                    recommended_priority=r["recommended_priority"],
                    approval_status="Pending",
                    created_at=datetime.datetime.utcnow()
                )
                db.add(rec_obj)
            db.commit()

        AuditService.log(db, "COMPLAINT_CREATED", "Complaint", str(complaint.id), user_id=user_id,
                         details={"complaint_id": cid, "category": complaint.category})
        return complaint

    @staticmethod
    def update_complaint(db: Session, complaint_id: int, complaint_in: ComplaintUpdate, user_id: Optional[int] = None):
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None
        
        old_status = complaint.status
        update_data = complaint_in.dict(exclude_unset=True)
        
        for k, v in update_data.items():
            setattr(complaint, k, v)
        
        if "status" in update_data and update_data["status"] != old_status:
            if update_data["status"] in ["Resolved", "Closed"] and not complaint.resolved_at:
                complaint.resolved_at = datetime.datetime.utcnow()
            history = ComplaintStatusHistory(
                complaint_id=complaint.id,
                old_status=old_status,
                new_status=update_data["status"],
                changed_by_id=user_id,
                notes=complaint_in.resolution_notes or f"Status changed to {update_data['status']}",
                timestamp=datetime.datetime.utcnow()
            )
            db.add(history)
            
        complaint.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(complaint)

        AuditService.log(db, "COMPLAINT_UPDATED", "Complaint", str(complaint.id), user_id=user_id, details=update_data)
        return complaint

# --- Dispute Service ---
class DisputeService:
    @staticmethod
    def list_disputes(db: Session, status: Optional[str] = None, risk_priority: Optional[str] = None,
                      customer_id: Optional[int] = None, limit: int = 50, skip: int = 0):
        query = db.query(Dispute)
        if status:
            query = query.filter(Dispute.status == status)
        if risk_priority:
            query = query.filter(Dispute.risk_priority == risk_priority)
        if customer_id:
            query = query.filter(Dispute.customer_id == customer_id)
        
        total = query.count()
        disputes = query.order_by(desc(Dispute.created_at)).offset(skip).limit(limit).all()

        items = []
        for d in disputes:
            items.append({
                "id": d.id,
                "dispute_id": d.dispute_id,
                "customer_id": d.customer_id,
                "customer_name": d.customer.full_name if d.customer else "Unknown",
                "transaction_id": d.transaction_id,
                "transaction_ref": d.transaction.transaction_ref if d.transaction else "N/A",
                "complaint_id": d.complaint_id,
                "detection_reasons": d.detection_reasons if isinstance(d.detection_reasons, list) else [str(d.detection_reasons)],
                "risk_priority": d.risk_priority,
                "suggested_action": d.suggested_action,
                "human_review_required": d.human_review_required,
                "status": d.status,
                "reviewed_by_id": d.reviewed_by_id,
                "reviewer_name": d.reviewer.full_name if d.reviewer else None,
                "review_notes": d.review_notes,
                "reviewed_at": d.reviewed_at,
                "created_at": d.created_at,
                "updated_at": d.updated_at
            })
        return items, total

    @staticmethod
    def scan_and_detect_disputes(db: Session, customer_id: int, user_id: Optional[int] = None):
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return []
        
        txns = db.query(Transaction).filter(Transaction.customer_id == customer_id).all()
        complaints = db.query(Complaint).filter(Complaint.customer_id == customer_id).all()
        
        detected = dispute_engine.evaluate(customer_id=customer_id, transactions=txns, complaints=complaints)
        created_disputes = []

        for d_info in detected:
            # Check if matching dispute already created recently to avoid duplicate records
            existing = db.query(Dispute).filter(
                Dispute.customer_id == customer_id,
                Dispute.transaction_id == d_info["transaction_id"],
                Dispute.complaint_id == d_info["complaint_id"]
            ).first()

            if not existing:
                disp_id = f"DSP-{int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000:06d}"
                dispute = Dispute(
                    dispute_id=disp_id,
                    customer_id=customer_id,
                    transaction_id=d_info["transaction_id"],
                    complaint_id=d_info["complaint_id"],
                    detection_reasons=d_info["detection_reasons"],
                    risk_priority=d_info["risk_priority"],
                    suggested_action=d_info["suggested_action"],
                    human_review_required=True,
                    status="Under Review",
                    created_at=datetime.datetime.utcnow()
                )
                db.add(dispute)
                db.commit()
                db.refresh(dispute)
                created_disputes.append(dispute)

                # Generate resolution recommendation for the newly detected dispute
                recs = recommendation_engine.generate_recommendations(customer=customer, dispute=dispute)
                for r in recs:
                    rec_id = f"REC-{int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000:06d}"
                    rec_obj = Recommendation(
                        recommendation_id=rec_id,
                        customer_id=customer.id,
                        complaint_id=r.get("complaint_id"),
                        dispute_id=dispute.id,
                        recommended_action=r["recommended_action"],
                        reason=r["reason"],
                        supporting_evidence=r["supporting_evidence"],
                        recommended_priority=r["recommended_priority"],
                        approval_status="Pending",
                        created_at=datetime.datetime.utcnow()
                    )
                    db.add(rec_obj)
                db.commit()

        if created_disputes:
            AuditService.log(db, "DISPUTE_DETECTED", "Dispute", customer.customer_id, user_id=user_id,
                             details={"count": len(created_disputes), "customer_id": customer_id})
        return created_disputes

    @staticmethod
    def review_dispute(db: Session, dispute_id: int, review_in: DisputeReviewUpdate, user_id: int):
        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            return None
        
        dispute.status = review_in.status
        dispute.review_notes = review_in.review_notes
        dispute.reviewed_by_id = user_id
        dispute.reviewed_at = datetime.datetime.utcnow()
        dispute.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(dispute)

        AuditService.log(db, "DISPUTE_REVIEWED", "Dispute", dispute.dispute_id, user_id=user_id,
                         details={"status": dispute.status, "notes": dispute.review_notes})
        return dispute

# --- Recommendation Service ---
class RecommendationService:
    @staticmethod
    def list_recommendations(db: Session, approval_status: Optional[str] = None,
                             customer_id: Optional[int] = None, limit: int = 50, skip: int = 0):
        query = db.query(Recommendation)
        if approval_status:
            query = query.filter(Recommendation.approval_status == approval_status)
        if customer_id:
            query = query.filter(Recommendation.customer_id == customer_id)
        
        total = query.count()
        recs = query.order_by(desc(Recommendation.created_at)).offset(skip).limit(limit).all()

        items = []
        for r in recs:
            items.append({
                "id": r.id,
                "recommendation_id": r.recommendation_id,
                "customer_id": r.customer_id,
                "customer_name": r.customer.full_name if r.customer else "Unknown",
                "complaint_id": r.complaint_id,
                "dispute_id": r.dispute_id,
                "recommended_action": r.recommended_action,
                "reason": r.reason,
                "supporting_evidence": r.supporting_evidence,
                "recommended_priority": r.recommended_priority,
                "approval_status": r.approval_status,
                "reviewer_id": r.reviewer_id,
                "reviewer_name": r.reviewer.full_name if r.reviewer else None,
                "reviewer_notes": r.reviewer_notes,
                "review_timestamp": r.review_timestamp,
                "created_at": r.created_at
            })
        return items, total

    @staticmethod
    def review_recommendation(db: Session, rec_id: int, review_in: RecommendationReview, user_id: int):
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            return None
        
        rec.approval_status = review_in.approval_status
        rec.reviewer_notes = review_in.reviewer_notes
        if review_in.modified_action:
            rec.recommended_action = review_in.modified_action
        rec.reviewer_id = user_id
        rec.review_timestamp = datetime.datetime.utcnow()
        db.commit()
        db.refresh(rec)

        AuditService.log(db, "RECOMMENDATION_REVIEWED", "Recommendation", rec.recommendation_id,
                         user_id=user_id, details={"status": rec.approval_status, "action": rec.recommended_action})
        return rec

# --- Analytics Service ---
class AnalyticsService:
    @staticmethod
    def get_dashboard_overview(db: Session) -> Dict[str, Any]:
        total_customers = db.query(Customer).count()
        total_complaints = db.query(Complaint).count()
        open_complaints = db.query(Complaint).filter(Complaint.status.in_(["Open", "In Progress", "Pending"])).count()
        resolved_complaints = db.query(Complaint).filter(Complaint.status.in_(["Resolved", "Closed"])).count()
        disputes_requiring_review = db.query(Dispute).filter(Dispute.status == "Under Review").count()
        
        # High churn risk count from latest predictions
        high_churn_customers = db.query(Prediction).filter(
            Prediction.prediction_type == "churn",
            Prediction.churn_risk_tier == "High"
        ).count()

        # Average resolution time in hours
        resolved_list = db.query(Complaint).filter(Complaint.resolved_at.isnot(None)).all()
        if resolved_list:
            total_sec = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_list if c.resolved_at and c.created_at)
            avg_res_hours = round(total_sec / (len(resolved_list) * 3600), 1)
        else:
            avg_res_hours = 0.0

        # Sentiment distribution
        pos_cnt = db.query(Interaction).filter(Interaction.sentiment == "positive").count()
        neu_cnt = db.query(Interaction).filter(Interaction.sentiment == "neutral").count()
        neg_cnt = db.query(Interaction).filter(Interaction.sentiment == "negative").count()
        sentiment_dist = {
            "Positive": pos_cnt,
            "Neutral": neu_cnt,
            "Negative": neg_cnt
        }

        # Complaint Category distribution
        cat_counts = db.query(Complaint.category, func.count(Complaint.id)).group_by(Complaint.category).all()
        category_dist = {cat: count for cat, count in cat_counts}

        # Churn risk distribution
        low_churn = db.query(Prediction).filter(Prediction.prediction_type == "churn", Prediction.churn_risk_tier == "Low").count()
        med_churn = db.query(Prediction).filter(Prediction.prediction_type == "churn", Prediction.churn_risk_tier == "Medium").count()
        high_churn = db.query(Prediction).filter(Prediction.prediction_type == "churn", Prediction.churn_risk_tier == "High").count()
        churn_dist = {
            "Low": low_churn,
            "Medium": med_churn,
            "High": high_churn
        }

        # Recent complaints
        recent_cmps = db.query(Complaint).order_by(desc(Complaint.created_at)).limit(5).all()
        cmp_list = []
        for c in recent_cmps:
            cmp_list.append({
                "id": c.id,
                "complaint_id": c.complaint_id,
                "customer_id": c.customer_id,
                "customer_name": c.customer.full_name if c.customer else "Unknown",
                "category": c.category,
                "subject": c.subject,
                "description": c.description,
                "priority": c.priority,
                "status": c.status,
                "assigned_agent_id": c.assigned_agent_id,
                "assigned_agent_name": c.assigned_agent.full_name if c.assigned_agent else "Unassigned",
                "resolution_notes": c.resolution_notes,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "resolved_at": c.resolved_at
            })

        # Recent disputes
        recent_dsps = db.query(Dispute).order_by(desc(Dispute.created_at)).limit(5).all()
        dsp_list = []
        for d in recent_dsps:
            dsp_list.append({
                "id": d.id,
                "dispute_id": d.dispute_id,
                "customer_id": d.customer_id,
                "customer_name": d.customer.full_name if d.customer else "Unknown",
                "transaction_id": d.transaction_id,
                "transaction_ref": d.transaction.transaction_ref if d.transaction else "N/A",
                "complaint_id": d.complaint_id,
                "detection_reasons": d.detection_reasons if isinstance(d.detection_reasons, list) else [str(d.detection_reasons)],
                "risk_priority": d.risk_priority,
                "suggested_action": d.suggested_action,
                "human_review_required": d.human_review_required,
                "status": d.status,
                "reviewed_by_id": d.reviewed_by_id,
                "reviewer_name": d.reviewer.full_name if d.reviewer else None,
                "review_notes": d.review_notes,
                "reviewed_at": d.reviewed_at,
                "created_at": d.created_at,
                "updated_at": d.updated_at
            })

        return {
            "total_customers": total_customers,
            "total_complaints": total_complaints,
            "open_complaints": open_complaints,
            "resolved_complaints": resolved_complaints,
            "disputes_requiring_review": disputes_requiring_review,
            "high_churn_risk_customers": high_churn_customers,
            "avg_resolution_time_hours": avg_res_hours,
            "sentiment_distribution": sentiment_dist,
            "complaint_category_distribution": category_dist,
            "churn_risk_distribution": churn_dist,
            "recent_complaints": cmp_list,
            "recent_disputes": dsp_list
        }
