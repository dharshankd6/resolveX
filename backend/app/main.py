import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
import app.models.models  # ensure models are registered with Base

# Import Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.customers import router as customers_router
from app.api.v1.interactions import router as interactions_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.disputes import router as disputes_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.ml import router as ml_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.audit import router as audit_router
from app.api.v1.health import router as health_router

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Customer Experience Intelligence & Autonomous Dispute Resolution API powered by LexIntel AI engine.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev flex, or settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID & Logging Middleware
@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Register API Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["User & Role Management"])
app.include_router(customers_router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customer Management"])
app.include_router(interactions_router, prefix=f"{settings.API_V1_STR}/interactions", tags=["Customer Interactions & Sentiment"])
app.include_router(complaints_router, prefix=f"{settings.API_V1_STR}/complaints", tags=["Complaint Tracking"])
app.include_router(transactions_router, prefix=f"{settings.API_V1_STR}/transactions", tags=["Transactions"])
app.include_router(disputes_router, prefix=f"{settings.API_V1_STR}/disputes", tags=["Dispute Detection & Investigation"])
app.include_router(recommendations_router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["Resolution Recommendations"])
app.include_router(ml_router, prefix=f"{settings.API_V1_STR}/ml", tags=["LexIntel AI Engine"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Dashboard & Analytics"])
app.include_router(audit_router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Logs"])
app.include_router(health_router, prefix=f"{settings.API_V1_STR}/health", tags=["System Health"])

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "engine": settings.AI_ENGINE_NAME,
        "status": "online",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
