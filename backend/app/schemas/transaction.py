from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_id: str
    sender_account_id: str
    receiver_account_id: str
    amount: float
    timestamp: datetime
    channel: str
    narrative: Optional[str] = None
    status: str
    pattern_tag: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None

class TransactionResponse(TransactionBase):
    sender_masked: Optional[str] = None
    receiver_masked: Optional[str] = None

    class Config:
        from_attributes = True

class TimelineItem(BaseModel):
    transaction_id: str
    date_formatted: str
    time_formatted: str
    type: str # INCOMING or OUTGOING
    amount: float
    amount_formatted: str
    counterparty_masked: str
    channel: str
