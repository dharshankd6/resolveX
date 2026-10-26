from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    SentimentAnalysisRequest, SentimentAnalysisResponse,
    ChurnPredictionRequest, ChurnPredictionResponse
)
from app.ml.sentiment_model import sentiment_model
from app.ml.churn_model import churn_model

router = APIRouter()

@router.post("/sentiment", response_model=SentimentAnalysisResponse)
def predict_sentiment(req: SentimentAnalysisRequest, current_user: User = Depends(get_current_user)):
    res = sentiment_model.predict(req.text)
    return SentimentAnalysisResponse(
        sentiment=res["sentiment"],
        confidence=res["confidence"],
        model_version=res["model_version"],
        is_fallback=res["is_fallback"]
    )

@router.post("/churn", response_model=ChurnPredictionResponse)
def predict_churn(req: ChurnPredictionRequest, current_user: User = Depends(get_current_user)):
    res = churn_model.predict(
        tenure_months=req.tenure_months,
        monthly_spending=req.monthly_spending,
        complaint_count=req.complaint_count,
        contract_type=req.contract_type,
        payment_method=req.payment_method
    )
    return ChurnPredictionResponse(
        customer_id=req.customer_id,
        churn_probability=res["churn_probability"],
        churn_risk_tier=res["churn_risk_tier"],
        contributing_factors=res["contributing_factors"],
        model_version=res["model_version"],
        is_fallback=res["is_fallback"]
    )

@router.get("/status")
def get_ml_status(current_user: User = Depends(get_current_user)):
    return {
        "engine_name": "LexIntel AI",
        "models": {
            "sentiment_classifier": {
                "version": sentiment_model.version,
                "is_loaded": sentiment_model.model is not None,
                "algorithm": "TF-IDF + Logistic Regression",
                "classes": ["positive", "neutral", "negative"]
            },
            "churn_predictor": {
                "version": churn_model.version,
                "is_loaded": churn_model.model is not None,
                "algorithm": "ColumnTransformer + Random Forest Classifier",
                "features": churn_model.numeric_features + churn_model.categorical_features,
                "thresholds": {"low": "< 0.40", "medium": "0.40 - 0.70", "high": ">= 0.70"}
            },
            "dispute_detector": {
                "type": "Explainable Rule-Based Telemetry Engine",
                "version": "v1.0-deterministic",
                "rules_active": ["duplicate_charges", "amount_mismatch", "delayed_refund", "unauthorized_claim", "frequency_anomaly"]
            },
            "recommendation_engine": {
                "type": "Deterministic Resolution Decision Matrix",
                "version": "v1.0-governed",
                "human_in_the_loop": True
            }
        }
    }
