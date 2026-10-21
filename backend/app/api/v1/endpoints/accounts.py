from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.account import Account
from app.schemas.account import AccountResponse
from app.schemas.risk import RiskExplanationResponse
from app.services.risk_scoring import RiskScoringService

router = APIRouter()

@router.get("", response_model=List[AccountResponse])
def list_accounts(
    risk_tier: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lists accounts with optional filtering by risk tier."""
    query = db.query(Account)
    if risk_tier:
        query = query.filter(Account.risk_tier == risk_tier.upper())
    return query.limit(limit).all()

@router.get("/{account_id}", response_model=AccountResponse)
def get_account_detail(account_id: str, db: Session = Depends(get_db)):
    """Fetches single account profile details."""
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@router.get("/{account_id}/risk", response_model=RiskExplanationResponse)
def get_account_risk(account_id: str, db: Session = Depends(get_db)):
    """Returns detailed explainable risk calculation for the account."""
    service = RiskScoringService(db)
    return service.calculate_explainable_risk(account_id)
