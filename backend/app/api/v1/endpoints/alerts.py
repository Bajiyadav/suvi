from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.account import RiskyAccountItem
from app.services.risk_scoring import RiskScoringService

router = APIRouter()

@router.get("", response_model=List[RiskyAccountItem])
def get_alerts_queue(
    min_score: int = Query(60, description="Minimum risk score filter"),
    db: Session = Depends(get_db)
):
    """Returns prioritized queue of flagged accounts requiring investigative review,
    ranked dynamically by computed risk score.
    """
    service = RiskScoringService(db)
    return service.get_ranked_risky_accounts(limit=50, min_score=min_score)
