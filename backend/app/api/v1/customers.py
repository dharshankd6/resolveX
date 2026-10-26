from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import User, Customer, Complaint, Transaction, Interaction, Prediction
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services.services import CustomerService

router = APIRouter()

@router.get("/")
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    contract_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers, total = CustomerService.list_customers(
        db, skip=skip, limit=limit, search=search, status=status, contract_type=contract_type
    )
    return {
        "items": customers,
        "total": total,
        "page": (skip // limit) + 1,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{customer_id}")
def get_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = CustomerService.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Customer 360 profile
    complaints = db.query(Complaint).filter(Complaint.customer_id == customer.id).order_by(Complaint.created_at.desc()).all()
    transactions = db.query(Transaction).filter(Transaction.customer_id == customer.id).order_by(Transaction.transaction_date.desc()).all()
    interactions = db.query(Interaction).filter(Interaction.customer_id == customer.id).order_by(Interaction.created_at.desc()).all()
    predictions = db.query(Prediction).filter(Prediction.customer_id == customer.id).order_by(Prediction.created_at.desc()).all()

    latest_churn = next((p for p in predictions if p.prediction_type == "churn"), None)

    return {
        "customer": {
            "id": customer.id,
            "customer_id": customer.customer_id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone": customer.phone,
            "tenure_months": customer.tenure_months,
            "contract_type": customer.contract_type,
            "payment_method": customer.payment_method,
            "monthly_spending": customer.monthly_spending,
            "account_status": customer.account_status,
            "created_at": customer.created_at,
            "updated_at": customer.updated_at,
            "latest_churn_risk": latest_churn.churn_risk_tier if latest_churn else "Low",
            "latest_churn_probability": latest_churn.churn_probability if latest_churn else 0.15,
            "contributing_factors": latest_churn.contributing_factors if latest_churn else []
        },
        "complaints": [
            {
                "id": c.id,
                "complaint_id": c.complaint_id,
                "category": c.category,
                "subject": c.subject,
                "status": c.status,
                "priority": c.priority,
                "created_at": c.created_at,
                "resolved_at": c.resolved_at
            }
            for c in complaints
        ],
        "transactions": [
            {
                "id": t.id,
                "transaction_id": t.transaction_id,
                "transaction_ref": t.transaction_ref,
                "amount": t.amount,
                "expected_amount": t.expected_amount,
                "currency": t.currency,
                "status": t.status,
                "transaction_date": t.transaction_date
            }
            for t in transactions
        ],
        "interactions": [
            {
                "id": i.id,
                "channel": i.channel,
                "raw_text": i.raw_text,
                "sentiment": i.sentiment,
                "sentiment_score": i.sentiment_score,
                "created_at": i.created_at
            }
            for i in interactions
        ]
    }

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Support Agent"]))
):
    existing = db.query(Customer).filter(
        (Customer.email == customer_in.email) | (Customer.customer_id == customer_in.customer_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email or customer ID already exists")
    
    return CustomerService.create_customer(db, customer_in, user_id=current_user.id)

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Support Agent"]))
):
    customer = CustomerService.update_customer(db, customer_id, customer_in, user_id=current_user.id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    deleted = CustomerService.delete_customer(db, customer_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}
