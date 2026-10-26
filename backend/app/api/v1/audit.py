from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import User, AuditLog
from app.schemas.schemas import AuditLogResponse

router = APIRouter()

@router.get("/")
def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Analyst"]))
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()

    items = []
    for l in logs:
        items.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": l.user.full_name if l.user else "System",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }
