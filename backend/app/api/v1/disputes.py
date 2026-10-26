from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import User, Dispute
from app.schemas.schemas import DisputeResponse, DisputeReviewUpdate
from app.services.services import DisputeService

router = APIRouter()

@router.get("/")
def list_disputes(
    status: Optional[str] = None,
    risk_priority: Optional[str] = None,
    customer_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = DisputeService.list_disputes(
        db, status=status, risk_priority=risk_priority, customer_id=customer_id, skip=skip, limit=limit
    )
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.post("/detect/{customer_id}")
def scan_customer_disputes(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Support Agent", "Analyst"]))
):
    detected = DisputeService.scan_and_detect_disputes(db, customer_id=customer_id, user_id=current_user.id)
    return {
        "message": f"Scan complete. {len(detected)} potential dispute(s) identified for investigation.",
        "detected_count": len(detected)
    }

@router.post("/{dispute_id}/review")
def review_dispute(
    dispute_id: int,
    review_in: DisputeReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Support Agent"]))
):
    dispute = DisputeService.review_dispute(db, dispute_id=dispute_id, review_in=review_in, user_id=current_user.id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return {
        "message": "Dispute reviewed successfully",
        "status": dispute.status,
        "dispute_id": dispute.dispute_id
    }
