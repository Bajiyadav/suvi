import pytest
import datetime
import os
import tempfile
import csv
import json
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.account import Account
from app.seed.ingest_alternate_dataset import (
    ingest_from_dict,
    ingest_from_file_or_dir,
    map_row_columns,
    TXN_COLUMN_SYNONYMS
)
from app.seed.generate_fixtures import seed_database

client = TestClient(app)


def test_alternate_dataset_on_the_spot_ingestion():
    """Validates that a completely new, judge-supplied alternate dataset can be ingested
    and dynamically analyzed on the spot with zero failure.
    """
    db = SessionLocal()
    try:
        now = datetime.datetime.now(datetime.timezone.utc)
        alternate_data = {
            "accounts": [
                {
                    "account_id": "JUDGE-ACC-001",
                    "account_number_masked": "XXXX 9001",
                    "bank_name": "Apex Test Bank",
                    "account_holder_name": "Judge Test Candidate",
                    "account_type": "SAVINGS",
                    "account_category": "MULE_SUSPECT",
                    "opened_date": (now - datetime.timedelta(days=20)).isoformat(),
                    "current_balance": 150000.0,
                    "device_id": "JUDGE-DEV-01",
                    "ip_address": "10.0.0.99"
                },
                {
                    "account_id": "JUDGE-ACC-002",
                    "account_number_masked": "XXXX 9002",
                    "bank_name": "Axis Synthetic",
                    "account_holder_name": "Beneficiary Two",
                    "account_type": "SAVINGS",
                    "account_category": "SALARY",
                    "opened_date": (now - datetime.timedelta(days=100)).isoformat(),
                    "current_balance": 10000.0,
                    "device_id": "JUDGE-DEV-01",
                    "ip_address": "10.0.0.99"
                }
            ],
            "transactions": [
                {
                    "transaction_id": "J-TXN-01",
                    "sender_account_id": "JUDGE-VICTIM-99",
                    "receiver_account_id": "JUDGE-ACC-001",
                    "amount": 95000.0,
                    "timestamp": (now - datetime.timedelta(minutes=8)).isoformat(),
                    "channel": "UPI",
                    "narrative": "Urgent transfer",
                    "status": "SUCCESS"
                },
                {
                    "transaction_id": "J-TXN-02",
                    "sender_account_id": "JUDGE-ACC-001",
                    "receiver_account_id": "JUDGE-ACC-002",
                    "amount": 92000.0,
                    "timestamp": (now - datetime.timedelta(minutes=2)).isoformat(),
                    "channel": "IMPS",
                    "narrative": "Immediate transfer",
                    "status": "SUCCESS"
                }
            ],
            "complaints": [
                {
                    "complaint_id": "JUDGE-CMP-001",
                    "incident_date": now.isoformat(),
                    "complaint_type": "Investment Scam",
                    "reported_loss_amount": 95000.0,
                    "suspect_account_id": "JUDGE-ACC-001",
                    "status": "Verified",
                    "description": "Victim tricked by investment group"
                }
            ],
            "complaint_links": [
                {
                    "complaint_id": "JUDGE-CMP-001",
                    "account_id": "JUDGE-ACC-001",
                    "relationship": "PRIMARY_BENEFICIARY"
                }
            ]
        }

        # Ingest alternate dataset (simulating judge upload)
        summary = ingest_from_dict(alternate_data, db, wipe_existing=True)
        assert summary["status"] == "success"
        assert summary["total_accounts"] >= 3  # ACC-001, ACC-002, and auto-synthesized VICTIM-99

        # 1. Test Overview / Risk Scoring on judge account
        res = client.get("/api/v1/overview?focused_account_id=JUDGE-ACC-001")
        assert res.status_code == 200
        overview = res.json()
        assert overview["risk_explanation"]["account_id"] == "JUDGE-ACC-001"
        assert overview["risk_explanation"]["risk_score"] >= 50

        # 2. Test Network Graph on judge account
        res_graph = client.get("/api/v1/graph/network/JUDGE-ACC-001?max_depth=2")
        assert res_graph.status_code == 200
        graph = res_graph.json()
        node_ids = [n["id"] for n in graph["nodes"]]
        assert "JUDGE-ACC-001" in node_ids
        assert "JUDGE-ACC-002" in node_ids

        # 3. Test Money Trail on judge account
        res_trail = client.get("/api/v1/money-trail/JUDGE-ACC-001/sequence?direction=both")
        assert res_trail.status_code == 200
        trail = res_trail.json()
        assert trail["root_account_id"] == "JUDGE-ACC-001"
        assert trail["total_hops_traced"] >= 1

    finally:
        seed_database()
        db.close()


def test_fuzzy_csv_transactions_auto_creates_accounts():
    """Validates that a raw CSV with non-standard column names and NO accounts table
    is smoothly ingested, all accounts are auto-synthesized, and scores are calculated.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
        writer = csv.writer(f)
        # Using non-standard synonyms: 'utr_no', 'from_account', 'to_account', 'txn_amount', 'tx_time', 'mode'
        writer.writerow(["utr_no", "from_account", "to_account", "txn_amount", "tx_time", "mode"])
        writer.writerow(["UTR-1001", "SRC-BANK-1", "MULE-CANDIDATE-X", "85000", (now - datetime.timedelta(minutes=15)).isoformat(), "UPI"])
        writer.writerow(["UTR-1002", "MULE-CANDIDATE-X", "FINAL-SINK-9", "82000", (now - datetime.timedelta(minutes=5)).isoformat(), "IMPS"])
        f_path = f.name

    try:
        summary = ingest_from_file_or_dir(f_path, wipe_existing=True)
        assert summary["status"] == "success"
        assert summary["total_transactions"] == 2
        assert summary["total_accounts"] == 3  # SRC-BANK-1, MULE-CANDIDATE-X, FINAL-SINK-9

        # Verify through API
        res = client.get("/api/v1/accounts")
        assert res.status_code == 200
        accounts = res.json()
        acc_ids = [a["account_id"] for a in accounts]
        assert "MULE-CANDIDATE-X" in acc_ids
        assert "SRC-BANK-1" in acc_ids
        assert "FINAL-SINK-9" in acc_ids

        # Check risk score calculated dynamically on MULE-CANDIDATE-X
        res_score = client.get("/api/v1/overview?focused_account_id=MULE-CANDIDATE-X")
        assert res_score.status_code == 200
        assert res_score.json()["risk_explanation"]["risk_score"] > 30

    finally:
        if os.path.exists(f_path):
            os.remove(f_path)
        seed_database()


def test_excel_and_directory_ingestion():
    """Validates that multi-file directories containing separate CSVs or Excel sheets
    can be ingested seamlessly.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create transactions.csv in folder
        tx_path = os.path.join(temp_dir, "transactions.csv")
        with open(tx_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["txn_id", "sender_account", "receiver_account", "amount", "timestamp", "channel"])
            writer.writerow(["TX-9901", "VICTIM-101", "SUSPECT-202", "50000", now.isoformat(), "UPI"])
            writer.writerow(["TX-9902", "SUSPECT-202", "SINK-303", "48000", now.isoformat(), "NEFT"])

        # Create complaints.csv in folder
        cmp_path = os.path.join(temp_dir, "cyber_complaints.csv")
        with open(cmp_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["complaint_id", "suspect_account_id", "reported_loss_amount", "complaint_type", "incident_date"])
            writer.writerow(["FIR-2026-001", "SUSPECT-202", "50000", "Phishing Scam", now.isoformat()])

        # Ingest entire directory
        summary = ingest_from_file_or_dir(temp_dir, wipe_existing=True)
        assert summary["status"] == "success"
        assert summary["total_transactions"] == 2
        assert summary["total_complaints"] == 1
        assert summary["total_accounts"] >= 3

        # Verify complaints endpoint
        res_cmp = client.get("/api/v1/complaints")
        assert res_cmp.status_code == 200
        cmps = res_cmp.json()
        assert any(c["complaint_id"] == "FIR-2026-001" for c in cmps)

    # Clean restore
    seed_database()
