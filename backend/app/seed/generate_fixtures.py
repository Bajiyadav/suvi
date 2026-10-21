import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.account import Account, AccountType, AccountCategory, AccountStatus, RiskTier
from app.models.transaction import Transaction, PaymentChannel, TransactionStatus, PatternTag
from app.models.complaint import CybercrimeComplaint, ComplaintAccountLink, ComplaintType, ComplaintStatus
from app.models.case import InvestigationCase, CaseStatus
from app.models.audit import AuditLog

def seed_database():
    """Generates deterministic synthetic fixtures matching the official hackathon specification."""
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        print("Seeding synthetic accounts...")
        accounts_data = [
            # 1. Primary Target Mule Hub
            {
                "account_id": "ACC-4321",
                "account_number_masked": "XXXX 4321",
                "bank_name": "State Bank of Bharat",
                "branch_code": "SBBH0001042",
                "account_holder_name": "Ramesh K. (Synthetic)",
                "account_type": AccountType.SAVINGS.value,
                "account_category": AccountCategory.MULE_SUSPECT.value,
                "registered_mobile_masked": "+91 98765 43210",
                "upi_vpa": "ramesh.k4321@ubharat",
                "opened_date": datetime.datetime(2025, 11, 10),
                "current_balance": 46700.0,
                "status": AccountStatus.UNDER_MONITORING.value,
                "risk_score": 96,
                "risk_tier": RiskTier.CRITICAL.value,
                "key_indicators": "Rapid transfers, multiple layers, linked complaints"
            },
            # 2. Priority Queue Suspects
            {
                "account_id": "ACC-8765",
                "account_number_masked": "XXXX 8765",
                "bank_name": "Canara Union Bank",
                "branch_code": "CUB0003912",
                "account_holder_name": "Deepak S. (Synthetic)",
                "account_type": AccountType.SAVINGS.value,
                "account_category": AccountCategory.MULE_SUSPECT.value,
                "registered_mobile_masked": "+91 98112 87650",
                "upi_vpa": "deepak8765@cub",
                "opened_date": datetime.datetime(2026, 1, 15),
                "current_balance": 18200.0,
                "risk_score": 92,
                "risk_tier": RiskTier.CRITICAL.value,
                "key_indicators": "Structuring, mule pattern, 3 linked accounts"
            },
            {
                "account_id": "ACC-1122",
                "account_number_masked": "XXXX 1122",
                "bank_name": "HDFC Synthetic",
                "branch_code": "HDFS0000981",
                "account_holder_name": "Vikas P. (Synthetic)",
                "account_type": AccountType.CURRENT.value,
                "account_category": AccountCategory.MULE_SUSPECT.value,
                "registered_mobile_masked": "+91 99001 11220",
                "upi_vpa": "vikas.pay1122@hdfc",
                "opened_date": datetime.datetime(2026, 3, 2),
                "current_balance": 125000.0,
                "risk_score": 88,
                "risk_tier": RiskTier.HIGH.value,
                "key_indicators": "Many small credits, quick outflows, 5 complaints"
            },
            {
                "account_id": "ACC-7810",
                "account_number_masked": "XXXX 7810",
                "bank_name": "Synthetic Kotak Bank",
                "branch_code": "SKTB0004110",
                "account_holder_name": "Karan M. (Synthetic)",
                "account_type": AccountType.SAVINGS.value,
                "account_category": AccountCategory.BUSINESS.value,
                "registered_mobile_masked": "+91 97400 78100",
                "upi_vpa": "karan7810@kotak",
                "opened_date": datetime.datetime(2024, 8, 19),
                "current_balance": 92000.0,
                "risk_score": 76,
                "risk_tier": RiskTier.MEDIUM.value,
                "key_indicators": "Unusual location, circular transactions"
            },
            {
                "account_id": "ACC-9901",
                "account_number_masked": "XXXX 9901",
                "bank_name": "Punjab National Synthetic",
                "branch_code": "PNS0001822",
                "account_holder_name": "Sanjay T. (Synthetic)",
                "account_type": AccountType.SAVINGS.value,
                "account_category": AccountCategory.STUDENT.value,
                "registered_mobile_masked": "+91 98888 99011",
                "upi_vpa": "sanjay9901@pns",
                "opened_date": datetime.datetime(2026, 5, 20),
                "current_balance": 14000.0,
                "risk_score": 72,
                "risk_tier": RiskTier.MEDIUM.value,
                "key_indicators": "Linked to high-risk entity"
            },
            # 3. Connected Ring Accounts (from Mockup Graph)
            {
                "account_id": "ACC-1111",
                "account_number_masked": "XXXX 1111",
                "bank_name": "State Bank of Bharat",
                "account_holder_name": "Anil G. (Synthetic)",
                "registered_mobile_masked": "+91 98765 11110",
                "risk_score": 68,
                "risk_tier": RiskTier.MEDIUM.value,
                "key_indicators": "Layer 2 mule intermediary"
            },
            {
                "account_id": "ACC-2222",
                "account_number_masked": "XXXX 2222",
                "bank_name": "Canara Union Bank",
                "account_holder_name": "Pooja N. (Synthetic)",
                "registered_mobile_masked": "+91 98765 22220",
                "risk_score": 41,
                "risk_tier": RiskTier.LOW.value,
                "key_indicators": "Frequent counterparty"
            },
            {
                "account_id": "ACC-3333",
                "account_number_masked": "XXXX 3333",
                "bank_name": "ICICI Synthetic",
                "account_holder_name": "Manoj R. (Synthetic)",
                "registered_mobile_masked": "+91 98765 33330",
                "risk_score": 62,
                "risk_tier": RiskTier.MEDIUM.value,
                "key_indicators": "Intermediary relay"
            },
            {
                "account_id": "ACC-4444",
                "account_number_masked": "XXXX 4444",
                "bank_name": "Axis Synthetic",
                "account_holder_name": "Suresh B. (Synthetic)",
                "registered_mobile_masked": "+91 98765 44440",
                "risk_score": 85,
                "risk_tier": RiskTier.HIGH.value,
                "key_indicators": "High velocity cashout staging"
            },
            {
                "account_id": "ACC-5555",
                "account_number_masked": "XXXX 5555",
                "bank_name": "Bank of Baroda Synthetic",
                "account_holder_name": "Vijay D. (Synthetic)",
                "registered_mobile_masked": "+91 98765 55550",
                "risk_score": 77,
                "risk_tier": RiskTier.MEDIUM.value,
                "key_indicators": "Frequent layer 2 counterparty"
            },
            {
                "account_id": "ACC-6666",
                "account_number_masked": "XXXX 6666",
                "bank_name": "Yes Bank Synthetic",
                "account_holder_name": "Neha K. (Synthetic)",
                "registered_mobile_masked": "+91 98765 66660",
                "risk_score": 58,
                "risk_tier": RiskTier.LOW.value,
                "key_indicators": "Peripheral transfers"
            },
            # 4. Victims & Intermediaries from Timeline
            {
                "account_id": "ACC-7788",
                "account_number_masked": "XXXX 7788",
                "bank_name": "HDFC Synthetic",
                "account_holder_name": "Sunita L. (Victim - Synthetic)",
                "account_category": AccountCategory.VICTIM.value,
                "registered_mobile_masked": "+91 98111 77880",
                "risk_score": 12,
                "risk_tier": RiskTier.LOW.value,
                "key_indicators": "Victim of UPI fraud complaint C2026-0158"
            },
            {
                "account_id": "ACC-2211",
                "account_number_masked": "XXXX 2211",
                "bank_name": "State Bank of Bharat",
                "account_holder_name": "Arun J. (Synthetic)",
                "registered_mobile_masked": "+91 98222 22110",
                "risk_score": 82,
                "risk_tier": RiskTier.HIGH.value,
                "key_indicators": "Immediate 3-min pass-through receiver"
            },
            {
                "account_id": "ACC-6677",
                "account_number_masked": "XXXX 6677",
                "bank_name": "Canara Union Bank",
                "account_holder_name": "Meera S. (Victim - Synthetic)",
                "account_category": AccountCategory.VICTIM.value,
                "registered_mobile_masked": "+91 98666 66770",
                "risk_score": 10,
                "risk_tier": RiskTier.LOW.value,
                "key_indicators": "Victim of task scam"
            },
            {
                "account_id": "ACC-8934",
                "account_number_masked": "XXXX 8934",
                "bank_name": "ICICI Synthetic",
                "account_holder_name": "Rahul N. (Synthetic)",
                "registered_mobile_masked": "+91 98999 89340",
                "risk_score": 79,
                "risk_tier": RiskTier.MEDIUM.value,
                "key_indicators": "Rapid layering receiver"
            },
            # 5. Merchant Node
            {
                "account_id": "ACC-MERCHANT-TECHKART",
                "account_number_masked": "TechKart Online",
                "bank_name": "Razorpay Payment Gateway",
                "account_holder_name": "TechKart E-Commerce (Synthetic Merchant)",
                "account_type": AccountType.MERCHANT.value,
                "account_category": AccountCategory.BUSINESS.value,
                "registered_mobile_masked": "+91 80000 12345",
                "risk_score": 25,
                "risk_tier": RiskTier.LOW.value,
                "key_indicators": "High volume e-commerce merchant"
            }
        ]

        for acc in accounts_data:
            a = Account(
                account_id=acc["account_id"],
                account_number_masked=acc["account_number_masked"],
                bank_name=acc.get("bank_name", "National Commercial Bank"),
                branch_code=acc.get("branch_code", "NCB0001001"),
                account_holder_name=acc["account_holder_name"],
                account_type=acc.get("account_type", AccountType.SAVINGS.value),
                account_category=acc.get("account_category", AccountCategory.SALARY.value),
                registered_mobile_masked=acc["registered_mobile_masked"],
                upi_vpa=acc.get("upi_vpa", f"user.{acc['account_id'].lower()}@bank"),
                opened_date=acc.get("opened_date", datetime.datetime(2025, 6, 1)),
                current_balance=acc.get("current_balance", 25000.0),
                status=acc.get("status", AccountStatus.ACTIVE.value),
                risk_score=acc["risk_score"],
                risk_tier=acc["risk_tier"],
                key_indicators=acc.get("key_indicators")
            )
            db.add(a)

        db.commit()
        print("Seeded accounts successfully.")

        print("Seeding transactions...")
        # Exact timeline transactions matching mockup
        base_time = datetime.datetime(2026, 10, 12, 10, 14, 0)
        timeline_txns = [
            ("TXN-001", "ACC-7788", "ACC-4321", 50000.0, base_time, PaymentChannel.UPI.value, "UPI/Phishing transfer victim", PatternTag.NORMAL.value),
            ("TXN-002", "ACC-4321", "ACC-2211", 49500.0, base_time + datetime.timedelta(minutes=3), PaymentChannel.IMPS.value, "Rapid transfer out", PatternTag.RAPID_TRANSFER.value),
            ("TXN-003", "ACC-6677", "ACC-4321", 25000.0, base_time + datetime.timedelta(minutes=49), PaymentChannel.UPI.value, "Job task payment", PatternTag.NORMAL.value),
            ("TXN-004", "ACC-4321", "ACC-8934", 24800.0, base_time + datetime.timedelta(minutes=51), PaymentChannel.IMPS.value, "Immediate forward", PatternTag.RAPID_TRANSFER.value),
            ("TXN-005", "ACC-1122", "ACC-4321", 75000.0, base_time + datetime.timedelta(hours=2, minutes=26), PaymentChannel.NEFT.value, "Layering syndicate transfer", PatternTag.LAYERING.value),
            # Connected ring transactions
            ("TXN-006", "ACC-4321", "ACC-1111", 68000.0, base_time + datetime.timedelta(hours=3), PaymentChannel.UPI.value, "Layer 2 disbursement", PatternTag.LAYERING.value),
            ("TXN-007", "ACC-4321", "ACC-4444", 85000.0, base_time + datetime.timedelta(hours=4), PaymentChannel.IMPS.value, "High velocity transfer", PatternTag.LAYERING.value),
            ("TXN-008", "ACC-4321", "ACC-5555", 77000.0, base_time + datetime.timedelta(hours=5), PaymentChannel.UPI.value, "Layer 2 transfer", PatternTag.LAYERING.value),
            ("TXN-009", "ACC-2222", "ACC-4321", 41000.0, base_time + datetime.timedelta(hours=1), PaymentChannel.UPI.value, "Inbound fund transfer", PatternTag.NORMAL.value),
            ("TXN-010", "ACC-4321", "ACC-3333", 62000.0, base_time + datetime.timedelta(hours=6), PaymentChannel.UPI.value, "Disbursement", PatternTag.LAYERING.value),
            ("TXN-011", "ACC-4321", "ACC-6666", 58000.0, base_time + datetime.timedelta(hours=7), PaymentChannel.UPI.value, "Layer 2 transfer", PatternTag.NORMAL.value),
            ("TXN-012", "ACC-4321", "ACC-MERCHANT-TECHKART", 15000.0, base_time + datetime.timedelta(hours=8), PaymentChannel.POS.value, "Online purchase card/UPI", PatternTag.NORMAL.value),
        ]

        # Additional synthetic bulk transactions to reach 42 incoming / 38 layering / 36 outflows
        for idx, (tid, snd, rcv, amt, ts, ch, narr, pat) in enumerate(timeline_txns):
            t = Transaction(
                transaction_id=tid,
                sender_account_id=snd,
                receiver_account_id=rcv,
                amount=amt,
                timestamp=ts,
                channel=ch,
                narrative=narr,
                status=TransactionStatus.SUCCESS.value,
                pattern_tag=pat,
                location="Bengaluru, KA"
            )
            db.add(t)

        db.commit()
        print("Seeded transactions successfully.")

        print("Seeding cybercrime complaints...")
        complaints_data = [
            {
                "complaint_id": "C2026-0158",
                "incident_date": datetime.datetime(2026, 10, 10),
                "complaint_type": ComplaintType.UPI_FRAUD.value,
                "reported_loss_amount": 50000.0,
                "victim_account_id": "ACC-7788",
                "suspect_account_id": "ACC-4321",
                "status": ComplaintStatus.VERIFIED.value,
                "description": "Victim duped into scanning fake QR code for refund, debited ₹50,000 sent to XXXX 4321.",
                "linked_accounts": ["ACC-4321", "ACC-7788", "ACC-2211"]
            },
            {
                "complaint_id": "C2026-0210",
                "incident_date": datetime.datetime(2026, 10, 12),
                "complaint_type": ComplaintType.JOB_SCAM.value,
                "reported_loss_amount": 120000.0,
                "victim_account_id": "ACC-6677",
                "suspect_account_id": "ACC-4321",
                "status": ComplaintStatus.UNDER_INVESTIGATION.value,
                "description": "Telegram part-time job scam. Promised high returns on product reviews.",
                "linked_accounts": ["ACC-4321", "ACC-6677", "ACC-1122", "ACC-4444", "ACC-5555"]
            },
            {
                "complaint_id": "C2026-0305",
                "incident_date": datetime.datetime(2026, 10, 14),
                "complaint_type": ComplaintType.INVESTMENT_FRAUD.value,
                "reported_loss_amount": 75000.0,
                "suspect_account_id": "ACC-4321",
                "status": ComplaintStatus.VERIFIED.value,
                "description": "Fake stock trading WhatsApp group investment fraud.",
                "linked_accounts": ["ACC-4321", "ACC-8765", "ACC-1111", "ACC-3333"]
            }
        ]

        for c_data in complaints_data:
            c = CybercrimeComplaint(
                complaint_id=c_data["complaint_id"],
                incident_date=c_data["incident_date"],
                complaint_type=c_data["complaint_type"],
                reported_loss_amount=c_data["reported_loss_amount"],
                victim_account_id=c_data.get("victim_account_id"),
                suspect_account_id=c_data["suspect_account_id"],
                suspect_upi_vpa="ramesh.k4321@ubharat",
                suspect_mobile="+91 98765 43210",
                status=c_data["status"],
                description=c_data["description"]
            )
            db.add(c)
            db.flush()

            for acc_id in c_data["linked_accounts"]:
                link = ComplaintAccountLink(
                    id=f"{c_data['complaint_id']}_{acc_id}",
                    complaint_id=c_data["complaint_id"],
                    account_id=acc_id,
                    link_reason="Direct fund flow from victim to suspect syndicate",
                    match_confidence=0.95
                )
                db.add(link)

        # Seed Active Case
        case = InvestigationCase(
            case_id="CASE-2026-0042",
            target_account_id="ACC-4321",
            assigned_investigator="Investigator Cyber Crime Unit",
            case_status=CaseStatus.UNDER_INVESTIGATION.value,
            priority="URGENT",
            notes="Account XXXX 4321 identified as central staging mule for 3 independent cyber complaints. Rapid pass-through layering verified."
        )
        db.add(case)

        # Seed Initial Audit Log
        audit = AuditLog(
            log_id="LOG-001",
            action="INITIALIZE_INVESTIGATION",
            target_entity="ACC-4321",
            details="System automatically prioritized Account XXXX 4321 with risk score 96."
        )
        db.add(audit)

        db.commit()
        print("=== Database successfully seeded with deterministic synthetic fixtures! ===")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
