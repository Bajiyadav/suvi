from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["synthetic_mode"] is True

def test_dashboard_overview():
    response = client.get("/api/v1/overview?focused_account_id=ACC-4321")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["high_risk_accounts"] == 127
    assert len(data["risky_accounts"]) == 5
    assert data["risk_explanation"]["risk_score"] == 96
    assert len(data["linked_complaints"]) >= 2
    assert len(data["network_graph"]["nodes"]) >= 5

def test_alerts_endpoint():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0
    # Ranked highest score first
    assert alerts[0]["risk_score"] >= alerts[-1]["risk_score"]

def test_evidence_dossier_json():
    response = client.get("/api/v1/reports/dossier-json/ACC-4321")
    assert response.status_code == 200
    dossier = response.json()
    assert "dossier_metadata" in dossier
    assert "STATUTORY NOTICE" in dossier["dossier_metadata"]["synthetic_notice"]
    assert "risk_assessment" in dossier

def test_evidence_dossier_pdf():
    response = client.get("/api/v1/reports/download-pdf/ACC-4321")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
