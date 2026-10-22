"""FraudTrace AI — Modular Financial Crime & Mule Detectors
Adhering to Cyber Hackathon 2026 Problem Statement PS-01.
Each detector performs pure mathematical / graph analysis on database records
and returns points awarded, summary explanation, and exact evidence rows.
"""

from typing import Dict, Any, List, Optional
import datetime
from sqlalchemy.orm import Session
from app.models.account import Account, AccountCategory
from app.models.transaction import Transaction, PatternTag
from app.models.complaint import ComplaintAccountLink, CybercrimeComplaint

# =============================================================================
# 1. Rapid Inflow-to-Outflow Pass-through Detector
# =============================================================================

def detect_rapid_passthrough(
    account_id: str,
    in_txns: List[Transaction],
    out_txns: List[Transaction],
    max_delta_minutes: float = 15.0,
    max_points: int = 20
) -> Dict[str, Any]:
    """Detects rapid outflows occurring within minutes of an incoming credit."""
    rapid_pairs = []
    evidence_rows = []

    for in_t in in_txns:
        for out_t in out_txns:
            delta_sec = (out_t.timestamp - in_t.timestamp).total_seconds()
            delta_min = delta_sec / 60.0
            if 0.0 <= delta_min <= max_delta_minutes and out_t.amount >= (0.70 * in_t.amount):
                rapid_pairs.append((in_t, out_t, delta_min))
                evidence_rows.append({
                    "credit_txn_id": in_t.transaction_id,
                    "credit_amount": in_t.amount,
                    "credit_time": in_t.timestamp.isoformat(),
                    "debit_txn_id": out_t.transaction_id,
                    "debit_amount": out_t.amount,
                    "debit_time": out_t.timestamp.isoformat(),
                    "delta_minutes": round(delta_min, 1),
                    "disbursed_percentage": round((out_t.amount / in_t.amount) * 100, 1),
                })

    rapid_tagged = [t for t in out_txns if t.pattern_tag == PatternTag.RAPID_TRANSFER.value]

    if len(rapid_pairs) >= 2 or len(rapid_tagged) >= 2:
        points = max_points
        summary = f"High-velocity dispersal: {len(rapid_pairs) or len(rapid_tagged)} rapid outflow(s) within {max_delta_minutes:.0f} mins of credit"
    elif len(rapid_pairs) == 1 or len(rapid_tagged) == 1:
        points = int(max_points * 0.6)
        summary = f"Moderate velocity: 1 rapid outflow within {max_delta_minutes:.0f} mins of credit"
    elif len(out_txns) >= 5:
        points = int(max_points * 0.3)
        summary = f"Frequent transactional activity: {len(out_txns)} debits"
    else:
        points = 0
        summary = "Normal transfer velocity between credits and debits"

    evidence_refs = [r["debit_txn_id"] for r in evidence_rows[:3]]
    if not evidence_refs and rapid_tagged:
        evidence_refs = [t.transaction_id for t in rapid_tagged[:3]]

    return {
        "detected": points > 0,
        "indicator_id": "IND-01",
        "name": "Rapid fund transfers",
        "points_awarded": points,
        "max_points": max_points,
        "summary": summary,
        "evidence_references": evidence_refs if evidence_refs else ["VELOCITY_NORMAL"],
        "evidence_rows": evidence_rows,
    }


# =============================================================================
# 2. High Pass-Through Ratio & Zero Balance Retention Detector
# =============================================================================

def detect_passthrough_ratio(
    account_id: str,
    in_txns: List[Transaction],
    out_txns: List[Transaction],
    max_points: int = 20
) -> Dict[str, Any]:
    """Evaluates the percentage of incoming credits immediately forwarded onwards."""
    in_sum = sum(t.amount for t in in_txns)
    out_sum = sum(t.amount for t in out_txns)
    ratio = (out_sum / in_sum) if in_sum > 0 else 0.0

    evidence_rows = [{
        "total_credits_in": in_sum,
        "total_debits_out": out_sum,
        "pass_through_ratio": round(ratio * 100, 1),
        "retained_balance": round(max(0.0, in_sum - out_sum), 2),
    }]

    if in_sum > 10000 and ratio >= 0.85:
        points = max_points
        summary = f"Extreme pass-through: {min(100.0, ratio*100):.1f}% of credits forwarded, minimal retention"
    elif in_sum > 5000 and ratio >= 0.70:
        points = int(max_points * 0.6)
        summary = f"Elevated pass-through: {min(100.0, ratio*100):.1f}% of funds dispatched"
    elif ratio > 0.4:
        points = int(max_points * 0.3)
        summary = "Moderate turnover balance"
    else:
        points = 0
        summary = "Standard account balance retention"

    evidence_refs = [f"IN_₹{in_sum:,.0f}", f"OUT_₹{out_sum:,.0f}"] if in_sum > 0 else ["STANDARD_RETENTION"]

    return {
        "detected": points > 0,
        "indicator_id": "IND-02",
        "name": "Pass-through layering ratio",
        "points_awarded": points,
        "max_points": max_points,
        "summary": summary,
        "evidence_references": evidence_refs,
        "evidence_rows": evidence_rows,
    }


# =============================================================================
# 3. Fan-In (Aggregation) & Fan-Out (Dispersal) Detector
# =============================================================================

def detect_fan_in_fan_out(
    account_id: str,
    in_txns: List[Transaction],
    out_txns: List[Transaction],
    max_points: int = 15
) -> Dict[str, Any]:
    """Detects Fan-In (many distinct senders -> 1 receiver) and Fan-Out (1 sender -> many receivers)."""
    senders = set(t.sender_account_id for t in in_txns)
    receivers = set(t.receiver_account_id for t in out_txns)

    in_count = len(senders)
    out_count = len(receivers)

    evidence_rows = []
    # Collect fan-in details
    for t in in_txns:
        evidence_rows.append({
            "flow": "FAN_IN",
            "txn_id": t.transaction_id,
            "counterparty": t.sender_account_id,
            "amount": t.amount,
            "timestamp": t.timestamp.isoformat(),
        })
    # Collect fan-out details
    for t in out_txns:
        evidence_rows.append({
            "flow": "FAN_OUT",
            "txn_id": t.transaction_id,
            "counterparty": t.receiver_account_id,
            "amount": t.amount,
            "timestamp": t.timestamp.isoformat(),
        })

    is_fan_in = in_count >= 3
    is_fan_out = out_count >= 3

    if is_fan_in and is_fan_out:
        points = max_points
        summary = f"Syndicate Aggregator & Splitter: Fan-in from {in_count} senders and Fan-out to {out_count} accounts"
    elif is_fan_in:
        points = int(max_points * 0.75)
        summary = f"Fan-in Aggregation: Funds pooled from {in_count} distinct counterparty accounts"
    elif is_fan_out:
        points = int(max_points * 0.75)
        summary = f"Fan-out Dispersal: Funds split into {out_count} distinct downstream accounts"
    else:
        points = 0
        summary = "Standard bilateral transaction counts"

    evidence_refs = [f"SENDERS_{in_count}", f"RECEIVERS_{out_count}"]

    return {
        "detected": points > 0,
        "indicator_id": "IND-FAN",
        "name": "Fan-in / Fan-out flow pattern",
        "points_awarded": points,
        "max_points": max_points,
        "summary": summary,
        "evidence_references": evidence_refs,
        "evidence_rows": evidence_rows[:10],
    }


# =============================================================================
# 4. Circular Flow Loop Detector (A -> B -> C -> A)
# =============================================================================

def detect_circular_flows(
    account_id: str,
    db: Session,
    max_hops: int = 4,
    max_points: int = 15
) -> Dict[str, Any]:
    """Detects cycles where money flows out of account_id and returns to it or related node."""
    out_txns = db.query(Transaction).filter(Transaction.sender_account_id == account_id).all()
    
    cycles = []
    evidence_rows = []

    # Simple DFS to detect directed cycles up to max_hops
    for first_txn in out_txns:
        path = [account_id, first_txn.receiver_account_id]
        txns_path = [first_txn]
        
        stack = [(first_txn.receiver_account_id, path, txns_path)]
        while stack:
            curr, p, tp = stack.pop()
            if len(p) > max_hops + 1:
                continue
            next_txns = db.query(Transaction).filter(Transaction.sender_account_id == curr).all()
            for n_txn in next_txns:
                nxt = n_txn.receiver_account_id
                if nxt == account_id:
                    cycle_nodes = p + [account_id]
                    cycle_txns = tp + [n_txn]
                    cycles.append((cycle_nodes, cycle_txns))
                    evidence_rows.append({
                        "cycle_path": " → ".join(cycle_nodes),
                        "hop_count": len(cycle_nodes) - 1,
                        "transactions": [t.transaction_id for t in cycle_txns],
                        "amounts": [t.amount for t in cycle_txns],
                    })
                    break
                elif nxt not in p and len(p) < max_hops:
                    stack.append((nxt, p + [nxt], tp + [n_txn]))

    if cycles:
        points = max_points
        summary = f"Circular flow cycle detected: {len(cycles)} route(s) looping back to origin ({evidence_rows[0]['cycle_path']})"
        evidence_refs = [f"CYCLE_{len(cycles)}", evidence_rows[0]["cycle_path"]]
    else:
        points = 0
        summary = "No circular return loops detected"
        evidence_refs = ["NO_CIRCULAR_FLOW"]

    return {
        "detected": points > 0,
        "indicator_id": "IND-CYCLE",
        "name": "Circular flow cycle detection",
        "points_awarded": points,
        "max_points": max_points,
        "summary": summary,
        "evidence_references": evidence_refs,
        "evidence_rows": evidence_rows,
    }


# =============================================================================
# 5. Shared Device / IP / Phone Ring Detector
# =============================================================================

def detect_shared_identifiers(
    account: Account,
    db: Session,
    max_points: int = 15
) -> Dict[str, Any]:
    """Identifies syndicate clustering via shared hardware fingerprint, IP address, or mobile."""
    if not account:
        return {
            "detected": False,
            "indicator_id": "IND-DEVICE",
            "name": "Shared device / IP identifier link",
            "points_awarded": 0,
            "max_points": max_points,
            "summary": "No account record.",
            "evidence_references": ["NO_DATA"],
            "evidence_rows": [],
        }

    shared_accounts = []
    evidence_rows = []

    # 1. Shared Device ID
    if account.device_id:
        dev_matches = db.query(Account).filter(
            Account.device_id == account.device_id,
            Account.account_id != account.account_id
        ).all()
        for m in dev_matches:
            evidence_rows.append({
                "match_type": "DEVICE_ID",
                "identifier": account.device_id,
                "linked_account_id": m.account_id,
                "linked_account_masked": m.account_number_masked,
                "linked_bank": m.bank_name,
                "linked_holder": m.account_holder_name,
            })
            shared_accounts.append(m.account_id)

    # 2. Shared IP Address
    if account.ip_address:
        ip_matches = db.query(Account).filter(
            Account.ip_address == account.ip_address,
            Account.account_id != account.account_id
        ).all()
        for m in ip_matches:
            if m.account_id not in shared_accounts:
                evidence_rows.append({
                    "match_type": "IP_ADDRESS",
                    "identifier": account.ip_address,
                    "linked_account_id": m.account_id,
                    "linked_account_masked": m.account_number_masked,
                    "linked_bank": m.bank_name,
                    "linked_holder": m.account_holder_name,
                })
                shared_accounts.append(m.account_id)

    # 3. Shared Mobile Number
    if account.registered_mobile_masked:
        mobile_matches = db.query(Account).filter(
            Account.registered_mobile_masked == account.registered_mobile_masked,
            Account.account_id != account.account_id
        ).all()
        for m in mobile_matches:
            if m.account_id not in shared_accounts:
                evidence_rows.append({
                    "match_type": "MOBILE_NUMBER",
                    "identifier": account.registered_mobile_masked,
                    "linked_account_id": m.account_id,
                    "linked_account_masked": m.account_number_masked,
                    "linked_bank": m.bank_name,
                    "linked_holder": m.account_holder_name,
                })
                shared_accounts.append(m.account_id)

    unique_linked = list(set(shared_accounts))
    if len(unique_linked) >= 2:
        points = max_points
        summary = f"Syndicate device ring: Linked to {len(unique_linked)} accounts via shared device/IP fingerprint"
    elif len(unique_linked) == 1:
        points = int(max_points * 0.6)
        summary = f"Identifier collision: Shares device/network footprint with {unique_linked[0]}"
    else:
        points = 0
        summary = "No shared device, IP, or phone collisions detected"

    evidence_refs = unique_linked if unique_linked else ["UNIQUE_IDENTIFIERS"]

    return {
        "detected": points > 0,
        "indicator_id": "IND-DEVICE",
        "name": "Shared device / IP identifier link",
        "points_awarded": points,
        "max_points": max_points,
        "summary": summary,
        "evidence_references": evidence_refs,
        "evidence_rows": evidence_rows,
    }


# =============================================================================
# 6. Profile Mismatch & Velocity Anomaly Detector
# =============================================================================

def detect_profile_mismatch(
    account: Account,
    in_txns: List[Transaction],
    out_txns: List[Transaction],
    max_points: int = 15
) -> Dict[str, Any]:
    """Detects discrepancies between account profile (Student/Pensioner/Basic) and large turnover."""
    if not account:
        return {
            "detected": False,
            "indicator_id": "IND-06",
            "name": "Profile mismatch and velocity anomaly",
            "points_awarded": 0,
            "max_points": max_points,
            "summary": "No account record.",
            "evidence_references": ["NO_DATA"],
            "evidence_rows": [],
        }

    now = datetime.datetime.now(datetime.timezone.utc)
    opened = account.opened_date.replace(tzinfo=datetime.timezone.utc) if account.opened_date else now
    account_age_days = (now - opened).days

    turnover = sum(t.amount for t in in_txns) + sum(t.amount for t in out_txns)
    is_student_or_basic = account.account_category in [AccountCategory.STUDENT.value, "BASIC_SAVINGS", "PMJDY"]

    evidence_rows = [{
        "account_category": account.account_category,
        "account_age_days": account_age_days,
        "total_turnover": turnover,
        "transaction_count": len(in_txns) + len(out_txns),
    }]

    if is_student_or_basic and turnover >= 100000:
        points = max_points
        summary = f"Severe profile mismatch: Student/Basic profile with ₹{turnover:,.0f} turnover"
    elif account_age_days <= 180 and turnover >= 100000:
        points = max_points
        summary = f"New account velocity anomaly: ₹{turnover:,.0f} turnover in {account_age_days} days"
    elif turnover >= 200000:
        points = int(max_points * 0.7)
        summary = f"Elevated turnover spike (₹{turnover:,.0f})"
    elif len(in_txns) + len(out_txns) >= 8:
        points = int(max_points * 0.4)
        summary = f"Active transaction velocity ({len(in_txns) + len(out_txns)} records)"
    else:
        points = 0
        summary = "Transactional volume aligns with customer profile baseline"

    evidence_refs = [f"CAT_{account.account_category}", f"TURNOVER_₹{turnover:,.0f}"]

    return {
        "detected": points > 0,
        "indicator_id": "IND-06",
        "name": "Profile mismatch and velocity anomaly",
        "points_awarded": points,
        "max_points": max_points,
        "summary": summary,
        "evidence_references": evidence_refs,
        "evidence_rows": evidence_rows,
    }


# =============================================================================
# 7. Cybercrime Complaints Correlation Detector
# =============================================================================

def detect_complaint_correlation(
    account_id: str,
    db: Session,
    max_points: int = 15
) -> Dict[str, Any]:
    """Correlates account with registered National Cybercrime Reporting Portal (NCRP) complaints."""
    complaint_links = db.query(ComplaintAccountLink).filter(ComplaintAccountLink.account_id == account_id).all()
    c_ids = set([cl.complaint_id for cl in complaint_links])

    direct_complaints = db.query(CybercrimeComplaint).filter(CybercrimeComplaint.suspect_account_id == account_id).all()
    for dc in direct_complaints:
        c_ids.add(dc.complaint_id)

    evidence_rows = []
    if c_ids:
        all_cmps = db.query(CybercrimeComplaint).filter(CybercrimeComplaint.complaint_id.in_(c_ids)).all()
        for c in all_cmps:
            evidence_rows.append({
                "complaint_id": c.complaint_id,
                "incident_date": c.incident_date.isoformat(),
                "complaint_type": c.complaint_type,
                "reported_loss": c.reported_loss_amount,
                "status": c.status,
            })

    c_count = len(c_ids)
    if c_count >= 3:
        points = max_points
        summary = f"Directly correlated with {c_count} independent cybercrime incident reports"
    elif c_count == 2:
        points = int(max_points * 0.75)
        summary = f"Correlated with {c_count} registered cybercrime incident reports"
    elif c_count == 1:
        points = int(max_points * 0.45)
        summary = "Linked to 1 registered cybercrime incident report"
    else:
        points = 0
        summary = "No registered cybercrime complaints against this account"

    evidence_refs = list(c_ids) if c_ids else ["NO_COMPLAINTS"]

    return {
        "detected": points > 0,
        "indicator_id": "IND-04",
        "name": "Linked cybercrime complaints",
        "points_awarded": points,
        "max_points": max_points,
        "summary": summary,
        "evidence_references": evidence_refs,
        "evidence_rows": evidence_rows,
    }
