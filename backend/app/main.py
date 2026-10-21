from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.api import api_router
from app.seed.generate_fixtures import seed_database
import os

# Initialize database schema on startup if database file not yet created
Base.metadata.create_all(bind=engine)

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

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["Health"])
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
