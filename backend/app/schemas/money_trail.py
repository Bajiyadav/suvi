from pydantic import BaseModel
from typing import List, Optional

class FlowAnalysisSummary(BaseModel):
    account_id: str
    account_number_masked: str
    risk_score: int
    incoming_total: float
    incoming_total_formatted: str
    incoming_count: int
    layering_total: float
    layering_total_formatted: str
    layering_count: int
    outflow_total: float
    outflow_total_formatted: str
    outflow_count: int
    retained_balance: float
    retained_percentage: float

class MoneyTrailHop(BaseModel):
    hop_level: int
    from_account_id: str
    from_account_masked: str
    to_account_id: str
    to_account_masked: str
    amount: float
    amount_formatted: str
    timestamp: str
    channel: str
    role: str # SOURCE_VICTIM, MULE_HUB, SECONDARY_MULE, CASHOUT_TERMINAL
