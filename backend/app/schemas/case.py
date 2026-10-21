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
