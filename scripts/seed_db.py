import os
import sys
import datetime

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User, Customer, Interaction, Complaint, ComplaintStatusHistory,
    Transaction, Prediction, Dispute, Recommendation, AuditLog
)
from app.services.services import DisputeService, ComplaintService, CustomerService, AuditService

def seed():
    print("[ResolveX DB Seeder] Initializing schema and inserting synthetic enterprise data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users already exist
        if db.query(User).count() > 0:
            print("  Users already exist, skipping seed to preserve state.")
            return

        # 1. Create Default Users (Admin, Support Agent, Analyst)
        print("  Creating role-based accounts...")
        admin = User(
            email="admin@resolvex.ai",
            full_name="Alex Vance (Lead Administrator)",
            hashed_password=get_password_hash("AdminPass123!"),
            role="Admin",
            is_active=True
        )
        agent = User(
            email="agent.sarah@resolvex.ai",
            full_name="Sarah Jenkins (Senior Resolution Agent)",
            hashed_password=get_password_hash("AgentPass123!"),
            role="Support Agent",
            is_active=True
        )
        analyst = User(
            email="analyst.david@resolvex.ai",
            full_name="David Chen (BI & Risk Analyst)",
            hashed_password=get_password_hash("AnalystPass123!"),
            role="Analyst",
            is_active=True
        )
        db.add_all([admin, agent, analyst])
        db.commit()
        db.refresh(admin)
        db.refresh(agent)
        db.refresh(analyst)

        # 2. Seed Customers
        print("  Creating synthetic enterprise customers...")
        customers_data = [
            ("CUST-1001", "Acme Corporation (John Sterling)", "j.sterling@acme-corp.com", "+1-555-0192", 36, "Two year", "Bank transfer", 1250.00, "Active"),
            ("CUST-1002", "Nova Cloud Systems (Elena Rostova)", "elena@novacloud.io", "+1-555-0144", 4, "Month-to-month", "Electronic check", 149.99, "Active"),
            ("CUST-1003", "Apex Logistics (Marcus Brody)", "mbrody@apexlog.com", "+1-555-0188", 12, "One year", "Credit card", 450.00, "Active"),
            ("CUST-1004", "Vanguard Financial (Claire Dupont)", "cdupont@vanguardfin.org", "+1-555-0129", 2, "Month-to-month", "Electronic check", 320.00, "Active"),
            ("CUST-1005", "Helix Biotech (Dr. Aris Thorne)", "athorne@helixbio.net", "+1-555-0177", 48, "Two year", "Bank transfer", 2800.00, "Active"),
            ("CUST-1006", "Omni Retail Group (Tara Simmons)", "tsimmons@omniretail.com", "+1-555-0163", 8, "Month-to-month", "Credit card", 890.00, "Active"),
            ("CUST-1007", "Starlight Media (Liam O'Connor)", "liam@starlightmedia.co", "+1-555-0151", 1, "Month-to-month", "Electronic check", 99.00, "Active"),
            ("CUST-1008", "Zenith Energy (Rachel Green)", "rgreen@zenithenergy.com", "+1-555-0138", 22, "One year", "Bank transfer", 1650.00, "Active"),
            ("CUST-1009", "Pinnacle Software (Devon Vance)", "devon@pinnaclesoft.dev", "+1-555-0112", 15, "One year", "Credit card", 520.00, "Active"),
            ("CUST-1010", "Quantum Dynamics (Sophia Martinez)", "smartinez@quantumdynamics.ai", "+1-555-0199", 3, "Month-to-month", "Electronic check", 750.00, "Active"),
        ]

        created_customers = []
        for cid, name, email, phone, tenure, contract, pay, spend, status in customers_data:
            c = Customer(
                customer_id=cid,
                full_name=name,
                email=email,
                phone=phone,
                tenure_months=tenure,
                contract_type=contract,
                payment_method=pay,
                monthly_spending=spend,
                account_status=status,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=tenure * 30)
            )
            db.add(c)
            created_customers.append(c)
        db.commit()

        for c in created_customers:
            db.refresh(c)

        # 3. Seed Transactions (including deliberate anomalies for dispute testing)
        print("  Seeding transactions and ledger events...")
        now = datetime.datetime.utcnow()
        txns_data = [
            # Customer 2 (Duplicate charge trigger: $149.99 billed twice within 3 hours)
            (created_customers[1].id, "TXN-9011", "REF-CC-88201", 149.99, 149.99, "USD", "Completed", now - datetime.timedelta(days=2, hours=4)),
            (created_customers[1].id, "TXN-9012", "REF-CC-88202", 149.99, 149.99, "USD", "Completed", now - datetime.timedelta(days=2, hours=1)),
            
            # Customer 4 (Amount mismatch trigger: billed $420 vs expected $320)
            (created_customers[3].id, "TXN-9021", "REF-ACH-55101", 420.00, 320.00, "USD", "Completed", now - datetime.timedelta(days=5)),
            
            # Customer 7 (Delayed refund trigger)
            (created_customers[6].id, "TXN-9031", "REF-RF-11002", 99.00, 99.00, "USD", "Pending", now - datetime.timedelta(days=8)),
            
            # Standard legitimate transactions
            (created_customers[0].id, "TXN-9001", "REF-WT-10041", 1250.00, 1250.00, "USD", "Completed", now - datetime.timedelta(days=15)),
            (created_customers[2].id, "TXN-9002", "REF-CC-20092", 450.00, 450.00, "USD", "Completed", now - datetime.timedelta(days=12)),
            (created_customers[4].id, "TXN-9003", "REF-WT-30018", 2800.00, 2800.00, "USD", "Completed", now - datetime.timedelta(days=20)),
            (created_customers[5].id, "TXN-9004", "REF-CC-40076", 890.00, 890.00, "USD", "Completed", now - datetime.timedelta(days=6)),
            (created_customers[7].id, "TXN-9005", "REF-ACH-50021", 1650.00, 1650.00, "USD", "Completed", now - datetime.timedelta(days=10)),
            (created_customers[8].id, "TXN-9006", "REF-CC-60032", 520.00, 520.00, "USD", "Completed", now - datetime.timedelta(days=18)),
            (created_customers[9].id, "TXN-9007", "REF-ACH-70094", 750.00, 750.00, "USD", "Completed", now - datetime.timedelta(days=3))
        ]

        created_txns = []
        for cust_id, tx_id, ref, amt, exp_amt, curr, st, t_date in txns_data:
            t = Transaction(
                customer_id=cust_id,
                transaction_id=tx_id,
                transaction_ref=ref,
                amount=amt,
                expected_amount=exp_amt,
                currency=curr,
                status=st,
                transaction_date=t_date
            )
            db.add(t)
            created_txns.append(t)
        db.commit()

        # 4. Seed Complaints
        print("  Creating complaints and tracking lifecycle...")
        complaints_data = [
            (created_customers[1].id, "CMP-5001", "Billing", "Duplicate Charge on Monthly Subscription",
             "We were charged $149.99 twice within three hours on transaction REF-CC-88202. Please reverse the duplicate deduction immediately.",
             "High", "In Progress", agent.id),
            (created_customers[3].id, "CMP-5002", "Billing", "Overcharge discrepancy on monthly invoice",
             "Expected our negotiated $320 monthly charge, but $420 was debited. Need billing credit adjustment memo.",
             "High", "Open", None),
            (created_customers[6].id, "CMP-5003", "Refund", "Refund not received after 8 business days",
             "Agent approved my refund last week for $99.00 but funds have not reached our account. Please investigate ARN.",
             "Medium", "In Progress", agent.id),
            (created_customers[5].id, "CMP-5004", "Technical", "API Webhook failure during peak throughput",
             "Webhook notifications to our inventory endpoint timed out with 504 errors on Saturday morning.",
             "Critical", "Open", None),
            (created_customers[0].id, "CMP-5005", "Service", "Annual SLA Review and scheduled maintenance confirmation",
             "Requesting official confirmation that upcoming database maintenance will occur outside Eastern business hours.",
             "Low", "Resolved", agent.id),
            (created_customers[9].id, "CMP-5006", "Transaction", "Unrecognized charge inquiry on account statement",
             "Saw an unauthorized charge claim in our finance spreadsheet. Need merchant details.",
             "High", "Open", None),
        ]

        created_cmps = []
        for cust_id, cmp_id, cat, subj, desc, prio, st, agent_id in complaints_data:
            c = Complaint(
                complaint_id=cmp_id,
                customer_id=cust_id,
                category=cat,
                subject=subj,
                description=desc,
                priority=prio,
                status=st,
                assigned_agent_id=agent_id,
                created_at=now - datetime.timedelta(days=2),
                resolved_at=now - datetime.timedelta(hours=6) if st == "Resolved" else None
            )
            db.add(c)
            created_cmps.append(c)
        db.commit()

        for c in created_cmps:
            db.refresh(c)
            # Add status history
            h = ComplaintStatusHistory(
                complaint_id=c.id,
                old_status=None,
                new_status=c.status,
                changed_by_id=admin.id,
                notes="Initial seeding intake",
                timestamp=c.created_at
            )
            db.add(h)
        db.commit()

        # 5. Seed Interactions
        print("  Logging customer interactions across channels...")
        interactions_data = [
            (created_customers[0].id, "Email", "The support team was outstanding in answering our maintenance questions. Thank you for the quick turnaround!", "positive", 0.94),
            (created_customers[1].id, "Chat", "I have two identical charges of $149.99 on my bank statement! This is totally unacceptable.", "negative", 0.91),
            (created_customers[2].id, "Email", "Could you provide our current contract expiration date and renewal options?", "neutral", 0.88),
            (created_customers[3].id, "Phone", "I was promised a $320 price tier but I was billed $420. Please fix this invoice discrepancy.", "negative", 0.86),
            (created_customers[4].id, "Web Form", "Our quarterly report metrics were generated flawlessly. Excellent tool.", "positive", 0.96),
            (created_customers[6].id, "Email", "Where is my refund? It has been over a week and nothing has posted to my account.", "negative", 0.89),
            (created_customers[7].id, "Email", "Everything looks good on our statement. Just checking in regarding next month's schedule.", "neutral", 0.92),
            (created_customers[8].id, "Chat", "Great job on the recent UI updates, our team loves the new layout.", "positive", 0.95),
        ]

        for cust_id, chan, text, sent, score in interactions_data:
            i = Interaction(
                customer_id=cust_id,
                channel=chan,
                raw_text=text,
                sentiment=sent,
                sentiment_score=score,
                model_version="lexintel-sentiment-v1.0",
                created_at=now - datetime.timedelta(hours=12)
            )
            db.add(i)
        db.commit()

        # 6. Run Dispute Detection & Recommendations
        print("  Running LexIntel Dispute Detection engine for all customers...")
        for c in created_customers:
            DisputeService.scan_and_detect_disputes(db, customer_id=c.id, user_id=admin.id)

        # 7. Seed Initial Audit Logs
        print("  Creating immutable audit trail logs...")
        AuditService.log(db, "SYSTEM_INIT", "System", "SYSTEM", user_id=admin.id, details={"event": "Enterprise database seeded successfully"})
        AuditService.log(db, "SECURITY_SCAN", "Audit", "SYSTEM", user_id=admin.id, details={"event": "Role-based security rules verified"})

        print("\n[SUCCESS] ResolveX synthetic database seeding completed successfully!")
        print(f"  Customers: {len(created_customers)}")
        print(f"  Complaints: {len(created_cmps)}")
        print(f"  Disputes detected: {db.query(Dispute).count()}")
        print(f"  Recommendations generated: {db.query(Recommendation).count()}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
