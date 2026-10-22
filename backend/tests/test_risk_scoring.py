import pytest
import datetime
from app.core.database import SessionLocal
from app.services.risk_scoring import RiskScoringService
from app.services.transaction_analysis import TransactionAnalysisService
from app.models.account import Account, AccountType, AccountCategory, AccountStatus, RiskTier
from app.models.transaction import Transaction, PaymentChannel, TransactionStatus, PatternTag

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
        assert len(result["top_contributing_factors"]) == 6, "Must evaluate all 6 documented indicators"
        assert "disclaimer" in result
        assert "confidence" in result
        assert 0.0 <= result["confidence"] <= 1.0

def test_distinct_accounts_dynamic_scoring(db_session):
    service = RiskScoringService(db_session)
    
    # 1. Primary suspect account ACC-4321
    res1 = service.calculate_explainable_risk("ACC-4321")
    assert res1["risk_score"] >= 80, "ACC-4321 must score in High risk tier based on transaction features"
    assert res1["risk_tier"] == "High"
    factors1 = {f["indicator_id"]: f for f in res1["top_contributing_factors"]}
    assert factors1["IND-01"]["points_awarded"] > 0, "Rapid transfer points must be awarded"
    assert factors1["IND-02"]["points_awarded"] > 0, "Pass-through ratio points must be awarded"
    assert factors1["IND-04"]["points_awarded"] > 0, "Complaint linkage points must be awarded"
    assert len(factors1["IND-01"]["evidence_references"]) > 0

    # 2. Secondary suspect account ACC-8765
    res2 = service.calculate_explainable_risk("ACC-8765")
    assert res2["risk_score"] >= 70, "ACC-8765 must score High based on rapid structuring transfers"
    assert res2["account_number_masked"] == "XXXX 8765"

    # 3. Benign counterparty account ACC-2222
    res3 = service.calculate_explainable_risk("ACC-2222")
    assert res3["risk_score"] < 40, "ACC-2222 must score in Low risk tier"
    assert res3["risk_tier"] == "Low"

def test_transaction_totals_computation(db_session):
    flow_service = TransactionAnalysisService(db_session)
    flow = flow_service.get_flow_analysis("ACC-4321")

    # Manually query DB to verify exact arithmetic
    in_txns = db_session.query(Transaction).filter(Transaction.receiver_account_id == "ACC-4321").all()
    out_txns = db_session.query(Transaction).filter(Transaction.sender_account_id == "ACC-4321").all()
    expected_in = sum(t.amount for t in in_txns)
    expected_out = sum(t.amount for t in out_txns)

    assert flow["incoming_total"] == expected_in
    assert flow["outflow_total"] == expected_out
    assert flow["incoming_count"] == len(in_txns)
    assert flow["outflow_count"] == len(out_txns)
    assert flow["retained_balance"] == max(0.0, expected_in - expected_out)

def test_missing_data_and_nonexistent_account(db_session):
    service = RiskScoringService(db_session)
    
    # Nonexistent account handling
    res = service.calculate_explainable_risk("ACC-NONEXISTENT")
    assert res["risk_score"] == 0
    assert res["risk_tier"] == "Low"
    assert res["confidence"] == 0.0
    assert "not found" in res["disclaimer"].lower()

    # Flow analysis on nonexistent account
    flow_service = TransactionAnalysisService(db_session)
    flow = flow_service.get_flow_analysis("ACC-NONEXISTENT")
    assert flow["incoming_total"] == 0.0
    assert flow["outflow_total"] == 0.0
    assert flow["retained_balance"] == 0.0
    assert flow["retained_percentage"] == 0.0

def test_dynamic_ranking_queue(db_session):
    service = RiskScoringService(db_session)
    ranked = service.get_ranked_risky_accounts(limit=5)
    assert len(ranked) == 5
    # Ranks must be 1 to 5
    assert [r["rank"] for r in ranked] == [1, 2, 3, 4, 5]
    # Scores must be in descending order
    scores = [r["risk_score"] for r in ranked]
    assert scores == sorted(scores, reverse=True)
    # Top rank should be the highest risk mule
    assert ranked[0]["account_id"] == "ACC-4321"

def test_score_changes_when_transactions_change(db_session):
    service = RiskScoringService(db_session)
    test_acc_id = "ACC-TEST-DYNAMIC"
    
    # Create temporary isolated account
    test_acc = Account(
        account_id=test_acc_id,
        account_number_masked="XXXX 9999",
        bank_name="Test Bank",
        branch_code="TEST001",
        account_holder_name="Dynamic Test Subject",
        account_type=AccountType.SAVINGS.value,
        account_category=AccountCategory.SALARY.value,
        registered_mobile_masked="+91 99999 00000",
        risk_score=0,
        risk_tier=RiskTier.LOW.value
    )
    db_session.add(test_acc)
    db_session.commit()

    try:
        # Step 1: Initial state (zero transactions) -> Score must be 0
        initial_eval = service.calculate_explainable_risk(test_acc_id)
        assert initial_eval["risk_score"] == 0
        assert initial_eval["risk_tier"] == "Low"

        # Step 2: Inject suspicious rapid transfer sequence
        now = datetime.datetime.now(datetime.timezone.utc)
        t1 = Transaction(
            transaction_id="TXN-TEST-001",
            sender_account_id="ACC-7788",
            receiver_account_id=test_acc_id,
            amount=50000.0,
            timestamp=now - datetime.timedelta(minutes=10),
            channel=PaymentChannel.UPI.value,
            narrative="Victim deposit",
            status=TransactionStatus.SUCCESS.value,
            pattern_tag=PatternTag.NORMAL.value
        )
        t2 = Transaction(
            transaction_id="TXN-TEST-002",
            sender_account_id=test_acc_id,
            receiver_account_id="ACC-4444",
            amount=49000.0,
            timestamp=now - datetime.timedelta(minutes=8), # 2 mins later!
            channel=PaymentChannel.IMPS.value,
            narrative="Rapid outflow to mule",
            status=TransactionStatus.SUCCESS.value,
            pattern_tag=PatternTag.RAPID_TRANSFER.value
        )
        db_session.add(t1)
        db_session.add(t2)
        db_session.commit()

        # Step 3: Recompute score -> must dynamically react and increase
        updated_eval = service.calculate_explainable_risk(test_acc_id)
        assert updated_eval["risk_score"] > initial_eval["risk_score"], "Score must increase dynamically when transactions are added"
        
        # Verify specific indicator reflection
        factors = {f["indicator_id"]: f for f in updated_eval["top_contributing_factors"]}
        assert factors["IND-01"]["points_awarded"] > 0, "Rapid transfer indicator must award points"
        assert "TXN-TEST-002" in factors["IND-01"]["evidence_references"] or "TXN-TEST-001" in factors["IND-01"]["evidence_references"]

    finally:
        # Clean up test transactions and account
        db_session.query(Transaction).filter(
            Transaction.transaction_id.in_(["TXN-TEST-001", "TXN-TEST-002"])
        ).delete(synchronize_session=False)
        db_session.query(Account).filter(Account.account_id == test_acc_id).delete(synchronize_session=False)
        db_session.commit()
