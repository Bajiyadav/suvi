from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, PatternTag
from app.models.account import Account

class TransactionAnalysisService:
    def __init__(self, db: Session):
        self.db = db

    def get_flow_analysis(self, account_id: str) -> Dict[str, Any]:
        """Calculates incoming, layering, and outflow totals dynamically from actual transaction records.
        Never overrides calculations with hardcoded account constants.
        """
        in_txns = self.db.query(Transaction).filter(
            Transaction.receiver_account_id == account_id
        ).all()
        out_txns = self.db.query(Transaction).filter(
            Transaction.sender_account_id == account_id
        ).all()

        incoming_total = float(sum(t.amount for t in in_txns))
        outflow_total = float(sum(t.amount for t in out_txns))

        # Layering transfers: outgoing transfers tagged with RAPID_TRANSFER or LAYERING
        layering_txns = [
            t for t in out_txns 
            if t.pattern_tag in [PatternTag.RAPID_TRANSFER.value, PatternTag.LAYERING.value]
        ]
        layering_total = float(sum(t.amount for t in layering_txns))

        retained = max(0.0, incoming_total - outflow_total)
        retained_pct = (retained / incoming_total * 100.0) if incoming_total > 0 else 0.0

        return {
            "account_id": account_id,
            "incoming_total": incoming_total,
            "incoming_total_formatted": f"₹{incoming_total:,.0f}",
            "incoming_count": len(in_txns),
            "layering_total": layering_total,
            "layering_total_formatted": f"₹{layering_total:,.0f}",
            "layering_count": len(layering_txns),
            "outflow_total": outflow_total,
            "outflow_total_formatted": f"₹{outflow_total:,.0f}",
            "outflow_count": len(out_txns),
            "retained_balance": retained,
            "retained_percentage": round(retained_pct, 1)
        }

    def detect_rapid_transfers(self, account_id: str, window_minutes: int = 15) -> List[Dict[str, Any]]:
        """Identifies incoming transactions quickly followed by outgoing transfers."""
        in_txns = self.db.query(Transaction).filter(
            Transaction.receiver_account_id == account_id
        ).order_by(Transaction.timestamp.asc()).all()

        out_txns = self.db.query(Transaction).filter(
            Transaction.sender_account_id == account_id
        ).order_by(Transaction.timestamp.asc()).all()

        rapid_pairs = []
        for in_t in in_txns:
            for out_t in out_txns:
                delta = (out_t.timestamp - in_t.timestamp).total_seconds() / 60.0
                if 0 <= delta <= window_minutes and out_t.amount >= (0.75 * in_t.amount):
                    rapid_pairs.append({
                        "incoming_txn_id": in_t.transaction_id,
                        "outgoing_txn_id": out_t.transaction_id,
                        "delta_minutes": round(delta, 1),
                        "in_amount": in_t.amount,
                        "out_amount": out_t.amount,
                        "sender": in_t.sender_account_id,
                        "receiver": out_t.receiver_account_id
                    })
        return rapid_pairs

    def get_timeline(self, account_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns unified chronological transaction timeline for the account from database records."""
        txns = self.db.query(Transaction).filter(
            (Transaction.sender_account_id == account_id) | (Transaction.receiver_account_id == account_id)
        ).order_by(Transaction.timestamp.asc()).limit(limit).all()

        timeline = []
        for t in txns:
            is_incoming = (t.receiver_account_id == account_id)
            counterparty_id = t.sender_account_id if is_incoming else t.receiver_account_id
            counterparty = self.db.query(Account).filter(Account.account_id == counterparty_id).first()
            cp_masked = counterparty.account_number_masked if counterparty else counterparty_id

            timeline.append({
                "transaction_id": t.transaction_id,
                "date_formatted": t.timestamp.strftime("%d %b %Y"),
                "time_formatted": t.timestamp.strftime("%H:%M"),
                "type": "INCOMING" if is_incoming else "OUTGOING",
                "amount": t.amount,
                "amount_formatted": f"{'+ ' if is_incoming else '- '}₹{t.amount:,.0f}",
                "counterparty_masked": f"{'From ' if is_incoming else 'To '}{cp_masked}",
                "channel": t.channel
            })
        return timeline
