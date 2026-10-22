import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db, SessionLocal
from app.models.account import Account, AccountType, AccountCategory, AccountStatus
from app.models.transaction import Transaction, PaymentChannel, TransactionStatus, PatternTag
from app.models.complaint import CybercrimeComplaint, ComplaintType, ComplaintStatus
from app.models.case import WatchlistEntry, InvestigationNote
from app.models.audit import AuditLog
from app.services.risk_scoring import RiskScoringService
import datetime

client = TestClient(app)

# =============================================================================
# A. Dashboard KPIs Matching Seeded Database Records & Updates
# =============================================================================

def test_kpis_match_seeded_database_records():
    """Validates that dashboard KPIs dynamically match underlying database rows."""
    db = SessionLocal()
    try:
        db_total_accounts = db.query(Account).count()
        db_high_risk = db.query(Account).filter(
            (Account.risk_score >= 70) | (Account.account_category == AccountCategory.MULE_SUSPECT.value)
        ).count()
        db_complaints = db.query(CybercrimeComplaint).count()
        db_txns = db.query(Transaction).count()

        response = client.get("/api/v1/overview?focused_account_id=ACC-4321")
        assert response.status_code == 200
        kpis = response.json()["kpis"]

        # 1. Total accounts and high risk accounts match actual DB count
        assert kpis["high_risk_accounts"] == db_high_risk
        expected_trend = f"{round((db_high_risk / max(1, db_total_accounts)) * 100)}% of portfolio"
        assert kpis["high_risk_trend"] == expected_trend

        # 2. Linked complaints match actual DB count
        assert kpis["linked_complaints"] == db_complaints

        # 3. Total transactions analyzed match actual DB count
        if db_txns >= 1_000_000:
            expected_txns = f"{db_txns / 1_000_000:.1f}M"
        elif db_txns >= 1_000:
            expected_txns = f"{db_txns:,}"
        else:
            expected_txns = str(db_txns)
        assert kpis["total_transactions_analyzed"] == expected_txns
    finally:
        db.close()


def test_kpi_updates_after_new_transaction():
    """Validates that KPIs dynamically update when new transactions are added."""
    db = SessionLocal()
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    test_txn_id = f"TXN-STEP4-TEST-{now_utc.timestamp()}"
    try:
        initial_res = client.get("/api/v1/overview?focused_account_id=ACC-4321")
        initial_kpis = initial_res.json()["kpis"]
        initial_count = int(initial_kpis["total_transactions_analyzed"].replace(",", ""))

        # Add an isolated new transaction
        new_txn = Transaction(
            transaction_id=test_txn_id,
            sender_account_id="ACC-4321",
            receiver_account_id="ACC-1111",
            amount=15000.0,
            channel=PaymentChannel.IMPS.value,
            status=TransactionStatus.SUCCESS.value,
            pattern_tag=PatternTag.NORMAL.value,
            timestamp=now_utc
        )
        db.add(new_txn)
        db.commit()

        updated_res = client.get("/api/v1/overview?focused_account_id=ACC-4321")
        updated_kpis = updated_res.json()["kpis"]
        updated_count = int(updated_kpis["total_transactions_analyzed"].replace(",", ""))
        assert updated_count == initial_count + 1
    finally:
        db.query(Transaction).filter(Transaction.transaction_id == test_txn_id).delete()
        db.commit()
        db.close()


def test_kpi_high_risk_accounts_updates_when_transactions_change():
    """Regression Test: Validates that when an account's transactions change,
    its risk score is dynamically recalculated and the High Risk Accounts KPI
    immediately reflects the change without relying on stale stored scores.
    """
    db = SessionLocal()
    risk_service = RiskScoringService(db)
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    target_account = "ACC-2222"

    injected_txn_ids = []
    injected_complaint_id = f"CMP-REGTEST-{now_utc.timestamp()}"

    try:
        # 1. Baseline state
        initial_overview = client.get("/api/v1/overview?focused_account_id=ACC-4321").json()
        initial_kpi_high_risk = initial_overview["kpis"]["high_risk_accounts"]

        # Verify target account is not high risk initially
        initial_eval = risk_service.calculate_explainable_risk(target_account)
        assert initial_eval["risk_score"] < 70
        assert initial_eval["risk_tier"] != "High"

        # 2. Alter transactions for target_account:
        # Inject large inflow from flagged account ACC-4321 + rapid pass-through outflows
        inflow_txn = Transaction(
            transaction_id=f"TXN-REGTEST-IN-{now_utc.timestamp()}",
            sender_account_id="ACC-4321",
            receiver_account_id=target_account,
            amount=200000.0,
            channel=PaymentChannel.NEFT.value,
            status=TransactionStatus.SUCCESS.value,
            pattern_tag=PatternTag.RAPID_TRANSFER.value,
            timestamp=now_utc - datetime.timedelta(minutes=30)
        )
        db.add(inflow_txn)
        injected_txn_ids.append(inflow_txn.transaction_id)

        # Add 3 rapid pass-through layering outflow transactions to flagged counterparties
        for i, receiver in enumerate(["ACC-1111", "ACC-4444", "ACC-5555"]):
            out_txn = Transaction(
                transaction_id=f"TXN-REGTEST-OUT{i}-{now_utc.timestamp()}",
                sender_account_id=target_account,
                receiver_account_id=receiver,
                amount=62000.0,
                channel=PaymentChannel.IMPS.value,
                status=TransactionStatus.SUCCESS.value,
                pattern_tag=PatternTag.RAPID_TRANSFER.value,
                timestamp=now_utc - datetime.timedelta(minutes=25 - i * 5)
            )
            db.add(out_txn)
            injected_txn_ids.append(out_txn.transaction_id)

        # Add 2 linked verified complaints
        complaint1 = CybercrimeComplaint(
            complaint_id=injected_complaint_id,
            complaint_type=ComplaintType.UPI_FRAUD.value,
            reported_loss_amount=200000.0,
            suspect_account_id=target_account,
            status=ComplaintStatus.VERIFIED.value,
            police_station_jurisdiction="Cyber Crime Unit, Mumbai Central",
            description="Victim reported unauthorised UPI transfers to suspect account"
        )
        complaint2 = CybercrimeComplaint(
            complaint_id=f"{injected_complaint_id}-2",
            complaint_type=ComplaintType.JOB_SCAM.value,
            reported_loss_amount=150000.0,
            suspect_account_id=target_account,
            status=ComplaintStatus.VERIFIED.value,
            police_station_jurisdiction="Cyber Crime Unit, Delhi North",
            description="Second victim reported job task deposit scam"
        )
        db.add(complaint1)
        db.add(complaint2)
        db.commit()

        # 3. Verify that dynamic risk score for ACC-2222 is now elevated to High (>= 70)
        elevated_eval = risk_service.calculate_explainable_risk(target_account)
        assert elevated_eval["risk_score"] >= 70
        assert elevated_eval["risk_tier"] == "High"

        # 4. Verify that Dashboard KPI immediately reflects the new high-risk account
        updated_overview = client.get("/api/v1/overview?focused_account_id=ACC-4321").json()
        updated_kpi_high_risk = updated_overview["kpis"]["high_risk_accounts"]
        assert updated_kpi_high_risk == initial_kpi_high_risk + 1

        # Verify ACC-2222 now appears in risky accounts ranking
        ranked_account_ids = [acc["account_id"] for acc in updated_overview["risky_accounts"]]
        assert target_account in ranked_account_ids

    finally:
        # Clean up injected test data
        db.query(Transaction).filter(Transaction.transaction_id.like("%REGTEST%")).delete(synchronize_session=False)
        db.query(CybercrimeComplaint).filter(CybercrimeComplaint.complaint_id.like("%REGTEST%")).delete(synchronize_session=False)
        db.commit()

        # 5. Verify that after reverting transactions, KPI immediately drops back
        reverted_overview = client.get("/api/v1/overview?focused_account_id=ACC-4321").json()
        reverted_kpi_high_risk = reverted_overview["kpis"]["high_risk_accounts"]
        assert reverted_kpi_high_risk == initial_kpi_high_risk

        db.close()



# =============================================================================
# B. Empty Database & API Error Handling (Isolated in-memory DB)
# =============================================================================

def test_empty_database_overview_handling():
    """Validates that an empty database returns honest zero metrics without crashing or fabricating numbers."""
    engine_empty = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine_empty)
    EmptySession = sessionmaker(autocommit=False, autoflush=False, bind=engine_empty)

    def override_empty_db():
        session = EmptySession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_empty_db
    try:
        response = client.get("/api/v1/overview")
        assert response.status_code == 200
        data = response.json()

        # Honest zero metrics (Never invent fallback metrics)
        assert data["kpis"]["high_risk_accounts"] == 0
        assert data["kpis"]["high_risk_trend"] == "0% of portfolio"
        assert data["kpis"]["suspicious_networks"] == 0
        assert data["kpis"]["networks_trend"] == "0 active clusters"
        assert data["kpis"]["linked_complaints"] == 0
        assert data["kpis"]["total_transactions_analyzed"] == "0"
        assert data["kpis"]["transactions_timeframe"] == "No transaction records"
        assert data["risky_accounts"] == []
        assert data["timeline"] == []
        assert data["linked_complaints"] == []
        assert data["associated_entities"] == []
        assert data["network_graph"]["nodes"] == []
        assert data["network_graph"]["edges"] == []
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_overview_explicit_nonexistent_account_returns_404():
    """Validates that explicitly querying a nonexistent account returns HTTP 404."""
    response = client.get("/api/v1/overview?focused_account_id=ACC-DOES-NOT-EXIST")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# =============================================================================
# C. Evidence Dossier Retrieval & Account Isolation
# =============================================================================

def test_dossier_switching_accounts_has_no_stale_data():
    """Validates that retrieving dossiers for different accounts returns distinct, isolated data."""
    res_4321 = client.get("/api/v1/reports/dossier-json/ACC-4321")
    assert res_4321.status_code == 200
    dossier_4321 = res_4321.json()

    res_2222 = client.get("/api/v1/reports/dossier-json/ACC-2222")
    assert res_2222.status_code == 200
    dossier_2222 = res_2222.json()

    # Verify completely separate account details
    assert dossier_4321["target_account"]["account_id"] == "ACC-4321"
    assert dossier_2222["target_account"]["account_id"] == "ACC-2222"
    assert dossier_4321["target_account"]["bank_name"] != dossier_2222["target_account"]["bank_name"]
    assert dossier_4321["risk_assessment"]["risk_score"] != dossier_2222["risk_assessment"]["risk_score"]


# =============================================================================
# D. Watchlist Persistence: Add, Duplicate Check, List, Remove, Audit Trail
# =============================================================================

def test_watchlist_lifecycle_and_persistence():
    """Tests the full lifecycle of persistent watchlist entries:
    1. Validation: missing account returns 404
    2. Add account to watchlist (persists in DB)
    3. Duplicate prevention: second add returns 409 Conflict
    4. List watchlist: returns active entry with joined account metadata
    5. Audit log: verified for ADD_WATCHLIST
    6. Remove from watchlist: deactivates entry
    7. Audit log: verified for REMOVE_WATCHLIST
    8. Remove nonexistent returns 404
    """
    target_account = "ACC-8765"
    db = SessionLocal()
    try:
        # Ensure account is not already in watchlist
        db.query(WatchlistEntry).filter(WatchlistEntry.account_id == target_account).delete()
        db.commit()

        # 1. Validation: Missing account returns 404
        bad_add = client.post("/api/v1/cases/watchlist", json={
            "account_id": "ACC-NONEXISTENT",
            "reason": "Test"
        })
        assert bad_add.status_code == 404
        assert "not found" in bad_add.json()["detail"].lower()

        # 2. Add valid account to watchlist
        add_res = client.post("/api/v1/cases/watchlist", json={
            "account_id": target_account,
            "reason": "Suspicious rapid layering conduit",
            "priority": "HIGH",
            "investigator_id": "INV-OFFICER-77"
        })
        assert add_res.status_code == 201
        entry_data = add_res.json()
        assert entry_data["account_id"] == target_account
        assert entry_data["is_active"] is True
        assert entry_data["bank_name"] == "Canara Union Bank"
        assert entry_data["investigator_id"] == "INV-OFFICER-77"

        # 3. Duplicate prevention: returns 409 Conflict
        dup_res = client.post("/api/v1/cases/watchlist", json={
            "account_id": target_account,
            "reason": "Duplicate attempt"
        })
        assert dup_res.status_code == 409
        assert "already in the active watchlist" in dup_res.json()["detail"]

        # 4. List watchlist across separate session
        list_res = client.get("/api/v1/cases/watchlist?is_active=true")
        assert list_res.status_code == 200
        items = list_res.json()
        matching = [item for item in items if item["account_id"] == target_account]
        assert len(matching) == 1
        assert matching[0]["priority"] == "HIGH"

        # 5. Verify Audit Log for ADD_WATCHLIST
        audit = db.query(AuditLog).filter(
            AuditLog.target_entity == target_account,
            AuditLog.action == "ADD_WATCHLIST"
        ).order_by(AuditLog.timestamp.desc()).first()
        assert audit is not None
        assert audit.actor == "INV-OFFICER-77"

        # 6. Remove from watchlist
        del_res = client.delete(f"/api/v1/cases/watchlist/{target_account}")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "success"

        # Confirm not in active list
        list_after_del = client.get("/api/v1/cases/watchlist?is_active=true").json()
        assert not any(item["account_id"] == target_account for item in list_after_del)

        # 7. Verify Audit Log for REMOVE_WATCHLIST
        del_audit = db.query(AuditLog).filter(
            AuditLog.target_entity == target_account,
            AuditLog.action == "REMOVE_WATCHLIST"
        ).order_by(AuditLog.timestamp.desc()).first()
        assert del_audit is not None

        # 8. Deleting again returns 404
        del_again = client.delete(f"/api/v1/cases/watchlist/{target_account}")
        assert del_again.status_code == 404
    finally:
        db.query(WatchlistEntry).filter(WatchlistEntry.account_id == target_account).delete()
        db.query(AuditLog).filter(AuditLog.target_entity == target_account).delete()
        db.commit()
        db.close()


# =============================================================================
# E. Investigation Notes: Create, Retrieve, Validate, Audit Trail
# =============================================================================

def test_investigation_notes_lifecycle():
    """Tests creating and retrieving persistent investigation notes:
    1. Validation: missing account returns 404
    2. Validation: empty note text returns 422
    3. Creation: persists note and audit log
    4. Retrieval: retrieves notes sorted chronologically
    """
    target_account = "ACC-1122"
    db = SessionLocal()
    try:
        # 1. Missing account validation
        bad_note = client.post("/api/v1/cases/notes", json={
            "account_id": "ACC-NONEXISTENT",
            "note_text": "Test note"
        })
        assert bad_note.status_code == 404

        # 2. Empty note text validation
        empty_note = client.post("/api/v1/cases/notes", json={
            "account_id": target_account,
            "note_text": "   "
        })
        assert empty_note.status_code == 422

        # 3. Create valid investigation note
        test_note_text = "Verified counterparty identity through bank branch inspection."
        create_res = client.post("/api/v1/cases/notes", json={
            "account_id": target_account,
            "note_text": test_note_text,
            "case_id": "CASE-2026-0042",
            "author": "Inspector Sharma"
        })
        assert create_res.status_code == 201
        note_data = create_res.json()
        assert note_data["account_id"] == target_account
        assert note_data["note_text"] == test_note_text
        assert note_data["author"] == "Inspector Sharma"

        # 4. Retrieve notes for account
        get_res = client.get(f"/api/v1/cases/notes/{target_account}")
        assert get_res.status_code == 200
        notes = get_res.json()
        assert len(notes) >= 1
        assert any(n["note_text"] == test_note_text for n in notes)

        # 5. Verify audit log entry
        audit = db.query(AuditLog).filter(
            AuditLog.target_entity == target_account,
            AuditLog.action == "ADD_NOTE"
        ).order_by(AuditLog.timestamp.desc()).first()
        assert audit is not None
        assert audit.actor == "Inspector Sharma"
    finally:
        db.query(InvestigationNote).filter(InvestigationNote.account_id == target_account).delete()
        db.query(AuditLog).filter(AuditLog.target_entity == target_account).delete()
        db.commit()
        db.close()
