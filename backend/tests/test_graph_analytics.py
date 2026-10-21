import pytest
from app.core.database import SessionLocal
from app.services.graph_analytics import GraphAnalyticsService

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_graph_network_extraction(db_session):
    service = GraphAnalyticsService(db_session)
    graph_res = service.get_network_graph("ACC-4321")

    assert "nodes" in graph_res
    assert "edges" in graph_res
    assert len(graph_res["nodes"]) >= 5
    assert len(graph_res["edges"]) >= 5

    # Check target node
    target_node = next((n for n in graph_res["nodes"] if n["id"] == "ACC-4321"), None)
    assert target_node is not None
    assert target_node["type"] == "TARGET_ACCOUNT"
    assert target_node["risk_score"] == 96
