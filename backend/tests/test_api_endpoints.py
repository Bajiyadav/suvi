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
    # KPIs are dynamically calculated from DB records via RiskScoringService
    assert data["kpis"]["high_risk_accounts"] == 3
    assert "portfolio" in data["kpis"]["high_risk_trend"]
    assert data["kpis"]["suspicious_networks"] >= 1
    assert data["kpis"]["linked_complaints"] >= 1
    assert len(data["risky_accounts"]) == 5
    assert data["risk_explanation"]["risk_score"] in (96, 100)
    assert len(data["linked_complaints"]) >= 2
    assert len(data["network_graph"]["nodes"]) >= 5


def test_alerts_endpoint():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0
    # Ranked highest score first
    assert alerts[0]["risk_score"] >= alerts[-1]["risk_score"]

def test_evidence_dossier_json_valid_account():
    response = client.get("/api/v1/reports/dossier-json/ACC-4321")
    assert response.status_code == 200
    dossier = response.json()
    assert "dossier_metadata" in dossier
    assert "STATUTORY NOTICE" in dossier["dossier_metadata"]["synthetic_notice"]
    assert "risk_assessment" in dossier
    assert dossier["target_account"]["account_id"] == "ACC-4321"
    assert dossier["target_account"]["bank_name"] == "State Bank of Bharat"
    assert dossier["target_account"]["account_holder_name"] == "Ramesh K. (Synthetic)"
    assert "PRIORITISE FOR INVESTIGATOR REVIEW" in dossier["investigative_conclusions"]["recommended_action"]

def test_evidence_dossier_json_low_risk_account():
    # ACC-2222 is a low-risk counterparty
    response = client.get("/api/v1/reports/dossier-json/ACC-2222")
    assert response.status_code == 200
    dossier = response.json()
    assert dossier["target_account"]["account_id"] == "ACC-2222"
    assert dossier["target_account"]["bank_name"] == "Canara Union Bank"
    assert dossier["target_account"]["account_holder_name"] == "Pooja N. (Synthetic)"
    # Must NOT recommend immediate lien/freeze for a low-risk account
    assert "INITIATE IMMEDIATE LIEN" not in dossier["investigative_conclusions"]["recommended_action"]

def test_evidence_dossier_json_nonexistent_account_returns_404():
    response = client.get("/api/v1/reports/dossier-json/ACC-NONEXISTENT")
    assert response.status_code == 404
    error = response.json()
    assert "not found" in error["detail"].lower()
    # Confirm no evidence is fabricated
    assert "target_account" not in error
    assert "investigative_conclusions" not in error

def test_evidence_dossier_pdf_valid_account():
    response = client.get("/api/v1/reports/download-pdf/ACC-4321")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000

def test_evidence_dossier_pdf_nonexistent_account_returns_404():
    response = client.get("/api/v1/reports/download-pdf/ACC-NONEXISTENT")
    assert response.status_code == 404
    error = response.json()
    assert "not found" in error["detail"].lower()
