import networkx as nx
from typing import Dict, Any, List, Set, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.complaint import CybercrimeComplaint, ComplaintAccountLink

class GraphAnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_network_graph(
        self,
        target_account_id: str,
        max_depth: int = 2,
        max_nodes: int = 40
    ) -> Dict[str, Any]:
        """Builds Cytoscape.js compatible network graph dynamically around target account using NetworkX."""
        target_acc = self.db.query(Account).filter(Account.account_id == target_account_id).first()
        if not target_acc:
            raise HTTPException(
                status_code=404,
                detail=f"Account '{target_account_id}' not found. Cannot construct network graph for nonexistent account."
            )

        # 1. Build NetworkX directed graph from all transaction records
        G = nx.DiGraph()
        G.add_node(target_account_id)

        txns = self.db.query(Transaction).all()
        pair_aggregates: Dict[tuple, Dict[str, Any]] = {}
        for t in txns:
            # Add nodes and directed edges
            pair = (t.sender_account_id, t.receiver_account_id)
            if pair not in pair_aggregates:
                pair_aggregates[pair] = {
                    "amount": 0.0,
                    "count": 0,
                    "channel": t.channel,
                    "pattern": t.pattern_tag
                }
            pair_aggregates[pair]["amount"] += t.amount
            pair_aggregates[pair]["count"] += 1
            G.add_edge(t.sender_account_id, t.receiver_account_id, **pair_aggregates[pair])

        # 2. Depth-bounded ego-graph traversal around target account
        # Use undirected view to capture both incoming fund senders and outgoing recipients
        undirected_G = G.to_undirected(as_view=True)
        if target_account_id in undirected_G:
            ego_nodes: Set[str] = set(nx.ego_graph(undirected_G, target_account_id, radius=max_depth).nodes())
        else:
            ego_nodes = {target_account_id}

        # Apply graph size limits if neighborhood exceeds max_nodes
        if len(ego_nodes) > max_nodes:
            direct_neighbors = set(G.predecessors(target_account_id)).union(set(G.successors(target_account_id)))
            sorted_direct = sorted(
                direct_neighbors,
                key=lambda n: (
                    pair_aggregates.get((target_account_id, n), {}).get("amount", 0.0) +
                    pair_aggregates.get((n, target_account_id), {}).get("amount", 0.0)
                ),
                reverse=True
            )
            retained = {target_account_id}
            retained.update(sorted_direct[:max_nodes - 1])
            remaining = ego_nodes - retained
            retained.update(list(remaining)[:max_nodes - len(retained)])
            ego_nodes = retained

        # Induce the directed subgraph on the selected nodes
        subgraph = G.subgraph(ego_nodes).copy()

        # 3. Build Account and Entity Node payloads
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        account_records = {
            a.account_id: a for a in self.db.query(Account).filter(Account.account_id.in_(ego_nodes)).all()
        }

        # Target Account Node
        target_label = target_acc.account_number_masked
        target_risk = target_acc.risk_score
        target_tier = "High" if target_risk >= 70 else ("Medium" if target_risk >= 50 else "Low")
        nodes.append({
            "id": target_account_id,
            "label": f"{target_label}\nRisk: {target_risk}",
            "type": "TARGET_ACCOUNT",
            "risk_score": target_risk,
            "risk_level": target_tier,
            "properties": {
                "is_center": True,
                "masked": target_label,
                "bank": target_acc.bank_name,
                "holder": target_acc.account_holder_name
            }
        })

        # Connected Account Nodes
        for nid in sorted(ego_nodes):
            if nid == target_account_id:
                continue
            acc = account_records.get(nid)
            if acc:
                is_merchant = (acc.account_type == "MERCHANT" or acc.account_category == "BUSINESS" or "MERCHANT" in nid)
                is_high_risk = (acc.risk_score >= 70 or acc.account_category == "MULE_SUSPECT")
                ntype = "MERCHANT" if is_merchant else ("HIGH_RISK" if is_high_risk else "CONNECTED_ACCOUNT")
                nrisk = acc.risk_score
                ntier = "High" if nrisk >= 70 else ("Medium" if nrisk >= 50 else "Low")
                nlabel = f"{acc.account_number_masked}\nRisk: {nrisk}" if not is_merchant else f"Merchant\n{acc.account_holder_name.split(' (')[0]}"
                nodes.append({
                    "id": nid,
                    "label": nlabel,
                    "type": ntype,
                    "risk_score": nrisk,
                    "risk_level": ntier,
                    "properties": {
                        "masked": acc.account_number_masked,
                        "bank": acc.bank_name,
                        "holder": acc.account_holder_name,
                        "category": acc.account_category
                    }
                })
            else:
                nodes.append({
                    "id": nid,
                    "label": f"{nid[-8:]}\nRisk: 50",
                    "type": "CONNECTED_ACCOUNT",
                    "risk_score": 50,
                    "risk_level": "Medium",
                    "properties": {"masked": nid}
                })

        # 4. Build Edge payloads for transactions in the subgraph
        for u, v, data in subgraph.edges(data=True):
            is_merchant = ("MERCHANT" in u or "MERCHANT" in v)
            amt = data.get("amount", 0.0)
            cnt = data.get("count", 1)
            edges.append({
                "id": f"EDGE_{u}_{v}",
                "source": u,
                "target": v,
                "amount": amt,
                "amount_formatted": f"₹{amt:,.0f}",
                "transaction_count": cnt,
                "type": "MERCHANT_PAYMENT" if is_merchant else "TRANSACTION"
            })

        # 5. Connect real database complaints linked to the target account
        complaint_links = self.db.query(ComplaintAccountLink).filter(
            ComplaintAccountLink.account_id == target_account_id
        ).all()

        seen_complaints: Set[str] = set()
        for link in complaint_links:
            cid = link.complaint_id
            c_node_id = f"COMPLAINT-{cid}"
            if cid not in seen_complaints:
                seen_complaints.add(cid)
                comp = self.db.query(CybercrimeComplaint).filter(CybercrimeComplaint.complaint_id == cid).first()
                if comp:
                    nodes.append({
                        "id": c_node_id,
                        "label": f"Complaint #{cid}\n({comp.complaint_type})",
                        "type": "COMPLAINT",
                        "risk_score": 90,
                        "risk_level": "High",
                        "properties": {
                            "complaint_id": cid,
                            "type": comp.complaint_type,
                            "loss": comp.reported_loss_amount,
                            "loss_formatted": f"₹{comp.reported_loss_amount:,.0f}"
                        }
                    })

                    edges.append({
                        "id": f"EDGE_COMPLAINT_{cid}_{link.account_id}",
                        "source": link.account_id,
                        "target": c_node_id,
                        "amount": comp.reported_loss_amount,
                        "amount_formatted": f"₹{comp.reported_loss_amount:,.0f}",
                        "transaction_count": 1,
                        "type": "COMPLAINT_LINK"
                    })

        # 6. Compute NetworkX graph analytics stats
        has_cycles = not nx.is_directed_acyclic_graph(subgraph) if len(subgraph) > 1 else False
        connected_clusters = nx.number_weakly_connected_components(subgraph) if len(subgraph) > 0 else 0

        return {
            "target_node_id": target_account_id,
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "high_risk_nodes": len([n for n in nodes if n.get("risk_score", 0) >= 70]),
                "connected_clusters": connected_clusters,
                "has_cycles": has_cycles
            }
        }
