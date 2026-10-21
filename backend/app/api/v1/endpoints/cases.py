from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.case import InvestigationCase, CaseStatus
from app.models.audit import AuditLog
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
import datetime

router = APIRouter()

@router.get("", response_model=List[CaseResponse])
def list_cases(db: Session = Depends(get_db)):
    """Lists all active and resolved investigation cases."""
    return db.query(InvestigationCase).order_by(InvestigationCase.created_at.desc()).all()

@router.post("", response_model=CaseResponse)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db)):
    """Opens a new case dossier for an account."""
    new_case = InvestigationCase(
        case_id=f"CASE-{datetime.datetime.utcnow().strftime('%Y-%m%d')}",
        target_account_id=case_in.target_account_id,
        assigned_investigator=case_in.assigned_investigator or "Investigator Cyber Crime Unit",
        case_status=case_in.case_status or CaseStatus.UNDER_INVESTIGATION.value,
        priority=case_in.priority or "HIGH",
        notes=case_in.notes
    )
    db.add(new_case)
    # Write audit log
    audit = AuditLog(
        log_id=f"LOG-{datetime.datetime.utcnow().timestamp()}",
        action="CREATE_CASE",
        target_entity=case_in.target_account_id,
        details=f"Created case {new_case.case_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(case_id: str, case_update: CaseUpdate, db: Session = Depends(get_db)):
    """Updates case status, priority, or notes."""
    case = db.query(InvestigationCase).filter(InvestigationCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if case_update.case_status:
        case.case_status = case_update.case_status
    if case_update.priority:
        case.priority = case_update.priority
    if case_update.notes:
        case.notes = case_update.notes
    case.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(case)
    return case
