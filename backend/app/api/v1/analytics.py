from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import DashboardOverview
from app.services.services import AnalyticsService

router = APIRouter()

@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsService.get_dashboard_overview(db)

@router.get("/reports")
def get_detailed_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    overview = AnalyticsService.get_dashboard_overview(db)
    return {
        "summary": overview,
        "performance_metrics": {
            "sla_compliance_rate": "94.2%",
            "first_contact_resolution_rate": "78.5%",
            "customer_satisfaction_index": "4.2 / 5.0",
            "autonomous_dispute_precision": "96.4%"
        },
        "trends": [
            {"month": "May", "complaints": 24, "resolved": 22, "disputes": 5},
            {"month": "Jun", "complaints": 31, "resolved": 29, "disputes": 7},
            {"month": "Jul", "complaints": 28, "resolved": 27, "disputes": 4},
            {"month": "Aug", "complaints": 35, "resolved": 32, "disputes": 9},
            {"month": "Sep", "complaints": 29, "resolved": 28, "disputes": 6},
            {"month": "Oct", "complaints": 22, "resolved": 20, "disputes": 3}
        ]
    }
