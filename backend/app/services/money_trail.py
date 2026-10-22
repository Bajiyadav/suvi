from typing import List, Dict, Any, Set, Tuple
from collections import deque
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.account import Account, AccountCategory, AccountType

class MoneyTrailService:
    def __init__(self, db: Session):
        self.db = db

    def trace_money_trail(self, start_account_id: str, max_depth: int = 4, direction: str = "both") -> List[Dict[str, Any]]:
        """Performs forward and backward depth-bounded money trail traversal
        with cycle detection and terminal node role classification.
        Bounded between 1 and 6 hops. Supports direction in ('both', 'forward', 'backward').
        """
        # Bounded depth
        max_depth = max(1, min(6, max_depth))

        # Check account existence
        root_account = self.db.query(Account).filter(Account.account_id == start_account_id).first()
        if not root_account:
            return []

        # Cache accounts for fast lookup and privacy masking
        accounts_cache: Dict[str, Account] = {root_account.account_id: root_account}

        def get_account(acc_id: str) -> Account:
            if acc_id not in accounts_cache:
                acc = self.db.query(Account).filter(Account.account_id == acc_id).first()
                if acc:
                    accounts_cache[acc_id] = acc
            return accounts_cache.get(acc_id)

        hops: List[Dict[str, Any]] = []
        inbound_visited_txns: Set[str] = set()

        # ---------------------------------------------------------------------
        # 1. Backward Traversal: Inbound fund feeder hops (Sources / Victims)
        # ---------------------------------------------------------------------
        if direction in ("both", "backward"):
            in_txns = self.db.query(Transaction).filter(
                Transaction.receiver_account_id == start_account_id
            ).order_by(Transaction.timestamp.asc()).all()

        for t in in_txns:
            sender = get_account(t.sender_account_id)
            receiver = get_account(t.receiver_account_id)
            snd_masked = sender.account_number_masked if sender else t.sender_account_id
            rcv_masked = receiver.account_number_masked if receiver else t.receiver_account_id

            role = "SOURCE_VICTIM" if (sender and sender.account_category == AccountCategory.VICTIM.value) else "INBOUND_FEEDER"

            hops.append({
                "hop_level": 1,
                "from_account_id": t.sender_account_id,
                "from_account_masked": snd_masked,
                "to_account_id": t.receiver_account_id,
                "to_account_masked": rcv_masked,
                "amount": float(t.amount),
                "amount_formatted": f"₹{t.amount:,.0f}",
                "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M") if hasattr(t.timestamp, 'strftime') else str(t.timestamp),
                "channel": t.channel,
                "role": role,
                "transaction_id": t.transaction_id,
                "is_cycle": False
            })
            inbound_visited_txns.add(t.transaction_id)

        # ---------------------------------------------------------------------
        # 2. Forward Traversal: Depth-bounded multi-hop tracing with Cycle Handling
        # ---------------------------------------------------------------------
        if direction in ("both", "forward"):
            forward_visited_txns: Set[str] = set()
            queue = deque([(start_account_id, 1, [start_account_id])])
            max_hops_limit = 50

            while queue and len(hops) < max_hops_limit:
                curr_acc_id, current_hop, path = queue.popleft()

                if current_hop > max_depth:
                    continue

                out_txns = self.db.query(Transaction).filter(
                    Transaction.sender_account_id == curr_acc_id
                ).order_by(Transaction.timestamp.asc()).all()

                for t in out_txns:
                    if len(hops) >= max_hops_limit:
                        break

                    # Avoid duplicate traversal of identical transactions in same forward branch
                    if t.transaction_id in forward_visited_txns:
                        continue

                    sender = get_account(t.sender_account_id)
                    receiver = get_account(t.receiver_account_id)
                    snd_masked = sender.account_number_masked if sender else t.sender_account_id
                    rcv_masked = receiver.account_number_masked if receiver else t.receiver_account_id

                    # Cycle Detection: Target account already visited in this traversal path
                    is_cycle = t.receiver_account_id in path

                    if is_cycle:
                        role = "CIRCULAR_RETURN"
                    elif receiver and receiver.account_type == AccountType.MERCHANT.value:
                        role = "MERCHANT_CASHOUT"
                    elif current_hop == max_depth:
                        role = "CASHOUT_TERMINAL"
                    else:
                        # Check if receiver has further outflows
                        has_further_outflows = self.db.query(Transaction.transaction_id).filter(
                            Transaction.sender_account_id == t.receiver_account_id
                        ).first() is not None

                        if not has_further_outflows:
                            role = "CASHOUT_TERMINAL"
                        else:
                            role = f"MULE_LAYER_{current_hop}"

                    hops.append({
                        "hop_level": current_hop,
                        "from_account_id": t.sender_account_id,
                        "from_account_masked": snd_masked,
                        "to_account_id": t.receiver_account_id,
                        "to_account_masked": rcv_masked,
                        "amount": float(t.amount),
                        "amount_formatted": f"₹{t.amount:,.0f}",
                        "timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M") if hasattr(t.timestamp, 'strftime') else str(t.timestamp),
                        "channel": t.channel,
                        "role": role,
                        "transaction_id": t.transaction_id,
                        "is_cycle": is_cycle
                    })
                    forward_visited_txns.add(t.transaction_id)

                    # Only enqueue if cycle was NOT detected and not at max depth
                    if not is_cycle and current_hop < max_depth:
                        queue.append((t.receiver_account_id, current_hop + 1, path + [t.receiver_account_id]))

        return hops

    def get_money_trail_sequence(self, start_account_id: str, max_depth: int = 4, direction: str = "both") -> Dict[str, Any]:
        """Returns structured money trail sequence including cycle status and volume."""
        hops = self.trace_money_trail(start_account_id, max_depth=max_depth, direction=direction)
        cycle_detected = any(h.get("is_cycle", False) for h in hops)
        total_volume = sum(h.get("amount", 0.0) for h in hops)

        return {
            "root_account_id": start_account_id,
            "total_hops_traced": len(hops),
            "cycle_detected": cycle_detected,
            "total_volume_traced": total_volume,
            "hops": hops
        }
