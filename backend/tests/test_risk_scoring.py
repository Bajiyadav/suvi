import pytest
from app.core.database import SessionLocal
from app.services.risk_scoring import RiskScoringService
from app.models.account import Account

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_risk_score_bounds(db_session):
    service = RiskScoringService(db_session)
    accounts = db_session.query(Account).all()
    assert len(accounts) > 0, "Database must have seeded accounts"

    for acc in accounts:
        result = service.calculate_explainable_risk(acc.account_id)
        score = result["risk_score"]
        assert 0 <= score <= 100, f"Score {score} for {acc.account_id} must be between 0 and 100"
        assert len(result["top_contributing_factors"]) > 0, "Must have explainable factors"
        assert "disclaimer" in result

def test_benchmark_target_score(db_session):
    service = RiskScoringService(db_session)
    result = service.calculate_explainable_risk("ACC-4321")
    assert result["risk_score"] == 96
    assert result["risk_tier"] == "High"
    factor_names = [f["name"] for f in result["top_contributing_factors"]]
    assert "Rapid fund transfers" in factor_names
    assert "Links to 5 cybercrime complaints" in factor_names
