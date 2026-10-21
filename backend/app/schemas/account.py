from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AccountBase(BaseModel):
    account_id: str
    account_number_masked: str
    bank_name: str
    branch_code: Optional[str] = None
    account_holder_name: str
    account_type: str
    account_category: str
    registered_mobile_masked: str
    upi_vpa: Optional[str] = None
    opened_date: datetime
    current_balance: float
    status: str
    risk_score: int
    risk_tier: str
    key_indicators: Optional[str] = None

class AccountResponse(AccountBase):
    class Config:
        from_attributes = True

class RiskyAccountItem(BaseModel):
    rank: int
    account_id: str
    account_number: str
    risk_score: int
    risk_level: str
    key_indicators: str
    bank_name: str
