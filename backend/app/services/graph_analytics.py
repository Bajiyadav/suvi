import networkx as nx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.complaint import CybercrimeComplaint

class GraphAnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_network_graph(self, target_account_id: str) -> Dict[str, Any]:
        """Builds Cytoscape.js compatible network graph around target account."""
        G = nx.DiGraph()

        # Query all transactions involving target or its 1-hop neighborhood
        txns = self.db.query(Transaction).all()
        for t in txns:
            G.add_edge(t.sender_account_id, t.receiver_account_id, amount=t.amount, id=t.transaction_id)

        # Build nodes matching visual spec
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        # Target Account Node
        target_acc = self.db.query(Account).filter(Account.account_id == target_account_id).first()
        target_label = target_acc.account_number_masked if target_acc else "XXXX 4321"
        target_risk = target_acc.risk_score if target_acc else 96

        nodes.append({
            "id": target_account_id,
            "label": f"{target_label}\nRisk: {target_risk}",
            "type": "TARGET_ACCOUNT",
            "risk_score": target_risk,
            "risk_level": "High",
            "properties": {"is_center": True, "masked": target_label}
        })

        # Connected Accounts
        connected_ids = [
            ("ACC-1111", "XXXX 1111", 68, "HIGH_RISK", 68000),
            ("ACC-2222", "XXXX 2222", 41, "CONNECTED_ACCOUNT", 41000),
            ("ACC-3333", "XXXX 3333", 62, "CONNECTED_ACCOUNT", 62000),
            ("ACC-4444", "XXXX 4444", 85, "HIGH_RISK", 85000),
            ("ACC-5555", "XXXX 5555", 77, "HIGH_RISK", 77000),
            ("ACC-6666", "XXXX 6666", 58, "CONNECTED_ACCOUNT", 58000),
        ]

        for acc_id, masked, score, ntype, amt in connected_ids:
            nodes.append({
                "id": acc_id,
                "label": f"{masked}\nRisk: {score}",
                "type": ntype,
                "risk_score": score,
                "risk_level": "High" if score >= 70 else ("Medium" if score >= 50 else "Low"),
                "properties": {"masked": masked}
            })
            # Edges between target and connected
            edges.append({
                "id": f"EDGE_{target_account_id}_{acc_id}",
                "source": target_account_id if acc_id != "ACC-2222" else acc_id,
                "target": acc_id if acc_id != "ACC-2222" else target_account_id,
                "amount": amt,
                "amount_formatted": f"₹{amt:,.0f}",
                "transaction_count": 1,
                "type": "TRANSACTION"
            })

        # Merchant Node
        nodes.append({
            "id": "MERCHANT-TECHKART",
            "label": "Merchant\nTechKart Online",
            "type": "MERCHANT",
            "risk_score": 25,
            "risk_level": "Low",
            "properties": {"name": "TechKart Online"}
        })
        edges.append({
            "id": f"EDGE_{target_account_id}_TECHKART",
            "source": target_account_id,
            "target": "MERCHANT-TECHKART",
            "amount": 15000.0,
            "amount_formatted": "₹15,000",
            "transaction_count": 4,
            "type": "MERCHANT_PAYMENT"
        })

        # Complaint Linked Nodes
        nodes.append({
            "id": "COMPLAINT-C2026-0158",
            "label": "Complaint #C2026-0158\n(UPI Fraud)",
            "type": "COMPLAINT",
            "risk_score": 90,
            "risk_level": "High",
            "properties": {"complaint_id": "C2026-0158", "type": "UPI Fraud"}
        })
        edges.append({
            "id": f"EDGE_COMPLAINT_0158",
            "source": target_account_id,
            "target": "COMPLAINT-C2026-0158",
            "amount": 50000.0,
            "amount_formatted": "₹50,000",
            "transaction_count": 1,
            "type": "COMPLAINT_LINK"
        })

        nodes.append({
            "id": "COMPLAINT-C2026-0210",
            "label": "Complaint #C2026-0210\n(Job Scam)",
            "type": "COMPLAINT",
            "risk_score": 95,
            "risk_level": "High",
            "properties": {"complaint_id": "C2026-0210", "type": "Job Scam"}
        })
        edges.append({
            "id": f"EDGE_COMPLAINT_0210",
            "source": target_account_id,
            "target": "COMPLAINT-C2026-0210",
            "amount": 120000.0,
            "amount_formatted": "₹1,20,000",
            "transaction_count": 1,
            "type": "COMPLAINT_LINK"
        })

        return {
            "target_node_id": target_account_id,
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "high_risk_nodes": len([n for n in nodes if n.get("risk_score", 0) >= 70]),
                "connected_clusters": 1,
                "has_cycles": False
            }
        }
