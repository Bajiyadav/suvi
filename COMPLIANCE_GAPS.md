# FraudTrace AI — Prioritised Gap & Defect Report

**Project:** FraudTrace AI (Team SUVI)  
**Problem Statement:** PS-01 Financial Fraud & Mule Account Detection  
**Evaluation Date:** 21 October 2026  
**Auditor:** Independent Senior Software Auditor  

---

## 1. Overview of Audit Findings

The FraudTrace AI codebase presents a well-architected, visually appealing proof-of-concept that successfully runs unit tests and compiles production builds. However, under in-depth algorithmic audit, several critical and high-priority gaps were discovered where core analytics rely on **hardcoded bypasses for `ACC-4321`**, **static network graphs**, **fabricated evidence on non-existent accounts**, and **lack of an active GitHub remote or incremental commit history**.

Below is the prioritised defect log ordered by severity and hackathon disqualification risk.

---

## 2. Prioritised Defect & Gap Matrix

### Gap 1: Fabricated Evidence & Default Freeze Order on Non-Existent Accounts
- **Severity:** **CRITICAL**
- **Status:** **RESOLVED** (Verified on 21 Oct 2026 via 12/12 passing tests)
- **Category:** Mandatory Requirement / Data Integrity & Ethics
- **Component/File:** [`backend/app/services/report_generation.py`](file:///Users/bajiyadav/suvi/backend/app/services/report_generation.py) and [`backend/app/api/v1/endpoints/reports.py`](file:///Users/bajiyadav/suvi/backend/app/api/v1/endpoints/reports.py)
- **Defect Description:** When a non-existent account ID (e.g., `ACC-NONEXISTENT`) was requested via `/api/v1/reports/dossier-json/{account_id}` or `/api/v1/reports/download-pdf/{account_id}`, the backend returned `HTTP 200 OK` and fabricated an evidence dossier.
- **Resolution Implemented:** 
  1. `ReportGenerationService.generate_dossier_json()` verifies existence of the account; raises `HTTPException(status_code=404, detail="Account '<id>' not found")` if missing.
  2. Never fabricates fallback account-holder details, fake bank entities, or freeze orders.
  3. Formulates investigative conclusions and recommendations dynamically based on actual risk score, complaints count, and pass-through layering velocity.
  4. Both JSON and PDF endpoints return HTTP 404 cleanly when given nonexistent account IDs.
- **Reproducible Verification Method:**
  ```bash
  pytest -v tests/test_api_endpoints.py
  # test_evidence_dossier_json_nonexistent_account_returns_404 -> PASSED
  # test_evidence_dossier_pdf_nonexistent_account_returns_404 -> PASSED
  ```

---

### Gap 2: Hardcoded Network Graph Bypasses NetworkX & Real Data
- **Severity:** **CRITICAL**
- **Status:** **RESOLVED** (Verified on 21 Oct 2026 via 26/26 passing tests)
- **Category:** Mandatory Requirement (PS-01.5)
- **Component/File:** [`backend/app/services/graph_analytics.py`](file:///Users/bajiyadav/suvi/backend/app/services/graph_analytics.py), [`backend/app/api/v1/endpoints/graph.py`](file:///Users/bajiyadav/suvi/backend/app/api/v1/endpoints/graph.py), and [`frontend/src/features/overview/NetworkGraphCanvas.tsx`](file:///Users/bajiyadav/suvi/frontend/src/features/overview/NetworkGraphCanvas.tsx)
- **Defect Description:** `GraphAnalyticsService.get_network_graph()` previously ignored NetworkX graph `G` and returned a hardcoded 10-node mock for `ACC-4321`. Frontend canvas hardcoded 10 static (x, y) coordinates.
- **Resolution Implemented:**
  1. Built pure NetworkX directed graph from raw transaction records; aggregated duplicate multi-transfers into volume and count.
  2. Implemented depth-bounded ego-graph traversal (`nx.ego_graph(G, target_id, radius=max_depth)`) capturing both incoming and outgoing fund paths.
  3. Returns HTTP 404 cleanly when given nonexistent accounts. Safely handles disconnected accounts (0 edges) and computes real cycle detection and cluster statistics.
  4. Attached actual database cybercrime complaints to graph nodes with `COMPLAINT_LINK` edges.
  5. Implemented dynamic radial and multi-ring layout algorithm in `NetworkGraphCanvas.tsx` for variable network sizes (1 to 40+ nodes).
  6. Added interactive node and edge inspection drawer showing live details from the API.
- **Reproducible Verification Method:**
  ```bash
  pytest -v tests/test_graph_analytics.py
  # test_graph_network_extraction_target_account -> PASSED
  # test_different_accounts_produce_different_graphs -> PASSED
  # test_correct_source_and_destination_edges -> PASSED
  # test_depth_limits_and_cycles -> PASSED
  # test_disconnected_accounts_handled_safely -> PASSED
  # test_missing_account_returns_404 -> PASSED
  ```

---

### Gap 3: Hardcoded Risk Scoring & Flow Analysis Bypasses for Target Account
- **Severity:** **HIGH**
- **Status:** **RESOLVED** (Verified on 21 Oct 2026 via 16/16 passing tests)
- **Category:** Mandatory Requirement (PS-01.1 & PS-01.2)
- **Component/File:** [`backend/app/services/risk_scoring.py`](file:///Users/bajiyadav/suvi/backend/app/services/risk_scoring.py), [`backend/app/services/transaction_analysis.py`](file:///Users/bajiyadav/suvi/backend/app/services/transaction_analysis.py), and [`backend/app/api/v1/endpoints/overview.py`](file:///Users/bajiyadav/suvi/backend/app/api/v1/endpoints/overview.py)
- **Defect Description:** Risk scoring and flow analysis previously bypassed actual calculations for `ACC-4321` using hardcoded constants, circularly incorporated pre-stored risk scores, and hardcoded overview queue rankings.
- **Resolution Implemented:**
  1. Removed all `ACC-4321` conditional overrides from `TransactionAnalysisService` and `RiskScoringService`.
  2. Dynamically calculate incoming, outflow, layering, and retention totals from raw transaction records.
  3. Replaced static factor cards with a pure mathematical scoring engine evaluating 6 documented indicators against configurable weights (`WEIGHT_RAPID_TRANSFER`, `WEIGHT_PASS_THROUGH`, `WEIGHT_MULTI_HOP`, `WEIGHT_COMPLAINTS`, `WEIGHT_STRUCTURING`, `WEIGHT_BASELINE_DEVIATION`).
  4. Eliminated circular dependence on pre-stored database risk scores.
  5. Implemented dynamic priority queue ranking in `RiskScoringService.get_ranked_risky_accounts()` and integrated it into both `/api/v1/overview` and `/api/v1/alerts`.
  6. Added regression tests verifying dynamic scoring, bound checks, multi-account rankings, and score changes upon new transactions.
- **Reproducible Verification Method:**
  ```bash
  pytest -v tests/test_risk_scoring.py
  # 6 tests passed covering bounds, distinct accounts, exact totals, missing data, dynamic ranking, and reactive score changes.
  ```

---

### Gap 4: Monolithic Git Commit History (Hackathon Disqualification Risk)
- **Severity:** **HIGH**
- **Category:** Competition Compliance Rule
- **Component/File:** `.git` commit log
- **Defect Description:** `git log --oneline` shows only 2 monolithic commits:
  1. `6866904 feat: complete end-to-end implementation of FraudTrace AI portal and analytics engines`
  2. `ebd271d docs: add project requirements, architecture, and discovery report`
  Competition guidelines mandate demonstrable incremental commits throughout development. A 2-commit repository risks scrutiny or deduction during code review.
- **Expected Behaviour After Fix:** Structure all ongoing development, bug fixes, algorithmic refactoring, and test expansions into granular, descriptive incremental commits signed by team members.
- **Reproducible Verification Method:**
  ```bash
  git log --oneline | wc -l # Must show an incremental, multi-commit progression
  ```

---

### Gap 5: No Remote GitHub Origin Configured (Private Repo Compliance)
- **Severity:** **HIGH**
- **Category:** Competition Compliance Rule
- **Component/File:** `.git/config`
- **Defect Description:** Running `git remote -v` outputs nothing. The repository is only initialized locally. The competition rule requires a **private GitHub repository named `suvi`** with all registered team members added as collaborators.
- **Expected Behaviour After Fix:** Create the private repository on GitHub, configure remote origin (`git remote add origin git@github.com:<org>/suvi.git`), push `main`, and invite team members.
- **Reproducible Verification Method:**
  ```bash
  git remote -v # Must output valid fetch/push URLs for private repo 'suvi'
  ```

---

### Gap 6: Frontend Evidence Dossier Modal Uses Static Hardcoded JSON
- **Severity:** **MEDIUM**
- **Status:** **RESOLVED** (Verified on 21 Oct 2026 via test suite & Next.js production build)
- **Category:** Mandatory Requirement (PS-01.6)
- **Component/File:** [`frontend/src/components/DossierModal.tsx`](file:///Users/bajiyadav/suvi/frontend/src/components/DossierModal.tsx) and [`frontend/src/lib/api.ts`](file:///Users/bajiyadav/suvi/frontend/src/lib/api.ts)
- **Defect Description:** The frontend evidence modal previously defined a static JS object `sampleDossierJson` and rendered/copied it directly. It never fetched the live structured dossier from `GET /api/v1/reports/dossier-json/{accountId}`.
- **Resolution Implemented:**
  1. Updated `DossierModal.tsx` to execute `fetchDossierJson(accountId)` asynchronously whenever the modal opens or the account ID changes.
  2. Implemented immediate state clearing on account switch (`setDossierData(null)`) to prevent displaying stale evidence from the previous account.
  3. Added explicit visual states for loading spinner, HTTP 404 missing-account explanation, and general error banners.
  4. Wired PDF download directly to `/api/v1/reports/download-pdf/{accountId}` using the centrally configured `API_BASE_URL`.
  5. JSON tab copies real dynamic server-returned payload with live audit reference IDs and timestamps.
- **Reproducible Verification Method:**
  ```bash
  PYTHONPATH=. venv/bin/pytest -v tests/test_cases_and_dashboard.py -k test_dossier_switching_accounts_has_no_stale_data
  cd frontend && npm run build
  ```

---

### Gap 7: Hardcoded Overview Risky Accounts Queue & Missing Case Persistence
- **Severity:** **MEDIUM**
- **Status:** **RESOLVED** (Verified on 21 Oct 2026 via 33/33 passing tests)
- **Category:** Mandatory Requirement (PS-01.6)
- **Component/File:** [`backend/app/api/v1/endpoints/overview.py`](file:///Users/bajiyadav/suvi/backend/app/api/v1/endpoints/overview.py), [`backend/app/api/v1/endpoints/cases.py`](file:///Users/bajiyadav/suvi/backend/app/api/v1/endpoints/cases.py), and [`frontend/src/app/page.tsx`](file:///Users/bajiyadav/suvi/frontend/src/app/page.tsx)
- **Defect Description:**
  1. `overview.py` previously returned hardcoded KPI numbers (127, 1.8M, 32 networks) instead of querying actual database counts.
  2. `InvestigationActions` buttons ("Add to Watchlist", "Share with Agency") only fired browser alerts and did not call backend persistence endpoints.
- **Resolution Implemented:**
  1. `overview.py` calculates all KPIs dynamically from live database aggregations (high-risk count, graph weakly-connected clusters >= 2 nodes, verified complaints, total transactions, and historical date range).
  2. Handled empty database states gracefully with honest zero metrics (`getEmptyDashboardData()`) without crashing or inventing numbers.
  3. Created `WatchlistEntry` and `InvestigationNote` database models with duplicate prevention (HTTP 409), missing account validation (HTTP 404), and immutable `AuditLog` records.
  4. Exposed `/api/v1/cases/watchlist` (POST/GET/DELETE) and `/api/v1/cases/notes` (POST/GET) endpoints.
  5. Updated `page.tsx` and `InvestigationActions.tsx` to call persistent API endpoints with dynamic UI button state and inline notification toasts (no browser `alert()` popups).
- **Reproducible Verification Method:**
  ```bash
  PYTHONPATH=. venv/bin/pytest -v tests/test_cases_and_dashboard.py
  # test_kpis_match_seeded_database_records -> PASSED
  # test_kpi_updates_after_new_transaction -> PASSED
  # test_empty_database_overview_handling -> PASSED
  # test_watchlist_lifecycle_and_persistence -> PASSED
  # test_investigation_notes_lifecycle -> PASSED
  ```

---

### Gap 8: Unimplemented Detection Algorithms (Smurfing, Dormancy Wakeup)
- **Severity:** **LOW / ENHANCEMENT**
- **Category:** Functional Requirement (FR-01.3 & FR-01.4)
- **Component/File:** [`backend/app/services/transaction_analysis.py`](file:///Users/bajiyadav/suvi/backend/app/services/transaction_analysis.py)
- **Defect Description:** While `PatternTag.SMURFING` and `PatternTag.DORMANCY_WAKEUP` are defined in the data model and data dictionary, there is no service logic to detect them from raw transactions.
- **Expected Behaviour After Fix:** Add helper methods in `TransactionAnalysisService` to detect structuring (multiple credits under ₹50,000 within 24h followed by large debit) and dormancy wakeup (inactivity > 90 days followed by 5+ transactions in 24h).
- **Reproducible Verification Method:** Run unit tests validating detection on synthetic smurfing and dormancy test fixtures.

---

## 3. Summary of Action Items Prior to 26 October 2026 Deadline

| Priority | Action Item | Target File | Impact | Status |
|:---:|---|---|---|:---:|
| **P0** | Fix fabricated dossier on non-existent accounts (return 404) | `backend/app/services/report_generation.py`, `reports.py` | Eliminates critical data integrity bug | **RESOLVED** |
| **P0** | Connect private GitHub remote `suvi` & push incremental commits | `.git/config`, GitHub portal | Prevents competition disqualification | **PENDING** |
| **P1** | Replace hardcoded graph with dynamic NetworkX ego-graph | `backend/app/services/graph_analytics.py`, `NetworkGraphCanvas.tsx` | Fulfills PS-01.5 graph requirement | **RESOLVED** |
| **P1** | Remove hardcoded `ACC-4321` branches in risk scoring & flow | `backend/app/services/risk_scoring.py`, `transaction_analysis.py` | Fulfills PS-01.1 & PS-01.2 explainability | **RESOLVED** |
| **P2** | Dynamic KPI calculation & live Dossier modal fetch | `backend/app/api/v1/endpoints/overview.py`, `DossierModal.tsx` | Real-time frontend-backend data sync | **RESOLVED** |
| **P2** | Record & submit 8–10 minute video via Google Drive | `DEMO_SCRIPT.md`, Google Drive | Fulfills final submission requirement | **PENDING** |

