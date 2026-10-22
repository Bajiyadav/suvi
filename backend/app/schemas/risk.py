from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ContributingFactor(BaseModel):
    indicator_id: str
    name: str
    points_awarded: int
    max_points: int
    percentage_impact: float
    summary: str
    evidence_references: List[str]
    evidence_rows: Optional[List[Dict[str, Any]]] = None

class RiskExplanationResponse(BaseModel):
    account_id: str
    account_number_masked: str
    risk_score: int = Field(ge=0, le=100)
    risk_tier: str
    confidence: float
    top_contributing_factors: List[ContributingFactor]
    disclaimer: str
