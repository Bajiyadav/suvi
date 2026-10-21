from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CybercrimeComplaintResponse(BaseModel):
    complaint_id: str
    incident_date: datetime
    complaint_type: str
    reported_loss_amount: float
    reported_loss_formatted: str
    victim_account_id: Optional[str] = None
    suspect_account_id: Optional[str] = None
    status: str
    police_station_jurisdiction: str
    linked_accounts_count: int
    description: Optional[str] = None

    class Config:
        from_attributes = True

class AssociatedEntity(BaseModel):
    entity_type: str  # Account, Merchant, Mobile, UPI ID
    name_or_id: str
    connections: str
    risk_level: Optional[str] = "Medium"
