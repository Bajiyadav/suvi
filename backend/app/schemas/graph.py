from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class GraphNode(BaseModel):
    id: str
    label: str
    type: str # TARGET_ACCOUNT, CONNECTED_ACCOUNT, HIGH_RISK, MERCHANT, COMPLAINT
    risk_score: int
    risk_level: str
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    amount: float
    amount_formatted: str
    transaction_count: int = 1
    type: str = "TRANSACTION"

class NetworkGraphResponse(BaseModel):
    target_node_id: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any] = {}
