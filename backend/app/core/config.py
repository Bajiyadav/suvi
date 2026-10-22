from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FraudTrace AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    APP_ENV: str = "development"

    # Database
    DATABASE_URL: str = "sqlite:///./fraudtrace.db"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Configurable Scoring Weights
    WEIGHT_RAPID_TRANSFER: int = 20
    WEIGHT_PASS_THROUGH: int = 20
    WEIGHT_MULTI_HOP: int = 20
    WEIGHT_BASELINE_DEVIATION: int = 15
    WEIGHT_STRUCTURING: int = 10
    WEIGHT_COMPLAINTS: int = 15
    HIGH_RISK_THRESHOLD: int = 70

    SYNTHETIC_DATA_FLAG: bool = True

    # Security & Authentication Settings
    AUTH_ENABLED: bool = False
    API_KEY: str = "ft-investigator-secret-key-2026"
    JWT_SECRET: str = "cyber-hackathon-2026-fraudtrace-ai-jwt-secret"
    RESTRICT_AUTOMATED_ACTIONS: bool = True


    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
