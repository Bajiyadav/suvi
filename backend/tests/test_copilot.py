import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_copilot_case_query():
    response = client.post(
        "/api/v1/copilot/query",
        json={"query": "Tell me about the electricity bill phishing case and accused Manoj Mandal"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Manoj Kumar Mandal" in data["answer"]
    assert "ACC-4321" in data["answer"]
    assert len(data["suggested_actions"]) > 0
    assert data["confidence"] > 0.9
    assert data["response_time_ms"] < 500

def test_copilot_account_query():
    response = client.post(
        "/api/v1/copilot/query",
        json={"query": "What is the risk score and pass through ratio of ACC-4321?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "ACC-4321" in data["answer"]
    assert "Pass-Through Ratio" in data["answer"]
    assert len(data["suggested_actions"]) > 0

def test_copilot_legal_notice():
    response = client.post(
        "/api/v1/copilot/query",
        json={"query": "Draft a debit freeze notice under Section 106 BNSS"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Section 106 of Bharatiya Nagarik Suraksha Sanhita" in data["answer"]
    assert any(a["action_type"] == "copy_legal_notice" for a in data["suggested_actions"])

def test_copilot_general_summary():
    response = client.post(
        "/api/v1/copilot/query",
        json={"query": "How many cases have been solved and how much total money recovered?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Rings Busted" in data["answer"]
    assert "Total Cyber Fraud Intercepted" in data["answer"]
