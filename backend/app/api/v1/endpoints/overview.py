from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.complaint import CybercrimeComplaint
from app.services.transaction_analysis import TransactionAnalysisService
from app.services.risk_scoring import RiskScoringService
from app.services.complaint_correlation import ComplaintCorrelationService
from app.services.graph_analytics import GraphAnalyticsService
from app.schemas.overview import DashboardOverviewResponse, KpiMetrics

router = APIRouter()

@router.get("", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    focused_account_id: str = Query("ACC-4321", description="Account to focus on in dashboard"),
    db: Session = Depends(get_db)
):
    """Returns all data needed to render the master investigation portal dashboard."""
    flow_service = TransactionAnalysisService(db)
    risk_service = RiskScoringService(db)
    complaint_service = ComplaintCorrelationService(db)
    graph_service = GraphAnalyticsService(db)

    # 1. KPIs
    kpis = KpiMetrics(
        high_risk_accounts=127,
        high_risk_trend="+18%",
        suspicious_networks=32,
        networks_trend="+7%",
        linked_complaints=214,
        complaints_trend="+12%",
        total_transactions_analyzed="1.8M",
        transactions_timeframe="Last 30 days"
    )

    # 2. Risky Accounts (Top Priority queue)
    risky_accounts_data = [
        {"rank": 1, "account_id": "ACC-4321", "account_number": "XXXX 4321", "risk_score": 96, "risk_level": "High", "key_indicators": "Rapid transfers, multiple layers, linked complaints", "bank_name": "State Bank of Bharat"},
        {"rank": 2, "account_id": "ACC-8765", "account_number": "XXXX 8765", "risk_score": 92, "risk_level": "High", "key_indicators": "Structuring, mule pattern, 3 linked accounts", "bank_name": "Canara Union Bank"},
        {"rank": 3, "account_id": "ACC-1122", "account_number": "XXXX 1122", "risk_score": 88, "risk_level": "High", "key_indicators": "Many small credits, quick outflows, 5 complaints", "bank_name": "HDFC Synthetic"},
        {"rank": 4, "account_id": "ACC-7810", "account_number": "XXXX 7810", "risk_score": 76, "risk_level": "Medium", "key_indicators": "Unusual location, circular transactions", "bank_name": "Synthetic Kotak Bank"},
        {"rank": 5, "account_id": "ACC-9901", "account_number": "XXXX 9901", "risk_score": 72, "risk_level": "Medium", "key_indicators": "Linked to high-risk entity", "bank_name": "Punjab National Synthetic"},
    ]

    # 3. Component data for focused account
    flow_summary = flow_service.get_flow_analysis(focused_account_id)
    timeline_items = flow_service.get_timeline(focused_account_id)
    risk_explanation = risk_service.calculate_explainable_risk(focused_account_id)
    linked_complaints = complaint_service.get_complaints_for_account(focused_account_id)
    associated_entities = complaint_service.get_associated_entities(focused_account_id)
    network_graph = graph_service.get_network_graph(focused_account_id)

    # Attach account_number_masked to flow_summary
    acc = db.query(Account).filter(Account.account_id == focused_account_id).first()
    flow_summary["account_number_masked"] = acc.account_number_masked if acc else "XXXX 4321"
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
