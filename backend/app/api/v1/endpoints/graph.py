from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.graph import NetworkGraphResponse
from app.services.graph_analytics import GraphAnalyticsService

router = APIRouter()

@router.get("/network", response_model=NetworkGraphResponse)
def get_network_graph(
    account_id: str = Query("ACC-4321", description="Central focus node"),
    max_depth: int = Query(2, ge=1, le=5, description="Depth limit for traversal"),
    db: Session = Depends(get_db)
):
    """Returns Cytoscape.js compatible graph payload with directional edges, entities, and risk weights."""
    service = GraphAnalyticsService(db)
    return service.get_network_graph(account_id, max_depth=max_depth)

@router.get("/network/{account_id}", response_model=NetworkGraphResponse)
def get_network_graph_by_id(
    account_id: str,
    max_depth: int = Query(2, ge=1, le=5, description="Depth limit for traversal"),
    db: Session = Depends(get_db)
):
    """Returns network graph for specific account ID in URL path."""
    service = GraphAnalyticsService(db)
    return service.get_network_graph(account_id, max_depth=max_depth)
