from fastapi import APIRouter
from app.api.v1.endpoints import (
    overview,
    accounts,
    transactions,
    alerts,
    money_trail,
    graph,
    complaints,
    cases,
    reports,
    copilot
)

api_router = APIRouter()

api_router.include_router(overview.router, prefix="/overview", tags=["Overview"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(money_trail.router, prefix="/money-trail", tags=["Money Trail"])
api_router.include_router(graph.router, prefix="/graph", tags=["Graph Analytics"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])
api_router.include_router(cases.router, prefix="/cases", tags=["Investigation Cases"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Dossiers"])
api_router.include_router(copilot.router, prefix="/copilot", tags=["AI Copilot"])
