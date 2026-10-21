from pydantic import BaseModel
from typing import List, Dict, Any
from app.schemas.account import RiskyAccountItem
from app.schemas.complaint import CybercrimeComplaintResponse, AssociatedEntity
from app.schemas.transaction import TimelineItem
from app.schemas.money_trail import FlowAnalysisSummary
from app.schemas.risk import RiskExplanationResponse
from app.schemas.graph import NetworkGraphResponse

class KpiMetrics(BaseModel):
    high_risk_accounts: int
    high_risk_trend: str
    suspicious_networks: int
    networks_trend: str
    linked_complaints: int
    complaints_trend: str
    total_transactions_analyzed: str
    transactions_timeframe: str

class DashboardOverviewResponse(BaseModel):
    kpis: KpiMetrics
    risky_accounts: List[RiskyAccountItem]
    focused_account: str
    flow_analysis: FlowAnalysisSummary
    timeline: List[TimelineItem]
    risk_explanation: RiskExplanationResponse
    linked_complaints: List[CybercrimeComplaintResponse]
    associated_entities: List[AssociatedEntity]
    network_graph: NetworkGraphResponse
