import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.models import User, Customer, Complaint, Transaction, Dispute, Recommendation
from app.ml.sentiment_model import sentiment_model
from app.ml.churn_model import churn_model
from app.ml.dispute_engine import dispute_engine

# Use an in-memory or test SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_resolvex.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test admin & test agent
    admin = User(
        email="testadmin@resolvex.ai",
        full_name="Test Admin",
        hashed_password=get_password_hash("TestAdmin123!"),
        role="Admin",
        is_active=True
    )
    agent = User(
        email="testagent@resolvex.ai",
        full_name="Test Agent",
        hashed_password=get_password_hash("TestAgent123!"),
        role="Support Agent",
        is_active=True
    )
    db.add_all([admin, agent])
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=engine)

def get_admin_token():
    resp = client.post("/api/v1/auth/login", json={
        "email": "testadmin@resolvex.ai",
        "password": "TestAdmin123!"
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]

# 1. Test Authentication
def test_auth_login_success():
    token = get_admin_token()
    assert token is not None

def test_auth_login_invalid():
    resp = client.post("/api/v1/auth/login", json={
        "email": "testadmin@resolvex.ai",
        "password": "WrongPassword!"
    })
    assert resp.status_code == 401

def test_unauthorized_access():
    resp = client.get("/api/v1/customers/")
    assert resp.status_code == 401

# 2. Test Customer CRUD
def test_customer_crud():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create
    create_payload = {
        "customer_id": "TEST-CUST-001",
        "full_name": "Test Customer Alpha",
        "email": "alpha@testcustomer.com",
        "phone": "+1-555-9988",
        "tenure_months": 18,
        "contract_type": "One year",
        "payment_method": "Credit card",
        "monthly_spending": 250.0,
        "account_status": "Active"
    }
    create_res = client.post("/api/v1/customers/", json=create_payload, headers=headers)
    assert create_res.status_code == 200
    cust_data = create_res.json()
    assert cust_data["customer_id"] == "TEST-CUST-001"
    customer_pk = cust_data["id"]

    # Read / List
    list_res = client.get("/api/v1/customers/", headers=headers)
    assert list_res.status_code == 200
    assert any(c["customer_id"] == "TEST-CUST-001" for c in list_res.json()["items"])

    # Detail 360
    detail_res = client.get(f"/api/v1/customers/{customer_pk}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["customer"]["full_name"] == "Test Customer Alpha"

    # Update
    update_res = client.put(f"/api/v1/customers/{customer_pk}", json={"monthly_spending": 299.0}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["monthly_spending"] == 299.0

# 3. Test Complaint Lifecycle
def test_complaint_lifecycle():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get customer
    cust_res = client.get("/api/v1/customers/", headers=headers)
    cust_id = cust_res.json()["items"][0]["id"]

    # Create complaint
    cmp_payload = {
        "customer_id": cust_id,
        "category": "Billing",
        "subject": "Incorrect Invoice Tax Deduction",
        "description": "Tax was billed at 12% instead of agreed 8% enterprise tariff exemption.",
        "priority": "High"
    }
    create_res = client.post("/api/v1/complaints/", json=cmp_payload, headers=headers)
    assert create_res.status_code == 200
    cmp_id = create_res.json()["id"]

    # Update status
    status_res = client.post(f"/api/v1/complaints/{cmp_id}/status", json={"new_status": "In Progress", "notes": "Assigned to tax desk"}, headers=headers)
    assert status_res.status_code == 200

# 4. Test Machine Learning Models
def test_sentiment_inference():
    res_pos = sentiment_model.predict("The resolution for my billing inquiry was handled promptly and courteously. Very satisfied!")
    assert res_pos["sentiment"] == "positive"
    assert res_pos["confidence"] > 0.5
    assert not res_pos["is_fallback"]

    res_neg = sentiment_model.predict("I was charged twice for the same monthly transaction! This is completely unacceptable.")
    assert res_neg["sentiment"] == "negative"
    assert res_neg["confidence"] > 0.5
    assert not res_neg["is_fallback"]

def test_churn_inference():
    # High risk customer: month to month, low tenure, high complaints
    res_high = churn_model.predict(
        tenure_months=2,
        monthly_spending=150.0,
        complaint_count=3,
        contract_type="Month-to-month",
        payment_method="Electronic check"
    )
    assert res_high["churn_risk_tier"] in ["High", "Medium"]
    assert len(res_high["contributing_factors"]) > 0

    # Low risk customer: 48 months tenure, zero complaints, two year contract
    res_low = churn_model.predict(
        tenure_months=48,
        monthly_spending=50.0,
        complaint_count=0,
        contract_type="Two year",
        payment_method="Credit card"
    )
    assert res_low["churn_risk_tier"] == "Low"

# 5. Test Dispute Detection Rules
def test_dispute_detection_duplicate_rule():
    class DummyTxn:
        def __init__(self, id, ref, amt, exp_amt, date):
            self.id = id
            self.transaction_ref = ref
            self.amount = amt
            self.expected_amount = exp_amt
            self.transaction_date = date

    import datetime
    now = datetime.datetime.utcnow()
    txns = [
        DummyTxn(1, "REF-101", 99.99, 99.99, now - datetime.timedelta(hours=2)),
        DummyTxn(2, "REF-102", 99.99, 99.99, now - datetime.timedelta(hours=1))
    ]
    detected = dispute_engine.evaluate(customer_id=1, transactions=txns, complaints=[])
    assert len(detected) >= 1
    assert any("duplicate" in r.lower() for r in detected[0]["detection_reasons"][0].lower().split())

# 6. Test Dashboard Aggregation Endpoint
def test_dashboard_overview():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/analytics/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_customers" in data
    assert "sentiment_distribution" in data
    assert "complaint_category_distribution" in data

# 7. Test Health Endpoint
def test_health_check():
    res = client.get("/api/v1/health/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert data["database"] == "healthy"
