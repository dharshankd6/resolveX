from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import User
from app.schemas.schemas import RecommendationResponse, RecommendationReview
from app.services.services import RecommendationService

router = APIRouter()

@router.get("/")
def list_recommendations(
    approval_status: Optional[str] = None,
    customer_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = RecommendationService.list_recommendations(
        db, approval_status=approval_status, customer_id=customer_id, skip=skip, limit=limit
    )
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.post("/{rec_id}/review")
def review_recommendation(
    rec_id: int,
    review_in: RecommendationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Support Agent"]))
):
    rec = RecommendationService.review_recommendation(
        db, rec_id=rec_id, review_in=review_in, user_id=current_user.id
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {
        "message": f"Recommendation successfully marked as {rec.approval_status}",
        "recommendation_id": rec.recommendation_id,
        "status": rec.approval_status
    }
