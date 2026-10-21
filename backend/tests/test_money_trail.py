import pytest
from app.core.database import SessionLocal
from app.services.money_trail import MoneyTrailService

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_money_trail_traversal(db_session):
    service = MoneyTrailService(db_session)
    hops = service.trace_money_trail("ACC-4321", max_depth=4)
    assert len(hops) > 0, "Target mule hub should have active multi-hop transactions"
    
    # Check that hop levels are properly bounded
    for hop in hops:
        assert 1 <= hop["hop_level"] <= 4
        assert hop["amount"] > 0
        assert "from_account_masked" in hop
        assert "to_account_masked" in hop
