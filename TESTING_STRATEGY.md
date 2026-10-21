# Testing Strategy & Quality Assurance Plan: FraudTrace AI

**Team:** SUVI  
**Target:** PS-01 Financial Fraud & Mule Account Investigation  
**Date:** 21 October 2026  

---

## 1. Testing Philosophy
Every algorithmic rule, scoring formula, graph traversal, and API contract must be backed by reproducible automated tests. No feature will be marked complete without passing test assertions.

---

## 2. Test Suites & Coverage Targets

### 2.1 Backend Unit & Service Tests (`backend/tests/`)
- **Framework:** `pytest`, `pytest-asyncio`, `httpx` (FastAPI TestClient).
- **Test Modules:**
  1. `test_risk_scoring.py`:
     - Score range invariance ($0 \le \text{Score} \le 100$).
     - Individual indicator activation correctness.
     - Anti-double-counting normalization.
     - Handling accounts with zero or single transaction (sparse data safeguard).
     - Score explainability structure validation.
  2. `test_money_trail.py`:
     - Multi-hop traversal depth limits (up to 5 hops).
     - Temporal causality check ($T_{child} \ge T_{parent}$).
     - Prevention of infinite loops in cyclic transaction networks.
     - Disconnected components and dead-end handling.
  3. `test_graph_analytics.py`:
     - Cycle detection ($A \to B \to C \to A$).
     - High in-degree / high out-degree mule hub extraction.
     - NetworkX graph to Cytoscape JSON conversion format.
  4. `test_complaint_correlation.py`:
     - Exact account match correlation.
     - Mobile number and UPI handle cross-referencing.
     - False match rejection (weak attribute non-linking).
  5. `test_report_generation.py`:
     - Evidence dossier generation with complete sections.
     - Presence of mandatory synthetic legal disclaimers.

### 2.2 API Integration Tests (`backend/tests/test_api_endpoints.py`)
- Test `/api/v1/overview`: KPI metrics calculation.
- Test `/api/v1/alerts`: Filtering by severity, sorting by score, pagination.
- Test `/api/v1/accounts/{id}`: Detailed profile, timeline, score breakdown.
- Test `/api/v1/money-trail/{account_id}`: Traversal payload.
- Test `/api/v1/graph/network`: Graph nodes/edges payload.
- Test `/api/v1/complaints`: Complaint search and linked accounts.
- Test `/api/v1/reports/export`: PDF/JSON payload download verification.
- Test error conditions: 404 for non-existent entities, 422 for malformed requests.

### 2.3 Synthetic Seed Verification Tests
- Test that `generate_fixtures.py` is 100% deterministic (reproducible seed producing identical record counts and hashes).
- Verify presence of specific benchmark mule rings (e.g. Account `XXXX 4321` and linked ring).

---

## 3. Test Execution Commands

```bash
# Backend test execution
cd backend
pytest -v --tb=short

# With coverage reporting
pytest --cov=app --cov-report=term-missing tests/
```
