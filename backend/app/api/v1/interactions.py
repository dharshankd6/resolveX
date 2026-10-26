from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    InteractionCreate, InteractionResponse,
    SentimentAnalysisRequest, SentimentAnalysisResponse
)
from app.services.services import InteractionService
from app.ml.sentiment_model import sentiment_model

router = APIRouter()

@router.get("/", response_model=List[InteractionResponse])
def list_interactions(
    customer_id: Optional[int] = None,
    sentiment: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return InteractionService.list_interactions(
        db, customer_id=customer_id, sentiment=sentiment, skip=skip, limit=limit
    )

@router.post("/", response_model=InteractionResponse)
def create_interaction(
    interaction_in: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return InteractionService.create_interaction(db, interaction_in, user_id=current_user.id)

@router.post("/analyze", response_model=SentimentAnalysisResponse)
def analyze_sentiment(
    req: SentimentAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    result = sentiment_model.predict(req.text)
    return SentimentAnalysisResponse(
        sentiment=result["sentiment"],
        confidence=result["confidence"],
        model_version=result["model_version"],
        is_fallback=result["is_fallback"]
    )
