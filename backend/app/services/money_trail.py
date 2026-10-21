from typing import List, Dict, Any, Set
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.account import Account

class MoneyTrailService:
    def __init__(self, db: Session):
        self.db = db

    def trace_money_trail(self, start_account_id: str, max_depth: int = 4) -> List[Dict[str, Any]]:
        """Performs forward and backward depth-bounded money trail traversal."""
        hops: List[Dict[str, Any]] = []
        visited_edges: Set[str] = set()

        # 1. Backward hops: Inflow from victims/sources into the target
        in_txns = self.db.query(Transaction).filter(
            Transaction.receiver_account_id == start_account_id
        ).order_by(Transaction.timestamp.asc()).all()

        for t in in_txns:
            sender = self.db.query(Account).filter(Account.account_id == t.sender_account_id).first()
            receiver = self.db.query(Account).filter(Account.account_id == t.receiver_account_id).first()
            snd_masked = sender.account_number_masked if sender else t.sender_account_id
            rcv_masked = receiver.account_number_masked if receiver else t.receiver_account_id

            hops.append({
                "hop_level": 1,
                "from_account_id": t.sender_account_id,
                "from_account_masked": snd_masked,
                "to_account_id": t.receiver_account_id,
                "to_account_masked": rcv_masked,
                "amount": t.amount,
                "amount_formatted": f"₹{t.amount:,.0f}",
                "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M"),
                "channel": t.channel,
                "role": "SOURCE_VICTIM" if sender and sender.account_category == "VICTIM" else "INBOUND_FEEDER"
            })
            visited_edges.add(t.transaction_id)

        # 2. Forward hops: Outflow from target into intermediate mules (Hop 2)
        out_txns = self.db.query(Transaction).filter(
            Transaction.sender_account_id == start_account_id
        ).order_by(Transaction.timestamp.asc()).all()

        for t in out_txns:
            sender = self.db.query(Account).filter(Account.account_id == t.sender_account_id).first()
            receiver = self.db.query(Account).filter(Account.account_id == t.receiver_account_id).first()
            snd_masked = sender.account_number_masked if sender else t.sender_account_id
            rcv_masked = receiver.account_number_masked if receiver else t.receiver_account_id

            role = "MERCHANT_CASHOUT" if receiver and receiver.account_type == "MERCHANT" else "MULE_LAYER_2"
            hops.append({
                "hop_level": 2,
                "from_account_id": t.sender_account_id,
                "from_account_masked": snd_masked,
                "to_account_id": t.receiver_account_id,
                "to_account_masked": rcv_masked,
                "amount": t.amount,
                "amount_formatted": f"₹{t.amount:,.0f}",
                "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M"),
                "channel": t.channel,
                "role": role
            })
            visited_edges.add(t.transaction_id)

            # 3. Third Hop: follow receiver to subsequent accounts
            secondary_out = self.db.query(Transaction).filter(
                Transaction.sender_account_id == t.receiver_account_id
            ).all()

            for st in secondary_out:
                if st.transaction_id not in visited_edges and len(hops) < 25:
                    s_sender = self.db.query(Account).filter(Account.account_id == st.sender_account_id).first()
                    s_receiver = self.db.query(Account).filter(Account.account_id == st.receiver_account_id).first()
                    hops.append({
                        "hop_level": 3,
                        "from_account_id": st.sender_account_id,
                        "from_account_masked": s_sender.account_number_masked if s_sender else st.sender_account_id,
                        "to_account_id": st.receiver_account_id,
                        "to_account_masked": s_receiver.account_number_masked if s_receiver else st.receiver_account_id,
                        "amount": st.amount,
                        "amount_formatted": f"₹{st.amount:,.0f}",
                        "timestamp": st.timestamp.strftime("%Y-%m-%d %H:%M"),
                        "channel": st.channel,
                        "role": "CASHOUT_TERMINAL"
                    })
                    visited_edges.add(st.transaction_id)

        return hops
