from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import User, Complaint, ComplaintStatusHistory
from app.schemas.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintStatusUpdate, ComplaintResponse
)
from app.services.services import ComplaintService

router = APIRouter()

@router.get("/")
def list_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    customer_id: Optional[int] = None,
    assigned_agent_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = ComplaintService.list_complaints(
        db, status=status, priority=priority, category=category,
        customer_id=customer_id, assigned_agent_id=assigned_agent_id,
        search=search, skip=skip, limit=limit
    )
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{complaint_id}")
def get_complaint_detail(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    history = db.query(ComplaintStatusHistory).filter(
        ComplaintStatusHistory.complaint_id == complaint.id
    ).order_by(ComplaintStatusHistory.timestamp.asc()).all()

    return {
        "complaint": {
            "id": complaint.id,
            "complaint_id": complaint.complaint_id,
            "customer_id": complaint.customer_id,
            "customer_name": complaint.customer.full_name if complaint.customer else "Unknown",
            "category": complaint.category,
            "subject": complaint.subject,
            "description": complaint.description,
            "priority": complaint.priority,
            "status": complaint.status,
            "assigned_agent_id": complaint.assigned_agent_id,
            "assigned_agent_name": complaint.assigned_agent.full_name if complaint.assigned_agent else "Unassigned",
            "resolution_notes": complaint.resolution_notes,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
            "resolved_at": complaint.resolved_at
        },
        "history": [
            {
                "id": h.id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "timestamp": h.timestamp
            }
            for h in history
        ],
        "recommendations": [
            {
                "id": r.id,
                "recommendation_id": r.recommendation_id,
                "recommended_action": r.recommended_action,
                "reason": r.reason,
                "supporting_evidence": r.supporting_evidence,
                "recommended_priority": r.recommended_priority,
                "approval_status": r.approval_status
            }
            for r in complaint.recommendations
        ]
    }

@router.post("/", response_model=ComplaintResponse)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = ComplaintService.create_complaint(db, complaint_in, user_id=current_user.id)
    return {
        "id": complaint.id,
        "complaint_id": complaint.complaint_id,
        "customer_id": complaint.customer_id,
        "customer_name": complaint.customer.full_name if complaint.customer else "Unknown",
        "category": complaint.category,
        "subject": complaint.subject,
        "description": complaint.description,
        "priority": complaint.priority,
        "status": complaint.status,
        "assigned_agent_id": complaint.assigned_agent_id,
        "assigned_agent_name": complaint.assigned_agent.full_name if complaint.assigned_agent else "Unassigned",
        "resolution_notes": complaint.resolution_notes,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "resolved_at": complaint.resolved_at
    }

@router.put("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    complaint_in: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = ComplaintService.update_complaint(db, complaint_id, complaint_in, user_id=current_user.id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {
        "id": complaint.id,
        "complaint_id": complaint.complaint_id,
        "customer_id": complaint.customer_id,
        "customer_name": complaint.customer.full_name if complaint.customer else "Unknown",
        "category": complaint.category,
        "subject": complaint.subject,
        "description": complaint.description,
        "priority": complaint.priority,
        "status": complaint.status,
        "assigned_agent_id": complaint.assigned_agent_id,
        "assigned_agent_name": complaint.assigned_agent.full_name if complaint.assigned_agent else "Unassigned",
        "resolution_notes": complaint.resolution_notes,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "resolved_at": complaint.resolved_at
    }

@router.post("/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    status_in: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_in = ComplaintUpdate(status=status_in.new_status, resolution_notes=status_in.notes)
    complaint = ComplaintService.update_complaint(db, complaint_id, update_in, user_id=current_user.id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"message": f"Complaint status updated to {status_in.new_status}"}
