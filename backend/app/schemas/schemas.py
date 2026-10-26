from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "Support Agent"  # Admin, Support Agent, Analyst
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    customer_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    tenure_months: int = 1
    contract_type: str = "Month-to-month"
    payment_method: str = "Electronic check"
    monthly_spending: float = 0.0
    account_status: str = "Active"

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    tenure_months: Optional[int] = None
    contract_type: Optional[str] = None
    payment_method: Optional[str] = None
    monthly_spending: Optional[float] = None
    account_status: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    latest_churn_risk: Optional[str] = None
    latest_churn_probability: Optional[float] = None

    class Config:
        from_attributes = True

# --- Interaction Schemas ---
class InteractionBase(BaseModel):
    channel: str = "Email"
    raw_text: str

class InteractionCreate(InteractionBase):
    customer_id: int

class InteractionResponse(InteractionBase):
    id: int
    customer_id: int
    sentiment: str
    sentiment_score: float
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    transaction_id: str
    transaction_ref: str
    amount: float
    expected_amount: Optional[float] = None
    currency: str = "USD"
    status: str = "Completed"

class TransactionCreate(TransactionBase):
    customer_id: int
    transaction_date: Optional[datetime] = None

class TransactionResponse(TransactionBase):
    id: int
    customer_id: int
    transaction_date: datetime

    class Config:
        from_attributes = True

# --- Complaint Schemas ---
class ComplaintBase(BaseModel):
    category: str
    subject: str
    description: str
    priority: str = "Medium"

class ComplaintCreate(ComplaintBase):
    customer_id: int
    complaint_id: Optional[str] = None

class ComplaintUpdate(BaseModel):
    category: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class ComplaintStatusUpdate(BaseModel):
    new_status: str
    notes: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: int
    complaint_id: str
    customer_id: int
    customer_name: Optional[str] = None
    status: str
    assigned_agent_id: Optional[int] = None
    assigned_agent_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Dispute Schemas ---
class DisputeBase(BaseModel):
    customer_id: int
    transaction_id: Optional[int] = None
    complaint_id: Optional[int] = None
    detection_reasons: List[str]
    risk_priority: str = "Medium"
    suggested_action: str
    human_review_required: bool = True
    status: str = "Under Review"

class DisputeCreate(DisputeBase):
    dispute_id: Optional[str] = None

class DisputeReviewUpdate(BaseModel):
    status: str  # Approved, Rejected, Resolved, Under Review
    review_notes: str

class DisputeResponse(DisputeBase):
    id: int
    dispute_id: str
    reviewed_by_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer_name: Optional[str] = None
    transaction_ref: Optional[str] = None

    class Config:
        from_attributes = True

# --- Recommendation Schemas ---
class RecommendationBase(BaseModel):
    customer_id: int
    complaint_id: Optional[int] = None
    dispute_id: Optional[int] = None
    recommended_action: str
    reason: str
    supporting_evidence: str
    recommended_priority: str = "Medium"
    approval_status: str = "Pending"

class RecommendationCreate(RecommendationBase):
    recommendation_id: Optional[str] = None

class RecommendationReview(BaseModel):
    approval_status: str  # Approved, Rejected, Modified
    reviewer_notes: Optional[str] = None
    modified_action: Optional[str] = None

class RecommendationResponse(RecommendationBase):
    id: int
    recommendation_id: str
    reviewer_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    reviewer_notes: Optional[str] = None
    review_timestamp: Optional[datetime] = None
    created_at: datetime
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Machine Learning & Prediction Schemas ---
class SentimentAnalysisRequest(BaseModel):
    text: str

class SentimentAnalysisResponse(BaseModel):
    sentiment: str  # positive, neutral, negative
    confidence: float
    model_version: str
    is_fallback: bool = False

class ChurnPredictionRequest(BaseModel):
    customer_id: Optional[int] = None
    tenure_months: int
    monthly_spending: float
    complaint_count: int = 0
    contract_type: str = "Month-to-month"
    payment_method: str = "Electronic check"

class ChurnPredictionResponse(BaseModel):
    customer_id: Optional[int] = None
    churn_probability: float
    churn_risk_tier: str  # Low, Medium, High
    contributing_factors: List[str]
    model_version: str
    is_fallback: bool = False

# --- Dashboard & Analytics Schemas ---
class DashboardOverview(BaseModel):
    total_customers: int
    total_complaints: int
    open_complaints: int
    resolved_complaints: int
    disputes_requiring_review: int
    high_churn_risk_customers: int
    avg_resolution_time_hours: float
    sentiment_distribution: Dict[str, int]
    complaint_category_distribution: Dict[str, int]
    churn_risk_distribution: Dict[str, int]
    recent_complaints: List[ComplaintResponse]
    recent_disputes: List[DisputeResponse]

# --- Audit Log Schema ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
