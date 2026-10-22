from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.complaint import CybercrimeComplaint, ComplaintAccountLink
from app.models.account import Account
from app.models.transaction import Transaction

class ComplaintCorrelationService:
    def __init__(self, db: Session):
        self.db = db

    def get_complaints_for_account(self, account_id: str) -> List[Dict[str, Any]]:
        """Returns all cybercrime complaints correlated with the target account with explainable reasons."""
        account = self.db.query(Account).filter(Account.account_id == account_id).first()
        if not account:
            return []

        # 1. Stored explicit relationships from ComplaintAccountLink
        links = self.db.query(ComplaintAccountLink).filter(
            ComplaintAccountLink.account_id == account_id
        ).all()
        link_map = {l.complaint_id: l for l in links}
        complaint_ids = set(link_map.keys())

        # 2. Direct suspect or victim assignment in CybercrimeComplaint
        direct_complaints = self.db.query(CybercrimeComplaint).filter(
            (CybercrimeComplaint.suspect_account_id == account_id) |
            (CybercrimeComplaint.victim_account_id == account_id)
        ).all()
        for dc in direct_complaints:
            complaint_ids.add(dc.complaint_id)

        # 3. Documented correlation by shared identifiers (UPI VPA or registered phone)
        if account.upi_vpa:
            vpa_complaints = self.db.query(CybercrimeComplaint).filter(
                CybercrimeComplaint.suspect_upi_vpa == account.upi_vpa
            ).all()
            for vc in vpa_complaints:
                complaint_ids.add(vc.complaint_id)

        if account.registered_mobile_masked:
            mobile_complaints = self.db.query(CybercrimeComplaint).filter(
                CybercrimeComplaint.suspect_mobile == account.registered_mobile_masked
            ).all()
            for mc in mobile_complaints:
                complaint_ids.add(mc.complaint_id)

        if not complaint_ids:
            return []

        complaints = self.db.query(CybercrimeComplaint).filter(
            CybercrimeComplaint.complaint_id.in_(list(complaint_ids))
        ).order_by(CybercrimeComplaint.incident_date.desc()).all()

        results = []
        for c in complaints:
            linked_count = self.db.query(ComplaintAccountLink).filter(
                ComplaintAccountLink.complaint_id == c.complaint_id
            ).count()

            # Formulate explainable reason and supporting evidence IDs
            if c.complaint_id in link_map:
                reason = link_map[c.complaint_id].link_reason
                evidence = [link_map[c.complaint_id].id, c.complaint_id]
            elif c.suspect_account_id == account_id:
                reason = "Direct suspect account identified in official cybercrime incident report"
                evidence = [c.complaint_id, f"SUSPECT_ACC_{account_id}"]
            elif c.victim_account_id == account_id:
                reason = "Complainant / victim account reporting fund loss to fraud syndicate"
                evidence = [c.complaint_id, f"VICTIM_ACC_{account_id}"]
            elif account.upi_vpa and c.suspect_upi_vpa == account.upi_vpa:
                reason = f"Correlated via matching suspect UPI VPA alias: {account.upi_vpa}"
                evidence = [c.complaint_id, f"UPI_{account.upi_vpa}"]
            elif account.registered_mobile_masked and c.suspect_mobile == account.registered_mobile_masked:
                reason = f"Correlated via matching suspect mobile number: {account.registered_mobile_masked}"
                evidence = [c.complaint_id, f"MOBILE_{account.registered_mobile_masked}"]
            else:
                reason = "Syndicate money-trail counterparty linkage"
                evidence = [c.complaint_id]

            results.append({
                "complaint_id": c.complaint_id,
                "incident_date": c.incident_date,
                "complaint_type": c.complaint_type,
                "reported_loss_amount": c.reported_loss_amount,
                "reported_loss_formatted": f"₹{c.reported_loss_amount:,.0f}",
                "victim_account_id": c.victim_account_id,
                "suspect_account_id": c.suspect_account_id,
                "status": c.status,
                "police_station_jurisdiction": c.police_station_jurisdiction,
                "linked_accounts_count": max(1, linked_count),
                "description": c.description,
                "link_reason": reason,
                "supporting_evidence": evidence
            })
        return results

    def get_associated_entities(self, account_id: str) -> List[Dict[str, Any]]:
        """Dynamically extracts linked entities (counterparty accounts, merchants, phone, UPI) from DB."""
        account = self.db.query(Account).filter(Account.account_id == account_id).first()
        if not account:
            return []

        entities: List[Dict[str, Any]] = []

        # 1. Query real counterparty transactions (both incoming and outgoing)
        out_txns = self.db.query(Transaction).filter(Transaction.sender_account_id == account_id).all()
        in_txns = self.db.query(Transaction).filter(Transaction.receiver_account_id == account_id).all()

        counterparty_counts: Dict[str, int] = {}
        for t in out_txns:
            counterparty_counts[t.receiver_account_id] = counterparty_counts.get(t.receiver_account_id, 0) + 1
        for t in in_txns:
            counterparty_counts[t.sender_account_id] = counterparty_counts.get(t.sender_account_id, 0) + 1

        sorted_cps = sorted(counterparty_counts.items(), key=lambda x: x[1], reverse=True)
        merchants = []
        regular_accounts = []
        for cp_id, count in sorted_cps:
            cp_acc = self.db.query(Account).filter(Account.account_id == cp_id).first()
            if cp_acc and (cp_acc.account_type == "MERCHANT" or cp_acc.account_category == "BUSINESS" or "MERCHANT" in cp_id):
                merchants.append((cp_id, cp_acc, count))
            else:
                regular_accounts.append((cp_id, cp_acc, count))

        for cp_id, cp_acc, count in merchants[:2]:
            conn_text = f"{count} transaction{'s' if count > 1 else ''}"
            merchant_name = cp_acc.account_holder_name.split(" (")[0] if cp_acc else cp_id
            entities.append({
                "entity_type": "Merchant",
                "name_or_id": merchant_name,
                "connections": conn_text,
                "risk_level": "Low"
            })

        for cp_id, cp_acc, count in regular_accounts[:4]:
            conn_text = f"{count} transaction{'s' if count > 1 else ''}"
            if cp_acc:
                tier = "High" if cp_acc.risk_score >= 70 else ("Medium" if cp_acc.risk_score >= 50 else "Low")
                entities.append({
                    "entity_type": "Account",
                    "name_or_id": cp_acc.account_number_masked,
                    "connections": conn_text,
                    "risk_level": tier
                })
            else:
                entities.append({
                    "entity_type": "Account",
                    "name_or_id": f"XXXX {cp_id[-4:]}" if len(cp_id) >= 4 else cp_id,
                    "connections": conn_text,
                    "risk_level": "Medium"
                })

        # 2. Registered Mobile Identity
        if account.registered_mobile_masked:
            total_activity = len(out_txns) + len(in_txns)
            entities.append({
                "entity_type": "Mobile",
                "name_or_id": account.registered_mobile_masked,
                "connections": f"{total_activity} transactions" if total_activity > 0 else "Primary Identity",
                "risk_level": "High" if account.risk_score >= 70 else ("Medium" if account.risk_score >= 50 else "Low")
            })

        # 3. UPI ID Alias
        if account.upi_vpa:
            upi_count = len([t for t in (out_txns + in_txns) if t.channel == "UPI"])
            entities.append({
                "entity_type": "UPI ID",
                "name_or_id": account.upi_vpa,
                "connections": f"{upi_count} transactions" if upi_count > 0 else "VPA Alias",
                "risk_level": "High" if account.risk_score >= 70 else ("Medium" if account.risk_score >= 50 else "Low")
            })

        return entities

    def list_all_complaints(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns all registered cybercrime complaints up to limit with linked account counts."""
        complaints = self.db.query(CybercrimeComplaint).order_by(
            CybercrimeComplaint.incident_date.desc()
        ).limit(limit).all()

        results = []
        for c in complaints:
            linked_count = self.db.query(ComplaintAccountLink).filter(
                ComplaintAccountLink.complaint_id == c.complaint_id
            ).count()

            results.append({
                "complaint_id": c.complaint_id,
                "incident_date": c.incident_date,
                "complaint_type": c.complaint_type,
                "reported_loss_amount": c.reported_loss_amount,
                "reported_loss_formatted": f"₹{c.reported_loss_amount:,.0f}",
                "victim_account_id": c.victim_account_id,
                "suspect_account_id": c.suspect_account_id,
                "status": c.status,
                "police_station_jurisdiction": c.police_station_jurisdiction,
                "linked_accounts_count": max(1, linked_count),
                "description": c.description,
                "link_reason": "Registered cyber incident record",
                "supporting_evidence": [c.complaint_id]
            })
        return results
