from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.security import get_current_investigator
from app.core.database import Base, engine, SessionLocal
from app.models.account import Account
from app.api.v1.api import api_router
from app.seed.generate_fixtures import seed_database
import os

# Validate configuration on startup (fails closed if production secrets are missing/insecure)
settings.validate_production_configuration()

# Initialize database schema on startup if database file not yet created
Base.metadata.create_all(bind=engine)

# Auto-seed deterministic synthetic fixtures on first launch if empty
_init_db = SessionLocal()
try:
    if _init_db.query(Account).count() == 0:
        seed_database()
finally:
    _init_db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Financial Fraud Investigation & Suspected Mule Account Detection Platform (Cyber Hackathon 2026 PS-01)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.rate_limiter import RateLimitMiddleware

# Configure API Rate Limiting (Sliding Window & DoS Throttling)
app.add_middleware(RateLimitMiddleware)

from app.api.v1.endpoints import auth

# Mount Authentication router (login is public; me/logout require authentication)
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"]
)

# Register API v1 routes with global investigator authentication dependency
app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX,
    dependencies=[Depends(get_current_investigator)]
)

@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "synthetic_mode": settings.SYNTHETIC_DATA_FLAG,
        "disclaimer": "All accounts and transaction records are 100% synthetic."
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to FraudTrace AI API — Team SUVI (PS-01)",
        "docs": "/docs",
        "health": "/health"
    }
