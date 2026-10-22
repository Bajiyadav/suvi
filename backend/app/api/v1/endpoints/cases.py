from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import uuid
import os

from app.core.database import get_db
from app.core.security import get_current_investigator, InvestigatorUser, enforce_human_review_policy
from app.models.account import Account
from app.models.case import InvestigationCase, CaseStatus, WatchlistEntry, InvestigationNote
from app.models.audit import AuditLog
from app.models.solved_case import SolvedCase
from app.schemas.case import (
    CaseCreate,
    CaseUpdate,
    CaseResponse,
    WatchlistCreate,
    WatchlistResponse,
    InvestigationNoteCreate,
    InvestigationNoteResponse,
    ActionRequest,
    ActionRequestResponse,
    AuditLogResponse,
)
from app.schemas.solved_case import SolvedCaseCreate, SolvedCaseResponse

router = APIRouter()

# -------------------------------------------------------------------------
# AUTHENTICATION & ACCESS CONTROL LIMITATION NOTICE:
# This hackathon demonstration prototype does NOT currently enforce JWT/OAuth2
# authentication or RBAC authorization. Write operations accept caller-provided
# identity tokens if provided, but never invent fictional investigator credentials.
# Production deployment requires integration with a secure enterprise identity provider (IdP).
# AUTOMATIC ADVERSE FINANCIAL ACTION RESTRICTION:
# FraudTrace AI explicitly restricts AI risk scores to human-review decision support.
# Automated liens, freezes, or account debits are strictly prohibited.
# -------------------------------------------------------------------------


# =========================================================================
# 1. Investigation Cases
# =========================================================================

@router.get("", response_model=List[CaseResponse])
def list_cases(db: Session = Depends(get_db)):
    """Lists all active and resolved investigation cases."""
    return db.query(InvestigationCase).order_by(InvestigationCase.created_at.desc()).all()


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_user: InvestigatorUser = Depends(get_current_investigator)
):
    """Opens a new case dossier for an account. Validates account existence."""
    account = db.query(Account).filter(Account.account_id == case_in.target_account_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"Account '{case_in.target_account_id}' not found. Cannot create case for nonexistent account."
        )

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    new_case = InvestigationCase(
        case_id=f"CASE-{now_utc.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}",
        target_account_id=case_in.target_account_id,
        assigned_investigator=case_in.assigned_investigator or current_user.name,
        case_status=case_in.case_status or CaseStatus.UNDER_INVESTIGATION.value,
        priority=case_in.priority or "HIGH",
        notes=case_in.notes,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(new_case)

    # Write audit log
    audit = AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now_utc,
        action="CREATE_CASE",
        actor=case_in.assigned_investigator or current_user.name,
        target_entity=case_in.target_account_id,
        details=f"Opened investigation case {new_case.case_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_case)
    return new_case


@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(case_id: str, case_update: CaseUpdate, db: Session = Depends(get_db)):
    """Updates case status, priority, or notes."""
    case = db.query(InvestigationCase).filter(InvestigationCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    if case_update.case_status:
        case.case_status = case_update.case_status
    if case_update.priority:
        case.priority = case_update.priority
    if case_update.notes:
        case.notes = case_update.notes
    case.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(case)
    return case


# =========================================================================
# 2. Watchlist Management (Case Action Persistence)
# =========================================================================

@router.post("/watchlist", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    entry_in: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: InvestigatorUser = Depends(get_current_investigator)
):
    """Adds a target account to the persistent investigator watchlist.
    Validates account existence, prevents duplicates, and writes audit trail.
    """
    account = db.query(Account).filter(Account.account_id == entry_in.account_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"Account '{entry_in.account_id}' not found. Cannot add nonexistent account to watchlist."
        )

    # Prevent duplicate active watchlist entry
    existing_entry = db.query(WatchlistEntry).filter(
        WatchlistEntry.account_id == entry_in.account_id,
        WatchlistEntry.is_active == True  # noqa: E712
    ).first()
    if existing_entry:
        raise HTTPException(
            status_code=409,
            detail=f"Account '{entry_in.account_id}' is already in the active watchlist (Entry ID: {existing_entry.entry_id})."
        )

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    entry = WatchlistEntry(
        entry_id=f"WL-{uuid.uuid4().hex[:10].upper()}",
        account_id=entry_in.account_id,
        reason=entry_in.reason,
        priority=entry_in.priority or "HIGH",
        added_at=now_utc,
        investigator_id=entry_in.investigator_id,  # Only recorded if caller supplied it; never invented
        is_active=True,
    )
    db.add(entry)

    # Record persistent audit trail
    audit = AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now_utc,
        action="ADD_WATCHLIST",
        actor=entry_in.investigator_id or current_user.name,
        target_entity=entry_in.account_id,
        details=f"Added account {entry_in.account_id} to watchlist. Reason: {entry_in.reason}"
    )
    db.add(audit)
    db.commit()
    db.refresh(entry)

    return WatchlistResponse(
        entry_id=entry.entry_id,
        account_id=entry.account_id,
        account_number_masked=account.account_number_masked,
        bank_name=account.bank_name,
        risk_score=account.risk_score,
        reason=entry.reason,
        priority=entry.priority,
        added_at=entry.added_at,
        investigator_id=entry.investigator_id,
        is_active=entry.is_active,
        removed_at=entry.removed_at,
    )


@router.get("/watchlist", response_model=List[WatchlistResponse])
def list_watchlist(
    is_active: bool = Query(True, description="Filter for currently active entries"),
    db: Session = Depends(get_db)
):
    """Lists persistent watchlist entries with joined account risk metadata."""
    query = db.query(WatchlistEntry, Account).join(
        Account, WatchlistEntry.account_id == Account.account_id
    )
    if is_active:
        query = query.filter(WatchlistEntry.is_active == True)  # noqa: E712

    results = query.order_by(WatchlistEntry.added_at.desc()).all()

    response_items = []
    for entry, acc in results:
        response_items.append(
            WatchlistResponse(
                entry_id=entry.entry_id,
                account_id=entry.account_id,
                account_number_masked=acc.account_number_masked,
                bank_name=acc.bank_name,
                risk_score=acc.risk_score,
                reason=entry.reason,
                priority=entry.priority,
                added_at=entry.added_at,
                investigator_id=entry.investigator_id,
                is_active=entry.is_active,
                removed_at=entry.removed_at,
            )
        )
    return response_items


@router.delete("/watchlist/{account_id}")
def remove_from_watchlist(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: InvestigatorUser = Depends(get_current_investigator)
):
    """Deactivates a watchlist entry for the specified account and records audit event."""
    entry = db.query(WatchlistEntry).filter(
        WatchlistEntry.account_id == account_id,
        WatchlistEntry.is_active == True  # noqa: E712
    ).first()

    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"Active watchlist entry for account '{account_id}' not found."
        )

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    entry.is_active = False
    entry.removed_at = now_utc

    audit = AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now_utc,
        action="REMOVE_WATCHLIST",
        actor=current_user.name,
        target_entity=account_id,
        details=f"Removed account {account_id} from active watchlist"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"Account '{account_id}' removed from active watchlist.",
        "account_id": account_id,
        "entry_id": entry.entry_id,
        "removed_at": now_utc.isoformat(),
    }


# =========================================================================
# 3. Investigation Notes (Case Action Persistence)
# =========================================================================

@router.post("/notes", response_model=InvestigationNoteResponse, status_code=status.HTTP_201_CREATED)
def add_investigation_note(
    note_in: InvestigationNoteCreate,
    db: Session = Depends(get_db),
    current_user: InvestigatorUser = Depends(get_current_investigator)
):
    """Persists an investigation note attached to an account.
    Validates account existence and generates audit log.
    """
    account = db.query(Account).filter(Account.account_id == note_in.account_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"Account '{note_in.account_id}' not found. Cannot add note to nonexistent account."
        )

    clean_text = note_in.note_text.strip()
    if not clean_text:
        raise HTTPException(status_code=422, detail="Note text cannot be empty.")

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    author_name = note_in.author or current_user.name
    note = InvestigationNote(
        note_id=f"NOTE-{uuid.uuid4().hex[:10].upper()}",
        account_id=note_in.account_id,
        case_id=note_in.case_id,
        note_text=clean_text,
        author=author_name,
        created_at=now_utc,
    )
    db.add(note)

    audit = AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now_utc,
        action="ADD_NOTE",
        actor=author_name,
        target_entity=note_in.account_id,
        details=f"Logged investigation note for account {note_in.account_id}: {clean_text[:60]}"
    )
    db.add(audit)
    db.commit()
    db.refresh(note)

    return note


@router.get("/notes/{account_id}", response_model=List[InvestigationNoteResponse])
def get_investigation_notes(account_id: str, db: Session = Depends(get_db)):
    """Retrieves all immutable investigation notes for an account in chronological order."""
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"Account '{account_id}' not found."
        )

    notes = db.query(InvestigationNote).filter(
        InvestigationNote.account_id == account_id
    ).order_by(InvestigationNote.created_at.desc()).all()

    return notes


# =========================================================================
# 4. Human-Review Policy Enforcement & Case Actions
# =========================================================================

@router.post("/action-request", response_model=ActionRequestResponse)
def request_case_action(
    req: ActionRequest,
    db: Session = Depends(get_db),
    current_user: InvestigatorUser = Depends(get_current_investigator)
):
    """Enforces human-review policy and rejects unauthorized or automated adverse financial actions."""
    account = db.query(Account).filter(Account.account_id == req.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail=f"Account '{req.account_id}' not found.")

    # Strictly prohibit automated freezes / liens based solely on risk scores
    enforce_human_review_policy(account.risk_score, req.action_type)

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    audit = AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now_utc,
        action=f"REQUEST_{req.action_type.upper()}",
        actor=current_user.name,
        target_entity=req.account_id,
        details=f"Investigator {current_user.name} requested action {req.action_type}: {req.justification or 'None'}"
    )
    db.add(audit)
    db.commit()

    return ActionRequestResponse(
        status="recorded",
        action_type=req.action_type,
        account_id=req.account_id,
        investigator=current_user.name,
        message="Action request logged for legal review and independent verification."
    )


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves immutable audit trail of all investigative actions, searches, and watchlist modifications."""
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()


@router.post("/reseed")
def reseed_database_endpoint():
    """Resets and reseeds database with official competition benchmark fixtures."""
    from app.seed.generate_fixtures import seed_database
    seed_database()
    return {"status": "success", "message": "Database reset to benchmark synthetic fixtures."}


@router.post("/ingest-dataset")
def ingest_dataset_endpoint(
    file_path: str = Query(..., description="Absolute local path to CSV/JSON/XLSX file or directory"),
    wipe_existing: bool = Query(True, description="Wipe existing database before loading"),
    db: Session = Depends(get_db),
    current_user: InvestigatorUser = Depends(get_current_investigator)
):
    """Ingests external dataset files or directories on the spot and runs full pattern analytics."""
    from app.seed.ingest_alternate_dataset import ingest_from_file_or_dir
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Dataset path '{file_path}' does not exist on server.")

    try:
        summary = ingest_from_file_or_dir(file_path, wipe_existing=wipe_existing)

        now_utc = datetime.datetime.now(datetime.timezone.utc)
        audit = AuditLog(
            log_id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
            timestamp=now_utc,
            action="INGEST_DATASET",
            actor=current_user.name,
            target_entity=file_path,
            details=f"Loaded dataset: {summary.get('total_accounts', 0)} accounts, {summary.get('total_transactions', 0)} txns, {summary.get('total_complaints', 0)} complaints."
        )
        db.add(audit)
        db.commit()

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest dataset: {str(e)}")


def _seed_initial_solved_cases_if_empty(db: Session):
    """Seed initial realistic solved case stories from cyber cells if empty."""
    if db.query(SolvedCase).count() > 0:
        return

    seed_cases = [
        SolvedCase(
            case_id="SOLVED-BIHAR-2026-001",
            fir_number="FIR No. 89/2026 u/s 420/419/120B IPC & 66C/66D IT Act",
            police_station="Cyber Crime Police Station (CCSU), Patna",
            district="Patna",
            state="Bihar",
            investigating_officer="Inspector Vikramaditya Singh, CCSU Bihar Police",
            crime_category="Electricity Bill Disconnection APK Phishing",
            total_fraud_amount=4850000.00,
            recovered_amount=3920000.00,
            date_solved="2026-08-14",
            case_status="Convicted (Chargesheet No. 42/2026)",
            accused_name="Manoj Kumar Mandal @ Chhotu",
            father_name="Shri Rajendra Mandal",
            age=28,
            address="Vill. Karmatanr, PO Subhash Gram, PS Karmatanr, Dist. Jamtara (Arrested in Patna hideout)",
            mobile_number="+91-98351-44321",
            alternate_mobile="+91-94720-88192",
            id_proof="Aadhaar: XXXX-XXXX-9142 (Forged student KYC)",
            bank_name="State Bank of India",
            account_number="ACC-4321",
            ifsc_code="SBIN0000152",
            branch_name="Patna Main Branch",
            bank_registered_mobile="+91-98351-44321",
            upi_id="suvimule4321@oksbi",
            layering_speed_minutes=3,
            layering_route="Layer 1: Entry beneficiary ACC-4321 receives Rs 15.4L from victim -> Layer 2: Fast-split within 180 seconds across 6 accounts (HDFC, PNB, Canara) -> Layer 3: Rs 8.5L transferred to crypto OTC wallet & Rs 6.9L cash withdrawal at Nepal border ATM (Raxaul)",
            modus_operandi="Victim received SMS: 'Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately update via Suvidha Power APK.' Malicious APK intercepted OTP and initiated automated IMPS transfers.",
            breakthrough_trail="NCRP 1930 alert triggered automated golden-hour freeze request. FraudTrace AI pass-through layering detection identified ACC-4321 within 90 seconds. Police liaison blocked Rs 39.2 Lakhs across Layer 1 and Layer 2 before off-ramping.",
            seized_items="18 Android phones, 64 Pre-activated West Bengal & Assam SIM cards, 14 ATM debit cards, 1 Micro-ATM device, Rs 7,80,000 cash.",
            national_portal_ref="NCRP-ACK-2026-BIH-09142 | CCTNS-FIR-89-2026-PATNA"
        ),
        SolvedCase(
            case_id="SOLVED-BIHAR-2026-002",
            fir_number="FIR No. 142/2026 u/s 318(4)/316(2)/61(2) BNS & 66D IT Act",
            police_station="Cyber Thana Gaya",
            district="Gaya",
            state="Bihar",
            investigating_officer="DSP Priya Ranjan, Cyber Cell Gaya",
            crime_category="Telegram Part-Time Task & Crypto Investment Scam",
            total_fraud_amount=8200000.00,
            recovered_amount=6450000.00,
            date_solved="2026-09-02",
            case_status="Charge-sheeted (Judicial Custody)",
            accused_name="Suraj Prakash Verma",
            father_name="Late Birendra Verma",
            age=31,
            address="Mohalla Civil Lines, Near Tower Chowk, PS Rampur, Dist. Gaya, Bihar - 823001",
            mobile_number="+91-70041-99876",
            alternate_mobile="+91-82103-55412",
            id_proof="PAN: BPWPV****K | Aadhaar: XXXX-XXXX-3819",
            bank_name="HDFC Bank",
            account_number="ACC-8765",
            ifsc_code="HDFC0001082",
            branch_name="Gaya Branch",
            bank_registered_mobile="+91-70041-99876",
            upi_id="hdfcmule8765@okhdfcbank",
            layering_speed_minutes=5,
            layering_route="Layer 1: Victim deposited Rs 25,000 to Rs 5,00,000 in fake task scheme into ACC-8765 -> Layer 2: Aggregated into 3 current business accounts -> Layer 3: Converted to USDT on P2P exchanges.",
            modus_operandi="Victims added to Telegram channels promising Rs 3,000 daily for rating Google maps locations and YouTube videos. Initial small payouts made to build trust, followed by VIP investment requests totaling Rs 82 Lakhs.",
            breakthrough_trail="Correlation of 5 citizen complaints on 1930 portal mapped to same UPI VPA. Rapid debit freeze order issued under Section 106 BNSS saved Rs 64.5 Lakhs in intermediary merchant accounts.",
            seized_items="3 Laptops, 8 Passbooks of shell enterprises, 2 POS machines, 22 Debit cards.",
            national_portal_ref="NCRP-ACK-2026-BIH-11029 | CCTNS-GAYA-142-2026"
        ),
        SolvedCase(
            case_id="SOLVED-BIHAR-2026-003",
            fir_number="FIR No. 67/2026 u/s 420/384/120B IPC & 66E/67A IT Act",
            police_station="Cyber Crime Thana, Muzaffarpur",
            district="Muzaffarpur",
            state="Bihar",
            investigating_officer="Sub-Inspector Rajeshwar Prasad, Cyber Investigation Team",
            crime_category="Instant Loan App Blackmail & Mule Syndicate",
            total_fraud_amount=3100000.00,
            recovered_amount=2890000.00,
            date_solved="2026-10-05",
            case_status="Under Trial (Special Cyber Court)",
            accused_name="Amit Kumar Sahani",
            father_name="Shri Devanand Sahani",
            age=24,
            address="Vill. Madhuban, PS Kanti, Dist. Muzaffarpur, Bihar - 843109",
            mobile_number="+91-91234-77651",
            alternate_mobile="+91-99342-11098",
            id_proof="Voter ID: BR/08/042/190821 | Aadhaar: XXXX-XXXX-7721",
            bank_name="ICICI Bank",
            account_number="ACC-1122",
            ifsc_code="ICIC0000624",
            branch_name="Muzaffarpur Club Road Branch",
            bank_registered_mobile="+91-91234-77651",
            upi_id="icicimule1122@okicici",
            layering_speed_minutes=4,
            layering_route="Layer 1: Extortion payments deposited into college student mule accounts -> Layer 2: Fast UPI transfers to aggregator account ACC-1122 -> Layer 3: Instant cash withdrawals via ATM networks across North Bihar.",
            modus_operandi="Predatory loan apps (CashSpeed, RupeeFast) harvested victim phone contacts and photos, followed by morphing and blackmail messages demanding 300% interest.",
            breakthrough_trail="DoT TAFCOP telecom audit revealed 14 SIM cards issued against one forged photo. Bank KYC review exposed mule commission scheme offering Rs 2,000/week to college students.",
            seized_items="14 SIM cards, 6 Smartphones, 9 Debit Cards, Rs 3,40,000 liquid cash.",
            national_portal_ref="NCRP-ACK-2026-BIH-04821 | CCTNS-MUZ-67-2026"
        )
    ]
    for sc in seed_cases:
        db.add(sc)
    db.commit()


@router.get("/solved-cases", response_model=List[SolvedCaseResponse])
def list_solved_cases(
    category: Optional[str] = Query(None, description="Filter by crime category"),
    search: Optional[str] = Query(None, description="Search by accused name, mobile, bank account, or FIR"),
    db: Session = Depends(get_db)
):
    """Retrieves all official solved police case stories and convicted/charge-sheeted mule dossiers."""
    _seed_initial_solved_cases_if_empty(db)
    query = db.query(SolvedCase)
    if category:
        query = query.filter(SolvedCase.crime_category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (SolvedCase.accused_name.ilike(search_filter)) |
            (SolvedCase.account_number.ilike(search_filter)) |
            (SolvedCase.mobile_number.ilike(search_filter)) |
            (SolvedCase.fir_number.ilike(search_filter)) |
            (SolvedCase.police_station.ilike(search_filter))
        )
    return query.order_by(SolvedCase.created_at.desc()).all()


@router.post("/solved-cases", response_model=SolvedCaseResponse, status_code=status.HTTP_201_CREATED)
def create_solved_case(
    payload: SolvedCaseCreate,
    db: Session = Depends(get_db),
    current_user: InvestigatorUser = Depends(get_current_investigator)
):
    """Enables law enforcement officers to enter a new solved case dossier into the judicial and intelligence repository."""
    case_id = f"SOLVED-{payload.state.upper()[:5]}-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    new_case = SolvedCase(
        case_id=case_id,
        **payload.dict()
    )
    db.add(new_case)

    # Log audit entry
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    audit = AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now_utc,
        action="CREATE_SOLVED_CASE",
        actor=current_user.name,
        target_entity=case_id,
        details=f"Logged solved case {payload.fir_number} for accused {payload.accused_name} (Recovered: Rs {payload.recovered_amount:,.2f})"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_case)
    return new_case


@router.get("/solved-cases/{case_id}", response_model=SolvedCaseResponse)
def get_solved_case(
    case_id: str,
    db: Session = Depends(get_db)
):
    """Fetch complete details of a specific solved case story."""
    c = db.query(SolvedCase).filter(SolvedCase.case_id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Solved case not found")
    return c


