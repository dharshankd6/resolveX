import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Customer Experience Intelligence & Autonomous Dispute Resolution (ResolveX)"
    AI_ENGINE_NAME: str = "LexIntel AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "resolvex-lexintel-insecure-dev-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (SQLite fallback out-of-the-box or PostgreSQL)
    DATABASE_URL: str = "sqlite:///./resolvex.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
    ]
    
    # ML & Rule Engine Config
    CHURN_LOW_THRESHOLD: float = 0.40
    CHURN_HIGH_THRESHOLD: float = 0.70
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "saved_models")
    
    # Optional LLM / RAG Integration
    LLM_PROVIDER: str = "rule_based"  # "rule_based", "openai", "gemini"
    LLM_API_KEY: str = ""
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
