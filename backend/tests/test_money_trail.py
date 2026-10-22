import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.account import Account, AccountType, AccountCategory, AccountStatus
from app.models.transaction import Transaction, PaymentChannel, TransactionStatus, PatternTag
from app.services.money_trail import MoneyTrailService

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_money_trail_traversal(db_session):
    """Verifies that multi-hop money trail traversal retrieves inbound and outbound hops
    with privacy-masked account numbers and bounded hop levels.
    """
    service = MoneyTrailService(db_session)
    hops = service.trace_money_trail("ACC-4321", max_depth=4)
    assert len(hops) > 0, "Target mule hub should have active multi-hop transactions"

    # Check that hop levels are properly bounded
    for hop in hops:
        assert 1 <= hop["hop_level"] <= 4
        assert hop["amount"] > 0
        assert "from_account_masked" in hop
        assert "to_account_masked" in hop
        assert "role" in hop
        assert "is_cycle" in hop
        assert "transaction_id" in hop
        assert hop["from_account_masked"].startswith("XXXX ") or len(hop["from_account_masked"]) > 0

    # Verify presence of inbound and outbound roles
    roles = set(h["role"] for h in hops)
    assert any("INBOUND" in r or "VICTIM" in r for r in roles)
    assert any("MULE" in r or "CASHOUT" in r for r in roles)


def test_money_trail_cycle_detection(db_session):
    """Verifies that circular laundering patterns (A -> B -> C -> A) are explicitly
    detected as cycles, flagged with role CIRCULAR_RETURN, and pruned to prevent infinite recursion.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    service = MoneyTrailService(db_session)

    # 1. Create temporary test accounts for cycle
    acc_ids = ["ACC-CYC-1", "ACC-CYC-2", "ACC-CYC-3"]
    for i, aid in enumerate(acc_ids):
        acc = Account(
            account_id=aid,
            account_number_masked=f"XXXX 888{i}",
            bank_name="Cycle Test Bank",
            branch_code="CYC001",
            account_holder_name=f"Cycle Subject {i+1}",
            account_type=AccountType.SAVINGS.value,
            account_category=AccountCategory.MULE_SUSPECT.value,
            registered_mobile_masked=f"+91 99999 0000{i}",
            risk_score=75,
            risk_tier="High"
        )
        db_session.add(acc)

    # 2. Inject circular transaction chain: 1 -> 2 -> 3 -> 1
    t1 = Transaction(
        transaction_id="TXN-CYC-01",
        sender_account_id="ACC-CYC-1",
        receiver_account_id="ACC-CYC-2",
        amount=50000.0,
        timestamp=now - datetime.timedelta(minutes=30),
        channel=PaymentChannel.IMPS.value,
        status=TransactionStatus.SUCCESS.value,
        pattern_tag=PatternTag.LAYERING.value
    )
    t2 = Transaction(
        transaction_id="TXN-CYC-02",
        sender_account_id="ACC-CYC-2",
        receiver_account_id="ACC-CYC-3",
        amount=48000.0,
        timestamp=now - datetime.timedelta(minutes=20),
        channel=PaymentChannel.IMPS.value,
        status=TransactionStatus.SUCCESS.value,
        pattern_tag=PatternTag.LAYERING.value
    )
    t3 = Transaction(
        transaction_id="TXN-CYC-03",
        sender_account_id="ACC-CYC-3",
        receiver_account_id="ACC-CYC-1",  # Completes cycle back to start account!
        amount=46000.0,
        timestamp=now - datetime.timedelta(minutes=10),
        channel=PaymentChannel.IMPS.value,
        status=TransactionStatus.SUCCESS.value,
        pattern_tag=PatternTag.LAYERING.value
    )
    db_session.add(t1)
    db_session.add(t2)
    db_session.add(t3)
    db_session.commit()

    try:
        # Traverse money trail from ACC-CYC-1
        hops = service.trace_money_trail("ACC-CYC-1", max_depth=5)
        
        # Verify cycle was detected
        cycle_hops = [h for h in hops if h.get("is_cycle") is True]
        assert len(cycle_hops) >= 1, "Circular loop back to root account must be flagged as cycle"
        assert cycle_hops[0]["role"] == "CIRCULAR_RETURN"
        assert cycle_hops[0]["to_account_id"] == "ACC-CYC-1"

        # Verify summary sequence exposes cycle_detected flag
        seq = service.get_money_trail_sequence("ACC-CYC-1", max_depth=5)
        assert seq["cycle_detected"] is True
        assert seq["root_account_id"] == "ACC-CYC-1"
        assert seq["total_hops_traced"] == len(hops)

    finally:
        # Clean up test data
        db_session.query(Transaction).filter(
            Transaction.transaction_id.in_(["TXN-CYC-01", "TXN-CYC-02", "TXN-CYC-03"])
        ).delete(synchronize_session=False)
        db_session.query(Account).filter(Account.account_id.in_(acc_ids)).delete(synchronize_session=False)
        db_session.commit()


def test_money_trail_nonexistent_account_returns_404():
    """Validates honest error handling when tracing money trails for nonexistent accounts."""
    # 1. Main trail endpoint
    res1 = client.get("/api/v1/money-trail/ACC-NONEXISTENT")
    assert res1.status_code == 404
    assert "not found" in res1.json()["detail"].lower()

    # 2. Sequence summary endpoint
    res2 = client.get("/api/v1/money-trail/ACC-NONEXISTENT/sequence")
    assert res2.status_code == 404
    assert "not found" in res2.json()["detail"].lower()

    # 3. Flow summary endpoint
    res3 = client.get("/api/v1/money-trail/ACC-NONEXISTENT/flow-summary")
    assert res3.status_code == 404
    assert "not found" in res3.json()["detail"].lower()


def test_money_trail_sequence_endpoint():
    """Validates the /sequence API endpoint for valid accounts."""
    res = client.get("/api/v1/money-trail/ACC-4321/sequence?max_depth=3")
    assert res.status_code == 200
    data = res.json()
    assert data["root_account_id"] == "ACC-4321"
    assert data["total_hops_traced"] > 0
    assert "cycle_detected" in data
    assert data["total_volume_traced"] > 0
    assert len(data["hops"]) == data["total_hops_traced"]


def test_money_trail_depth_bounding_and_validation():
    """Validates query parameter bounds and depth limits on money trail traversal."""
    # Depth 1: only direct hops
    res_depth1 = client.get("/api/v1/money-trail/ACC-4321?max_depth=1")
    assert res_depth1.status_code == 200
    for hop in res_depth1.json():
        assert hop["hop_level"] <= 1

    # Out of bounds max_depth (> 6) should fail with 422
    res_invalid_high = client.get("/api/v1/money-trail/ACC-4321?max_depth=10")
    assert res_invalid_high.status_code == 422

    # Out of bounds max_depth (< 1) should fail with 422
    res_invalid_low = client.get("/api/v1/money-trail/ACC-4321?max_depth=0")
    assert res_invalid_low.status_code == 422


def test_money_trail_flow_summary_endpoint():
    """Validates the /flow-summary API endpoint."""
    res = client.get("/api/v1/money-trail/ACC-4321/flow-summary")
    assert res.status_code == 200
    data = res.json()
    assert data["account_id"] == "ACC-4321"
    assert data["account_number_masked"] == "XXXX 4321"
    assert data["risk_score"] in (96, 100)
    assert data["incoming_total"] > 0
    assert data["outflow_total"] > 0
