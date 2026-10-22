from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.account import Account
from app.schemas.money_trail import MoneyTrailHop, FlowAnalysisSummary, MoneyTrailSequence
from app.services.money_trail import MoneyTrailService
from app.services.transaction_analysis import TransactionAnalysisService
from app.services.risk_scoring import RiskScoringService

router = APIRouter()

@router.get("/{account_id}", response_model=List[MoneyTrailHop])
def get_money_trail(
    account_id: str,
    max_depth: int = Query(4, ge=1, le=6, description="Maximum traversal depth between 1 and 6 hops"),
    direction: str = Query("both", description="Traversal direction: forward, backward, or both"),
    db: Session = Depends(get_db)
):
    """Traces multi-hop fund flows forwards and backwards around an account.
    Returns 404 if the target account does not exist.
    """
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"Account '{account_id}' not found. Cannot trace money trail for nonexistent account."
        )

    service = MoneyTrailService(db)
    return service.trace_money_trail(account_id, max_depth=max_depth, direction=direction)


@router.get("/{account_id}/sequence", response_model=MoneyTrailSequence)
def get_money_trail_sequence(
    account_id: str,
    max_depth: int = Query(4, ge=1, le=6, description="Maximum traversal depth between 1 and 6 hops"),
    direction: str = Query("both", description="Traversal direction: forward, backward, or both"),
    db: Session = Depends(get_db)
):
    """Returns structured multi-hop traversal sequence with cycle detection and volume analysis."""
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"Account '{account_id}' not found. Cannot trace money trail for nonexistent account."
        )

    service = MoneyTrailService(db)
    return service.get_money_trail_sequence(account_id, max_depth=max_depth, direction=direction)


@router.get("/{account_id}/flow-summary", response_model=FlowAnalysisSummary)
def get_flow_summary(account_id: str, db: Session = Depends(get_db)):
    """Returns incoming vs layering vs outflow balance breakdown dynamically.
    Returns 404 if the target account does not exist.
    """
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"Account '{account_id}' not found. Cannot compute flow summary for nonexistent account."
        )

    flow_service = TransactionAnalysisService(db)
    summary = flow_service.get_flow_analysis(account_id)
    summary["account_number_masked"] = account.account_number_masked

    risk_serv = RiskScoringService(db)
    summary["risk_score"] = risk_serv.calculate_explainable_risk(account_id)["risk_score"]
    return summary
