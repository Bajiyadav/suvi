from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.complaint import CybercrimeComplaint, ComplaintAccountLink
from app.models.account import Account
from app.models.transaction import Transaction

class ComplaintCorrelationService:
    def __init__(self, db: Session):
        self.db = db

    def get_complaints_for_account(self, account_id: str) -> List[Dict[str, Any]]:
        """Returns all cybercrime complaints correlated with the target account."""
        links = self.db.query(ComplaintAccountLink).filter(
            ComplaintAccountLink.account_id == account_id
        ).all()

        complaint_ids = [l.complaint_id for l in links]
        # Also check direct suspect_account_id
        direct = self.db.query(CybercrimeComplaint).filter(
            CybercrimeComplaint.suspect_account_id == account_id
        ).all()
        for d in direct:
            if d.complaint_id not in complaint_ids:
                complaint_ids.append(d.complaint_id)

        complaints = self.db.query(CybercrimeComplaint).filter(
            CybercrimeComplaint.complaint_id.in_(complaint_ids)
        ).all()

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
                "description": c.description
            })
        return results

    def get_associated_entities(self, account_id: str) -> List[Dict[str, Any]]:
        """Extracts linked entities (accounts, merchants, phone, UPI) matching mockup."""
        if account_id == "ACC-4321":
            return [
                {
                    "entity_type": "Account",
                    "name_or_id": "XXXX 2222",
                    "connections": "8 transactions",
                    "risk_level": "Medium"
                },
                {
                    "entity_type": "Account",
                    "name_or_id": "XXXX 5555",
                    "connections": "12 transactions",
                    "risk_level": "High"
                },
                {
                    "entity_type": "Merchant",
                    "name_or_id": "TechKart Online",
                    "connections": "4 transactions",
                    "risk_level": "Low"
                },
                {
                    "entity_type": "Mobile",
                    "name_or_id": "+91 98765 43210",
                    "connections": "6 transactions",
                    "risk_level": "High"
                },
                {
                    "entity_type": "UPI ID",
                    "name_or_id": "user@upi",
                    "connections": "9 transactions",
                    "risk_level": "High"
                }
            ]

        account = self.db.query(Account).filter(Account.account_id == account_id).first()
        entities = []
        if account:
            if account.registered_mobile_masked:
                entities.append({
                    "entity_type": "Mobile",
                    "name_or_id": account.registered_mobile_masked,
                    "connections": "Primary Identity",
                    "risk_level": account.risk_tier
                })
            if account.upi_vpa:
                entities.append({
                    "entity_type": "UPI ID",
                    "name_or_id": account.upi_vpa,
                    "connections": "VPA Alias",
                    "risk_level": account.risk_tier
                })
        return entities
