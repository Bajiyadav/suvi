"""
Universal Dataset Ingestion Engine for FraudTrace AI (Cyber Hackathon 2026 PS-01).
Enables seamless loading of:
1. JSON datasets (structured or semi-structured)
2. Single CSV files (transactions, accounts, or complaints with fuzzy header detection)
3. Excel spreadsheets (.xlsx, .xls) with multi-sheet or single-sheet format
4. Complete directories containing multiple CSV/JSON files from Google Drive
5. Auto-synthesis and registration of missing accounts from transaction flows
"""

import os
import sys
import json
import csv
import glob
import argparse
import datetime
from typing import Dict, Any, List, Optional, Set
import pandas as pd
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.models.account import Account, AccountType, AccountCategory, AccountStatus, RiskTier
from app.models.transaction import Transaction, PaymentChannel, TransactionStatus, PatternTag
from app.models.complaint import CybercrimeComplaint, ComplaintAccountLink, ComplaintType, ComplaintStatus
from app.models.case import InvestigationCase, CaseStatus
from app.models.audit import AuditLog
from app.services.risk_scoring import RiskScoringService


# Common column synonyms for fuzzy mapping
TXN_COLUMN_SYNONYMS = {
    "transaction_id": ["transaction_id", "txn_id", "trans_id", "tx_id", "id", "reference_no", "ref_no", "utr", "utr_number", "txn_no", "trans_no", "txn_ref", "transactionid"],
    "sender_account_id": ["sender_account_id", "sender_account", "sender_acc", "from_account_id", "from_account", "from_acc", "source_account_id", "source_account", "source_acc", "payer_account_id", "payer_account", "payer_acc", "payer", "sender", "debit_account", "from", "src", "origin_account", "origin", "senderaccountid"],
    "receiver_account_id": ["receiver_account_id", "receiver_account", "receiver_acc", "to_account_id", "to_account", "to_acc", "dest_account_id", "dest_account", "dest_acc", "payee_account_id", "payee_account", "payee_acc", "payee", "receiver", "credit_account", "beneficiary_account", "beneficiary_acc", "beneficiary", "to", "dst", "destination", "receiveraccountid"],
    "amount": ["amount", "txn_amount", "amt", "value", "trans_amount", "total_amount", "transaction_amount", "txnamount"],
    "timestamp": ["timestamp", "datetime", "date", "trans_date", "time", "created_at", "txn_date", "txn_time", "txn_timestamp", "tx_time"],
    "channel": ["channel", "payment_channel", "payment_mode", "mode", "type", "txn_type", "method"],
    "narrative": ["narrative", "remarks", "description", "desc", "comment", "memo", "purpose", "notes"],
    "status": ["status", "txn_status", "state"],
    "location": ["location", "city", "state", "geo", "place"],
    "device_id": ["device_id", "device", "dev_id", "terminal_id"],
    "ip_address": ["ip_address", "ip", "client_ip", "source_ip"]
}

ACC_COLUMN_SYNONYMS = {
    "account_id": ["account_id", "acc_id", "account_no", "account_number", "acc_no", "id", "accountid"],
    "account_holder_name": ["account_holder_name", "holder_name", "name", "customer_name", "user_name", "entity_name", "accountholdername"],
    "bank_name": ["bank_name", "bank", "branch", "bank_code", "bankname"],
    "branch_code": ["branch_code", "branch", "ifsc", "ifsc_code", "branchcode"],
    "account_type": ["account_type", "type", "acc_type", "accounttype"],
    "account_category": ["account_category", "category", "risk_category", "accountcategory"],
    "registered_mobile_masked": ["registered_mobile_masked", "mobile", "phone", "contact", "mobile_no", "phone_number"],
    "upi_vpa": ["upi_vpa", "upi_id", "vpa", "upi"],
    "device_id": ["device_id", "device", "dev_id"],
    "ip_address": ["ip_address", "ip"],
    "opened_date": ["opened_date", "open_date", "created_at", "reg_date", "registration_date"],
    "current_balance": ["current_balance", "balance", "bal", "curr_bal", "currentbalance"],
    "status": ["status", "account_status", "state"]
}

CMP_COLUMN_SYNONYMS = {
    "complaint_id": ["complaint_id", "ncrp_id", "fir_no", "complaint_no", "ticket_id", "id", "case_no"],
    "suspect_account_id": ["suspect_account_id", "suspect_account", "account_id", "acc_id", "mule_account", "target_account", "suspectaccountid"],
    "reported_loss_amount": ["reported_loss_amount", "loss_amount", "amount", "defrauded_amount", "disputed_amount"],
    "incident_date": ["incident_date", "date", "timestamp", "created_at", "reported_date"],
    "complaint_type": ["complaint_type", "type", "category", "fraud_type", "crime_category"],
    "description": ["description", "desc", "details", "narrative", "crime_summary"],
    "status": ["status", "complaint_status"]
}


def normalize_str(s: str) -> str:
    return str(s).strip().lower().replace("_", "").replace("-", "").replace(" ", "").replace(".", "")


def map_row_columns(row: Dict[str, Any], synonyms_map: Dict[str, List[str]]) -> Dict[str, Any]:
    """Maps arbitrary input row keys to standardized schema column names."""
    normalized_row = {normalize_str(k): v for k, v in row.items()}
    mapped = {}
    for target_col, synonyms in synonyms_map.items():
        for syn in synonyms:
            norm_syn = normalize_str(syn)
            if norm_syn in normalized_row:
                mapped[target_col] = normalized_row[norm_syn]
                break
    return mapped


def parse_datetime(val: Any) -> datetime.datetime:
    if isinstance(val, datetime.datetime):
        return val
    if not val:
        return datetime.datetime.now(datetime.timezone.utc)
    try:
        s = str(val).strip().replace("Z", "+00:00")
        return datetime.datetime.fromisoformat(s)
    except Exception:
        pass
    try:
        # Fallback to dateutil / pandas
        dt = pd.to_datetime(val)
        return dt.to_pydatetime()
    except Exception:
        return datetime.datetime.now(datetime.timezone.utc)


def parse_float(val: Any, default: float = 0.0) -> float:
    try:
        if val is None or val == "":
            return default
        # Clean currency symbols or commas
        s = str(val).replace(",", "").replace("₹", "").replace("$", "").strip()
        return float(s)
    except Exception:
        return default


def ingest_from_dict(data: Dict[str, Any], db: Session, wipe_existing: bool = True) -> Dict[str, Any]:
    """Ingests accounts, transactions, and complaints from a dictionary.
    Auto-discovers and synthesizes missing accounts referenced in transactions and complaints.
    """
    if wipe_existing:
        print("[Ingestion Engine] Resetting existing database tables for fresh evaluation...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    existing_account_ids: Set[str] = set()

    # 1. Accounts Explicit Ingestion
    accounts_in = data.get("accounts", [])
    print(f"[Ingestion Engine] Ingesting {len(accounts_in)} explicit account records...")
    for idx, raw_acc in enumerate(accounts_in):
        acc = map_row_columns(raw_acc, ACC_COLUMN_SYNONYMS)
        account_id = str(acc.get("account_id") or f"ACC-DATA-{idx:04d}").strip()
        if account_id in existing_account_ids:
            continue
        existing_account_ids.add(account_id)

        account_obj = Account(
            account_id=account_id,
            account_number_masked=acc.get("account_number_masked", f"XXXX {account_id[-4:]}"),
            bank_name=acc.get("bank_name", "State Bank of India"),
            branch_code=acc.get("branch_code", "SBIN0001001"),
            account_holder_name=acc.get("account_holder_name", f"Entity {account_id}"),
            account_type=acc.get("account_type", AccountType.SAVINGS.value),
            account_category=acc.get("account_category", AccountCategory.SALARY.value),
            registered_mobile_masked=acc.get("registered_mobile_masked", "+91 98XXX XXXXX"),
            upi_vpa=acc.get("upi_vpa", f"{account_id.lower()}@okaxis"),
            device_id=acc.get("device_id", f"DEV-{account_id[-4:]}"),
            ip_address=acc.get("ip_address", "192.168.1.100"),
            opened_date=parse_datetime(acc.get("opened_date", datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=90))),
            current_balance=parse_float(acc.get("current_balance"), 25000.0),
            status=acc.get("status", AccountStatus.ACTIVE.value),
            risk_score=int(parse_float(acc.get("risk_score"), 15.0)),
            risk_tier=acc.get("risk_tier", RiskTier.LOW.value),
            key_indicators=acc.get("key_indicators", "Dataset record"),
        )
        db.add(account_obj)
    db.commit()

    # 2. Normalize and Prepare Transactions
    txns_in = data.get("transactions", [])
    print(f"[Ingestion Engine] Processing {len(txns_in)} transactions and discovering active accounts...")
    normalized_txns = []
    referenced_accounts: Set[str] = set()

    for idx, raw_txn in enumerate(txns_in):
        txn = map_row_columns(raw_txn, TXN_COLUMN_SYNONYMS)
        txn_id = str(txn.get("transaction_id") or f"TXN-DATA-{idx+1:05d}").strip()
        sender_id = str(txn.get("sender_account_id") or f"ACC-SOURCE-{idx:04d}").strip()
        receiver_id = str(txn.get("receiver_account_id") or f"ACC-DEST-{idx:04d}").strip()
        amount = parse_float(txn.get("amount"), 1000.0)

        referenced_accounts.add(sender_id)
        referenced_accounts.add(receiver_id)

        normalized_txns.append({
            "transaction_id": txn_id,
            "sender_account_id": sender_id,
            "receiver_account_id": receiver_id,
            "amount": amount,
            "timestamp": parse_datetime(txn.get("timestamp")),
            "channel": txn.get("channel", PaymentChannel.UPI.value),
            "narrative": txn.get("narrative", "Fund transfer"),
            "status": txn.get("status", TransactionStatus.SUCCESS.value),
            "pattern_tag": txn.get("pattern_tag", PatternTag.NORMAL.value),
            "location": txn.get("location", "India"),
            "ip_address": txn.get("ip_address"),
            "device_id": txn.get("device_id")
        })

    # 3. Check for Missing Accounts in Complaints
    complaints_in = data.get("complaints", [])
    normalized_complaints = []
    for idx, raw_c in enumerate(complaints_in):
        c = map_row_columns(raw_c, CMP_COLUMN_SYNONYMS)
        c_id = str(c.get("complaint_id") or f"NCRP-DATA-{idx+1:04d}").strip()
        suspect_id = c.get("suspect_account_id")
        if suspect_id:
            suspect_id = str(suspect_id).strip()
            referenced_accounts.add(suspect_id)

        normalized_complaints.append({
            "complaint_id": c_id,
            "incident_date": parse_datetime(c.get("incident_date")),
            "complaint_type": c.get("complaint_type", ComplaintType.UPI_FRAUD.value),
            "reported_loss_amount": parse_float(c.get("reported_loss_amount"), 50000.0),
            "suspect_account_id": suspect_id,
            "status": c.get("status", ComplaintStatus.VERIFIED.value),
            "description": c.get("description", "Reported cyber fraud incident"),
        })

    # 4. Auto-Synthesize Missing Accounts
    missing_accounts = referenced_accounts - existing_account_ids
    if missing_accounts:
        print(f"[Ingestion Engine] Auto-synthesizing {len(missing_accounts)} discovered participant accounts...")
        for acc_id in missing_accounts:
            account_obj = Account(
                account_id=acc_id,
                account_number_masked=f"XXXX {acc_id[-4:] if len(acc_id) >= 4 else acc_id}",
                bank_name="Indian Financial Institution",
                branch_code="INDB0001001",
                account_holder_name=f"Entity {acc_id}",
                account_type=AccountType.SAVINGS.value,
                account_category=AccountCategory.SALARY.value,
                registered_mobile_masked="+91 9XXXX XXXXX",
                upi_vpa=f"{acc_id.lower()}@bank",
                device_id=f"DEV-{acc_id[-4:] if len(acc_id) >= 4 else acc_id}",
                ip_address="10.0.0.1",
                opened_date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=120),
                current_balance=50000.0,
                status=AccountStatus.ACTIVE.value,
                risk_score=10,
                risk_tier=RiskTier.LOW.value,
                key_indicators="Discovered from transaction flows",
            )
            db.add(account_obj)
            existing_account_ids.add(acc_id)
        db.commit()

    # 5. Insert Transactions
    print(f"[Ingestion Engine] Committing {len(normalized_txns)} transactions...")
    for txn in normalized_txns:
        txn_obj = Transaction(
            transaction_id=txn["transaction_id"],
            sender_account_id=txn["sender_account_id"],
            receiver_account_id=txn["receiver_account_id"],
            amount=txn["amount"],
            timestamp=txn["timestamp"],
            channel=txn["channel"],
            narrative=txn["narrative"],
            status=txn["status"],
            pattern_tag=txn["pattern_tag"],
            location=txn["location"],
            ip_address=txn["ip_address"],
            device_id=txn["device_id"],
        )
        db.add(txn_obj)
    db.commit()

    # 6. Insert Complaints
    print(f"[Ingestion Engine] Committing {len(normalized_complaints)} complaints...")
    for c in normalized_complaints:
        c_obj = CybercrimeComplaint(
            complaint_id=c["complaint_id"],
            incident_date=c["incident_date"],
            complaint_type=c["complaint_type"],
            reported_loss_amount=c["reported_loss_amount"],
            suspect_account_id=c["suspect_account_id"],
            status=c["status"],
            description=c["description"],
        )
        db.add(c_obj)
    db.commit()

    # 7. Complaint Links
    links_in = data.get("complaint_links", [])
    for idx, link in enumerate(links_in):
        link_account = str(link.get("account_id", "")).strip()
        if link_account in existing_account_ids:
            link_obj = ComplaintAccountLink(
                id=link.get("id", f"LINK-{idx}-{link.get('complaint_id', 'CMP')[-6:]}"),
                complaint_id=link["complaint_id"],
                account_id=link_account,
                link_reason=link.get("link_reason", link.get("relationship", "SUSPECT_BENEFICIARY")),
                match_confidence=parse_float(link.get("match_confidence"), 1.0),
                created_at=parse_datetime(link.get("created_at")),
            )
            db.add(link_obj)
    db.commit()

    # 8. Recompute Dynamic Explainable Risk Scores for All Accounts
    print("[Ingestion Engine] Running FraudTrace AI risk scoring and pattern detectors across all accounts...")
    scoring_service = RiskScoringService(db)
    all_accounts = db.query(Account).all()
    high_risk_count = 0
    scored_results = []

    for account in all_accounts:
        try:
            risk_exp = scoring_service.calculate_explainable_risk(account.account_id)
            score = risk_exp.get("risk_score", 0)
            if score >= 70:
                high_risk_count += 1
            scored_results.append({
                "account_id": account.account_id,
                "risk_score": score,
                "tier": risk_exp.get("risk_tier", "LOW"),
                "primary_indicator": risk_exp.get("top_indicators", [{}])[0].get("description", "None") if risk_exp.get("top_indicators") else "None"
            })
        except Exception as e:
            print(f"Warning: Failed to score {account.account_id}: {e}")

    scored_results.sort(key=lambda x: x["risk_score"], reverse=True)

    summary = {
        "status": "success",
        "total_accounts": len(all_accounts),
        "total_transactions": len(normalized_txns),
        "total_complaints": len(normalized_complaints),
        "high_risk_accounts_count": high_risk_count,
        "top_high_risk": scored_results[:5]
    }

    print("=" * 65)
    print("🎯 FRAUDTRACE AI INGESTION COMPLETE")
    print(f"Total Accounts Registered:      {summary['total_accounts']}")
    print(f"Total Transactions Processed:    {summary['total_transactions']}")
    print(f"Total Cybercrime Complaints:    {summary['total_complaints']}")
    print(f"Identified Mule Suspects (>=70): {summary['high_risk_accounts_count']}")
    if summary["top_high_risk"]:
        print("Top Flagged Accounts:")
        for r in summary["top_high_risk"]:
            print(f"  - {r['account_id']} (Score: {r['risk_score']}, Tier: {r['tier']}): {r['primary_indicator']}")
    print("=" * 65)

    return summary


def load_file_records(file_path: str) -> List[Dict[str, Any]]:
    """Loads records from CSV, JSON, or Excel file into a list of dicts."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            return list(reader)
    elif ext == ".json":
        with open(file_path, "r", encoding="utf-8") as f:
            content = json.load(f)
            if isinstance(content, list):
                return content
            elif isinstance(content, dict):
                return [content]
    elif ext in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path)
        return df.to_dict(orient="records")
    return []


def ingest_from_file_or_dir(target_path: str, wipe_existing: bool = True) -> Dict[str, Any]:
    """Universal loader that handles a single file (CSV, JSON, XLSX) or a directory."""
    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Path does not exist: {target_path}")

    db: Session = SessionLocal()
    try:
        # Case 1: Target is a directory (e.g. downloaded Google Drive folder)
        if os.path.isdir(target_path):
            print(f"[Ingestion Engine] Scanning directory: {target_path}")
            data = {"accounts": [], "transactions": [], "complaints": [], "complaint_links": []}
            files = glob.glob(os.path.join(target_path, "**/*.*"), recursive=True)
            for fpath in files:
                ext = os.path.splitext(fpath)[1].lower()
                if ext not in [".csv", ".json", ".xlsx", ".xls"]:
                    continue
                fname = os.path.basename(fpath).lower()
                records = load_file_records(fpath)
                if not records:
                    continue

                if any(k in fname for k in ["txn", "trans", "flow", "transfer"]):
                    data["transactions"].extend(records)
                elif any(k in fname for k in ["account", "acc", "mule", "holder"]):
                    data["accounts"].extend(records)
                elif any(k in fname for k in ["complaint", "ncrp", "fir", "report"]):
                    data["complaints"].extend(records)
                elif "link" in fname:
                    data["complaint_links"].extend(records)
                else:
                    # Infer by inspecting keys
                    sample_keys = [normalize_str(k) for k in records[0].keys()]
                    if any(k in sample_keys for k in ["sender", "fromaccount", "receiver", "toaccount"]):
                        data["transactions"].extend(records)
                    elif any(k in sample_keys for k in ["complaintid", "firno", "reportedloss"]):
                        data["complaints"].extend(records)
                    elif any(k in sample_keys for k in ["accountid", "accno", "balance"]):
                        data["accounts"].extend(records)

            return ingest_from_dict(data, db, wipe_existing=wipe_existing)

        # Case 2: Target is a JSON file
        if target_path.endswith(".json"):
            with open(target_path, "r", encoding="utf-8") as f:
                content = json.load(f)
            if isinstance(content, dict) and ("transactions" in content or "accounts" in content):
                return ingest_from_dict(content, db, wipe_existing=wipe_existing)
            elif isinstance(content, list):
                # Infer array content
                data = {"accounts": [], "transactions": content, "complaints": []}
                return ingest_from_dict(data, db, wipe_existing=wipe_existing)

        # Case 3: Target is a single CSV or Excel file
        ext = os.path.splitext(target_path)[1].lower()
        if ext in [".csv", ".xlsx", ".xls"]:
            records = load_file_records(target_path)
            print(f"[Ingestion Engine] Loaded {len(records)} records from {os.path.basename(target_path)}")
            # Auto-detect role
            if not records:
                return {"status": "error", "message": "File is empty"}
            sample_keys = [normalize_str(k) for k in records[0].keys()]
            if any(k in sample_keys for k in ["complaintid", "firno", "suspectaccount"]):
                data = {"accounts": [], "transactions": [], "complaints": records}
            elif any(k in sample_keys for k in ["accountholder", "bankname", "currentbalance"]):
                data = {"accounts": records, "transactions": [], "complaints": []}
            else:
                # Default to transactions
                data = {"accounts": [], "transactions": records, "complaints": []}
            return ingest_from_dict(data, db, wipe_existing=wipe_existing)

        raise ValueError(f"Unsupported file format: {target_path}")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Universal Dataset Ingestion Engine for FraudTrace AI.")
    parser.add_argument("--file", type=str, help="Path to CSV, JSON, or Excel file")
    parser.add_argument("--dir", type=str, help="Path to directory containing dataset files")
    parser.add_argument("--no-wipe", action="store_true", help="Do not wipe existing database before loading")
    args = parser.parse_args()

    target = args.dir or args.file
    if not target:
        print("Please specify --file <path> or --dir <directory_path>")
        sys.exit(1)

    ingest_from_file_or_dir(target, wipe_existing=not args.no_wipe)
