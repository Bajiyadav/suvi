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
    role: str # SOURCE_VICTIM, MULE_LAYER_1, MULE_LAYER_2, CASHOUT_TERMINAL, CIRCULAR_RETURN
    transaction_id: Optional[str] = None
    is_cycle: Optional[bool] = False

class MoneyTrailSequence(BaseModel):
    root_account_id: str
    total_hops_traced: int
    cycle_detected: bool
    total_volume_traced: float
    hops: List[MoneyTrailHop]
