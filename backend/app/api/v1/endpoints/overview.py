from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
import networkx as nx

from app.core.config import settings
from app.core.database import get_db
from app.models.account import Account, AccountCategory
from app.models.transaction import Transaction
from app.models.complaint import CybercrimeComplaint, ComplaintStatus
from app.services.transaction_analysis import TransactionAnalysisService
from app.services.risk_scoring import RiskScoringService
from app.services.complaint_correlation import ComplaintCorrelationService
from app.services.graph_analytics import GraphAnalyticsService
from app.schemas.overview import DashboardOverviewResponse, KpiMetrics

router = APIRouter()

# -----------------------------------------------------------------------------
# KPI METRICS DEFINITION & CALCULATION METHODOLOGY:
# 1. High Risk Accounts: Evaluated dynamically via RiskScoringService. An account is
#    counted as High Risk if its transactional risk score (calculated on-the-fly from
#    velocity, pass-through, counterparties, and complaints) is >= settings.HIGH_RISK_THRESHOLD (70)
#    or if categorized as MULE_SUSPECT. Never relies on stale un-refreshed scores.
# 2. Suspicious Networks: Count of weakly connected multi-account clusters (size >= 2)
#    formed by directed transaction fund flows across all database records.
# 3. Linked Complaints: Total cybercrime complaints recorded in `cybercrime_complaints`.
#    Trend reports count of complaints with status == 'Verified' by LEA / Cyber Cell.
# 4. Total Transactions Analyzed: Total row count in `transactions` table. Timeframe
#    derived from minimum and maximum transaction timestamps in the database.
# -----------------------------------------------------------------------------



@router.get("", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    focused_account_id: str = Query("ACC-4321", description="Account to focus on in dashboard"),
    db: Session = Depends(get_db)
):
    """Returns all data needed to render the master investigation portal dashboard.
    Calculates all KPIs dynamically from database records and handles empty DB gracefully.
    """
    total_accounts = db.query(Account).count()

    # -------------------------------------------------------------------------
    # 0. Empty Database Graceful Handling (Requirement A.4)
    # -------------------------------------------------------------------------
    if total_accounts == 0:
        return {
            "kpis": KpiMetrics(
                high_risk_accounts=0,
                high_risk_trend="0% of portfolio",
                suspicious_networks=0,
                networks_trend="0 active clusters",
                linked_complaints=0,
                complaints_trend="0 verified by cyber cell",
                total_transactions_analyzed="0",
                transactions_timeframe="No transaction records"
            ),
            "risky_accounts": [],
            "focused_account": focused_account_id or "",
            "flow_analysis": {
                "account_id": focused_account_id or "NONE",
                "account_number_masked": "N/A",
                "risk_score": 0,
                "incoming_total": 0.0,
                "incoming_total_formatted": "₹0",
                "incoming_count": 0,
                "layering_total": 0.0,
                "layering_total_formatted": "₹0",
                "layering_count": 0,
                "outflow_total": 0.0,
                "outflow_total_formatted": "₹0",
                "outflow_count": 0,
                "retained_balance": 0.0,
                "retained_percentage": 0.0
            },
            "timeline": [],
            "risk_explanation": {
                "account_id": focused_account_id or "NONE",
                "account_number_masked": "N/A",
                "risk_score": 0,
                "risk_tier": "Low",
                "confidence": 0.0,
                "top_contributing_factors": [],
                "disclaimer": "Important: No account records present in database."
            },
            "linked_complaints": [],
            "associated_entities": [],
            "network_graph": {
                "target_node_id": focused_account_id or "NONE",
                "nodes": [],
                "edges": [],
                "stats": {
                    "total_nodes": 0,
                    "total_edges": 0,
                    "high_risk_nodes": 0,
                    "connected_clusters": 0,
                    "has_cycles": False
                }
            }
        }

    # -------------------------------------------------------------------------
    # 1. Resolve Focused Account
    # -------------------------------------------------------------------------
    acc = db.query(Account).filter(Account.account_id == focused_account_id).first()
    if not acc:
        if focused_account_id == "ACC-4321":
            # Default param fallback: select highest risk account in current database
            top_acc = db.query(Account).order_by(Account.risk_score.desc()).first()
            if top_acc:
                focused_account_id = top_acc.account_id
                acc = top_acc
            else:
                raise HTTPException(status_code=404, detail="No accounts found in database.")
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Account '{focused_account_id}' not found in database."
            )

    flow_service = TransactionAnalysisService(db)
    risk_service = RiskScoringService(db)
    complaint_service = ComplaintCorrelationService(db)
    graph_service = GraphAnalyticsService(db)

    # -------------------------------------------------------------------------
    # 2. Dynamic KPI Calculation (Requirement A.1, A.2)
    # -------------------------------------------------------------------------
    # A. High Risk Accounts (Calculated dynamically to ensure consistency with RiskScoringService)
    high_risk_count = risk_service.get_high_risk_accounts_count(threshold=settings.HIGH_RISK_THRESHOLD)
    high_risk_pct = round((high_risk_count / max(1, total_accounts)) * 100)
    high_risk_trend_str = f"{high_risk_pct}% of portfolio"

    # B. Suspicious Networks (Graph Multi-Account Clusters)
    all_txns = db.query(Transaction).all()
    if all_txns:
        G = nx.DiGraph()
        for t in all_txns:
            G.add_edge(t.sender_account_id, t.receiver_account_id)
        # Components with 2 or more transacting accounts
        clusters = [c for c in nx.weakly_connected_components(G) if len(c) >= 2]
        suspicious_networks_count = len(clusters)
        networks_trend_str = f"{suspicious_networks_count} active cluster{'s' if suspicious_networks_count != 1 else ''}"
    else:
        suspicious_networks_count = 0
        networks_trend_str = "0 active clusters"

    # C. Linked Complaints
    complaints_count = db.query(CybercrimeComplaint).count()
    verified_count = db.query(CybercrimeComplaint).filter(
        CybercrimeComplaint.status == ComplaintStatus.VERIFIED.value
    ).count()
    complaints_trend_str = f"{verified_count} verified by cyber cell"

    # D. Total Transactions Analyzed
    total_txns_count = len(all_txns)
    if total_txns_count >= 1_000_000:
        total_txns_str = f"{total_txns_count / 1_000_000:.1f}M"
    elif total_txns_count >= 1_000:
        total_txns_str = f"{total_txns_count:,}"
    else:
        total_txns_str = str(total_txns_count)

    if all_txns:
        timestamps = [t.timestamp for t in all_txns if t.timestamp]
        if timestamps:
            min_date = min(timestamps).strftime("%d %b %Y")
            max_date = max(timestamps).strftime("%d %b %Y")
            timeframe_str = f"{min_date} - {max_date}"
        else:
            timeframe_str = "All recorded history"
    else:
        timeframe_str = "No transaction records"

    kpis = KpiMetrics(
        high_risk_accounts=high_risk_count,
        high_risk_trend=high_risk_trend_str,
        suspicious_networks=suspicious_networks_count,
        networks_trend=networks_trend_str,
        linked_complaints=complaints_count,
        complaints_trend=complaints_trend_str,
        total_transactions_analyzed=total_txns_str,
        transactions_timeframe=timeframe_str
    )

    # -------------------------------------------------------------------------
    # 3. Dynamic Risky Accounts Ranking Queue
    # -------------------------------------------------------------------------
    risky_accounts_data = risk_service.get_ranked_risky_accounts(limit=5)

    # -------------------------------------------------------------------------
    # 4. Component Data for Focused Account
    # -------------------------------------------------------------------------
    flow_summary = flow_service.get_flow_analysis(focused_account_id)
    timeline_items = flow_service.get_timeline(focused_account_id)
    risk_explanation = risk_service.calculate_explainable_risk(focused_account_id)
    linked_complaints = complaint_service.get_complaints_for_account(focused_account_id)
    associated_entities = complaint_service.get_associated_entities(focused_account_id)
    network_graph = graph_service.get_network_graph(focused_account_id)

    # Attach account_number_masked and current risk score
    flow_summary["account_number_masked"] = acc.account_number_masked
    flow_summary["risk_score"] = risk_explanation["risk_score"]

    return {
        "kpis": kpis,
        "risky_accounts": risky_accounts_data,
        "focused_account": focused_account_id,
        "flow_analysis": flow_summary,
        "timeline": timeline_items,
        "risk_explanation": risk_explanation,
        "linked_complaints": linked_complaints,
        "associated_entities": associated_entities,
        "network_graph": network_graph
    }
