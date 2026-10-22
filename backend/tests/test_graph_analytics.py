import pytest
from fastapi import HTTPException
from app.core.database import SessionLocal
from app.services.graph_analytics import GraphAnalyticsService

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_graph_network_extraction_target_account(db_session):
    service = GraphAnalyticsService(db_session)
    graph_res = service.get_network_graph("ACC-4321")

    assert "nodes" in graph_res
    assert "edges" in graph_res
    assert len(graph_res["nodes"]) >= 5
    assert len(graph_res["edges"]) >= 5

    # Target node verification
    target_node = next((n for n in graph_res["nodes"] if n["id"] == "ACC-4321"), None)
    assert target_node is not None
    assert target_node["type"] == "TARGET_ACCOUNT"
    assert target_node["risk_score"] in (96, 100)
    assert "XXXX 4321" in target_node["label"]

def test_different_accounts_produce_different_graphs(db_session):
    service = GraphAnalyticsService(db_session)
    graph_1 = service.get_network_graph("ACC-4321")
    graph_2 = service.get_network_graph("ACC-8765")

    # Target IDs must differ
    assert graph_1["target_node_id"] == "ACC-4321"
    assert graph_2["target_node_id"] == "ACC-8765"

    node_ids_1 = {n["id"] for n in graph_1["nodes"]}
    node_ids_2 = {n["id"] for n in graph_2["nodes"]}

    assert "ACC-4321" in node_ids_1
    assert "ACC-8765" in node_ids_2
    # Verify they have distinct node topologies
    assert node_ids_1 != node_ids_2

def test_correct_source_and_destination_edges(db_session):
    service = GraphAnalyticsService(db_session)
    graph_res = service.get_network_graph("ACC-4321")

    # Find transaction edge between ACC-7788 and ACC-4321 (inflow)
    inflow_edge = next((e for e in graph_res["edges"] if e["source"] == "ACC-7788" and e["target"] == "ACC-4321"), None)
    assert inflow_edge is not None
    assert inflow_edge["amount"] == 50000.0

    # Find transaction edge between ACC-4321 and ACC-2211 (outflow)
    outflow_edge = next((e for e in graph_res["edges"] if e["source"] == "ACC-4321" and e["target"] == "ACC-2211"), None)
    assert outflow_edge is not None
    assert outflow_edge["amount"] == 49500.0

def test_depth_limits_and_cycles(db_session):
    service = GraphAnalyticsService(db_session)
    graph_depth_1 = service.get_network_graph("ACC-4321", max_depth=1)
    graph_depth_2 = service.get_network_graph("ACC-4321", max_depth=2)

    assert len(graph_depth_1["nodes"]) <= len(graph_depth_2["nodes"])
    assert "has_cycles" in graph_depth_1["stats"]
    assert "connected_clusters" in graph_depth_1["stats"]
    assert isinstance(graph_depth_1["stats"]["has_cycles"], bool)

def test_disconnected_accounts_handled_safely(db_session):
    service = GraphAnalyticsService(db_session)
    # ACC-7810 exists in database fixtures with no transactions
    graph_res = service.get_network_graph("ACC-7810")

    assert graph_res["target_node_id"] == "ACC-7810"
    assert len(graph_res["nodes"]) >= 1
    target_node = next((n for n in graph_res["nodes"] if n["id"] == "ACC-7810"), None)
    assert target_node is not None
    assert target_node["type"] == "TARGET_ACCOUNT"
    assert graph_res["stats"]["connected_clusters"] == 1
    assert graph_res["stats"]["has_cycles"] is False

def test_missing_account_returns_404(db_session):
    service = GraphAnalyticsService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        service.get_network_graph("ACC-NONEXISTENT-9999")
    assert exc_info.value.status_code == 404
