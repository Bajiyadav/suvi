from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.account import Account, RiskTier
from app.schemas.account import RiskyAccountItem

router = APIRouter()

@router.get("", response_model=List[RiskyAccountItem])
def get_alerts_queue(
    min_score: int = Query(70, description="Minimum risk score filter"),
    db: Session = Depends(get_db)
):
    """Returns prioritized queue of flagged accounts requiring investigative review."""
    accounts = db.query(Account).filter(Account.risk_score >= min_score).order_by(Account.risk_score.desc()).all()
    results = []
    for rank, acc in enumerate(accounts, start=1):
        results.append({
            "rank": rank,
            "account_id": acc.account_id,
            "account_number": acc.account_number_masked,
            "risk_score": acc.risk_score,
            "risk_level": "High" if acc.risk_score >= 80 else "Medium",
            "key_indicators": acc.key_indicators or "Multiple risk anomalies detected",
            "bank_name": acc.bank_name
        })
    return results
