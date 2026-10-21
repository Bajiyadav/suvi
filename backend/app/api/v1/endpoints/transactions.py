from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionResponse, TimelineItem
from app.services.transaction_analysis import TransactionAnalysisService

router = APIRouter()

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    account_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lists transactions with optional filtering by account."""
    query = db.query(Transaction)
    if account_id:
        query = query.filter(
            (Transaction.sender_account_id == account_id) | (Transaction.receiver_account_id == account_id)
        )
    return query.order_by(Transaction.timestamp.desc()).limit(limit).all()

@router.get("/timeline/{account_id}", response_model=List[TimelineItem])
def get_account_timeline(account_id: str, limit: int = 30, db: Session = Depends(get_db)):
    """Returns chronological transaction stream for an account."""
    service = TransactionAnalysisService(db)
    return service.get_timeline(account_id, limit=limit)
