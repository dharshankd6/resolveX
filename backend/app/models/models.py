import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Support Agent")  # Admin, Support Agent, Analyst
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    assigned_complaints = relationship("Complaint", back_populates="assigned_agent", foreign_keys="Complaint.assigned_agent_id")
    audit_logs = relationship("AuditLog", back_populates="user")
    reviewed_disputes = relationship("Dispute", back_populates="reviewer", foreign_keys="Dispute.reviewed_by_id")
    reviewed_recommendations = relationship("Recommendation", back_populates="reviewer", foreign_keys="Recommendation.reviewer_id")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    tenure_months = Column(Integer, default=1)
    contract_type = Column(String(50), default="Month-to-month")  # Month-to-month, One year, Two year
    payment_method = Column(String(50), default="Electronic check")  # Electronic check, Mailed check, Bank transfer, Credit card
    monthly_spending = Column(Float, default=0.0)
    account_status = Column(String(50), default="Active")  # Active, Inactive, Suspended
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    interactions = relationship("Interaction", back_populates="customer", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="customer", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="customer", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="customer", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="customer", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="customer", cascade="all, delete-orphan")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(50), default="Email")  # Email, Chat, Phone, Web Form
    raw_text = Column(Text, nullable=False)
    sentiment = Column(String(50), nullable=False)  # positive, neutral, negative
    sentiment_score = Column(Float, default=0.0)
    model_version = Column(String(50), default="lexintel-sentiment-v1")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="interactions")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # Billing, Refund, Technical, Service, Transaction, Other
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    status = Column(String(50), default="Open")  # Open, In Progress, Pending, Resolved, Closed
    assigned_agent_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    customer = relationship("Customer", back_populates="complaints")
    assigned_agent = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_agent_id])
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="complaint")
    recommendations = relationship("Recommendation", back_populates="complaint")


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    complaint = relationship("Complaint", back_populates="status_history")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_ref = Column(String(100), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    expected_amount = Column(Float, nullable=True)
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="Completed")  # Completed, Pending, Failed, Reversed
    transaction_date = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="transactions")
    disputes = relationship("Dispute", back_populates="transaction")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_type = Column(String(50), nullable=False)  # churn, sentiment
    churn_probability = Column(Float, nullable=True)
    churn_risk_tier = Column(String(50), nullable=True)  # Low, Medium, High
    contributing_factors = Column(JSON, nullable=True)
    model_name = Column(String(100), default="LexIntel-Predictor")
    model_version = Column(String(50), default="v1.0")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="predictions")


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    detection_reasons = Column(JSON, nullable=False)  # list of trigger reasons
    risk_priority = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    suggested_action = Column(Text, nullable=False)
    human_review_required = Column(Boolean, default=True)
    status = Column(String(50), default="Under Review")  # Detected, Under Review, Approved, Rejected, Resolved
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="disputes")
    transaction = relationship("Transaction", back_populates="disputes")
    complaint = relationship("Complaint", back_populates="disputes")
    reviewer = relationship("User", back_populates="reviewed_disputes", foreign_keys=[reviewed_by_id])
    recommendations = relationship("Recommendation", back_populates="dispute")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id", ondelete="SET NULL"), nullable=True)
    recommended_action = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=False)
    recommended_priority = Column(String(50), default="Medium")
    approval_status = Column(String(50), default="Pending")  # Pending, Approved, Rejected, Modified
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    review_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="recommendations")
    complaint = relationship("Complaint", back_populates="recommendations")
    dispute = relationship("Dispute", back_populates="recommendations")
    reviewer = relationship("User", back_populates="reviewed_recommendations", foreign_keys=[reviewer_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, DISPUTE_REVIEW, RECOMMENDATION_APPROVAL, CUSTOMER_UPDATE, etc.
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
