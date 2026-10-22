from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CaseCreate(BaseModel):
    target_account_id: str
    assigned_investigator: Optional[str] = "Investigator Cyber Crime Unit"
    case_status: Optional[str] = "Under Investigation"
    priority: Optional[str] = "HIGH"
    notes: Optional[str] = None

class CaseUpdate(BaseModel):
    case_status: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

class CaseResponse(BaseModel):
    case_id: str
    target_account_id: str
    assigned_investigator: str
    case_status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class WatchlistCreate(BaseModel):
    account_id: str
    reason: Optional[str] = "Flagged during mule account investigation"
    priority: Optional[str] = "HIGH"
    investigator_id: Optional[str] = None

class WatchlistResponse(BaseModel):
    entry_id: str
    account_id: str
    account_number_masked: Optional[str] = None
    bank_name: Optional[str] = None
    risk_score: Optional[int] = None
    reason: Optional[str] = None
    priority: str
    added_at: datetime
    investigator_id: Optional[str] = None
    is_active: bool
    removed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvestigationNoteCreate(BaseModel):
    account_id: str
    note_text: str
    case_id: Optional[str] = None
    author: Optional[str] = None

class InvestigationNoteResponse(BaseModel):
    note_id: str
    account_id: str
    case_id: Optional[str] = None
    note_text: str
    author: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ActionRequest(BaseModel):
    account_id: str
    action_type: str
    justification: Optional[str] = None

class ActionRequestResponse(BaseModel):
    status: str
    action_type: str
    account_id: str
    investigator: str
    message: str

class AuditLogResponse(BaseModel):
    log_id: str
    timestamp: datetime
    actor: str
    action: str
    target_entity: str
    details: Optional[str] = None

    class Config:
        from_attributes = True

