import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.ml.sentiment_model import sentiment_model
from app.ml.churn_model import churn_model

router = APIRouter()

@router.get("/")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "operational",
        "app": settings.PROJECT_NAME,
        "engine": settings.AI_ENGINE_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": db_status,
        "models": {
            "sentiment_classifier_ready": sentiment_model.model is not None,
            "churn_predictor_ready": churn_model.model is not None
        }
    }
