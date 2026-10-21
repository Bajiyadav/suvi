from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.complaint import CybercrimeComplaint
from app.schemas.complaint import CybercrimeComplaintResponse, AssociatedEntity
from app.services.complaint_correlation import ComplaintCorrelationService

router = APIRouter()

@router.get("", response_model=List[CybercrimeComplaintResponse])
def list_complaints(limit: int = 50, db: Session = Depends(get_db)):
    """Lists registered cybercrime complaints with linked suspect counts."""
    service = ComplaintCorrelationService(db)
    # We can fetch for default or all
    return service.get_complaints_for_account("ACC-4321")

@router.get("/account/{account_id}", response_model=List[CybercrimeComplaintResponse])
def get_complaints_for_account(account_id: str, db: Session = Depends(get_db)):
    """Fetches complaints linked to a specific account."""
    service = ComplaintCorrelationService(db)
    return service.get_complaints_for_account(account_id)

@router.get("/associated-entities/{account_id}", response_model=List[AssociatedEntity])
def get_associated_entities(account_id: str, db: Session = Depends(get_db)):
    """Returns linked entities (accounts, merchants, mobile, UPI) for investigation."""
    service = ComplaintCorrelationService(db)
    return service.get_associated_entities(account_id)
