# System Architecture: FraudTrace AI

**Team:** SUVI  
**Project:** FraudTrace AI (PS-01)  
**Date:** 21 October 2026  

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            INVESTIGATION DASHBOARD                                |
|                           Next.js 14 / React / Tailwind                           |
|                                                                                   |
|  [ Overview KPI ]  [ Risky Accounts Queue ]  [ Money-Trail Explorer ]             |
|  [ Cytoscape Graph Canvas ]  [ Complaint Correlator ]  [ Evidence Report Export ] |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JSON)
                                           v
+-----------------------------------------------------------------------------------+
|                               FASTAPI BACKEND SERVICE                             |
|                                                                                   |
|  API Layer (FastAPI Routers):                                                     |
|  - /api/v1/overview       - /api/v1/accounts        - /api/v1/transactions        |
|  - /api/v1/money-trail    - /api/v1/graph           - /api/v1/complaints          |
|  - /api/v1/cases          - /api/v1/reports         - /api/v1/audit               |
|                                                                                   |
|  Service & Engine Layer:                                                          |
|  +-----------------------+ +-----------------------+ +-------------------------+  |
|  | Risk Scoring Engine   | | Money-Trail Engine    | | Graph Analytics Engine  |  |
|  | (Explainable Rubric)  | | (Temporal Traversal)  | | (NetworkX & Cytoscape)  |  |
|  +-----------------------+ +-----------------------+ +-------------------------+  |
|  +-----------------------+ +-----------------------+ +-------------------------+  |
|  | Complaint Correlator  | | Report Generator      | | Anomaly Detector        |  |
|  | (Entity Matching)     | | (Dossier & JSON/PDF)  | | (Pandas & Statistical)  |  |
|  +-----------------------+ +-----------------------+ +-------------------------+  |
|                                                                                   |
|  Data Access Layer:                                                               |
|  - SQLAlchemy 2.0 ORM / Pydantic v2 Models                                        |
|  - Deterministic Synthetic Fixture Generator (Seed Module)                        |
|  - SQLite (Local Demo Engine) / PostgreSQL (Production Compatible)               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Descriptions

### 2.1 Frontend Portal (Next.js 14 App Router + Tailwind CSS)
- **Design Aesthetic:** Official Light-themed Government Financial Crime Investigation Portal.
  - Backgrounds: Clean whites (`#FFFFFF`), light greys (`#F8FAFC`, `#F1F5F9`).
  - Accents: Deep navy blue (`#0F172A`, `#1E3A8A`), alert crimson (`#DC2626`), cautionary amber (`#D97706`), operational emerald (`#059669`).
  - High data density: Compact tabular view, clean metric cards, intuitive side-panel drawers for deep-dive account dossiers.
- **Visual Graph Visualization:**
  - Powered by **Cytoscape.js** with `cose` / `concentric` layouts.
  - Node styling reflects account risk tier, entity type (Account, Complaint, Merchant, Mule), and flow directionality.
- **Analytics Charts:**
  - Rendered via **Recharts** (Transaction volume timelines, Inflow vs Outflow pass-through breakdowns, Risk indicator breakdown bar charts).

### 2.2 Backend Service (FastAPI + Python)
- **FastAPI Core:** Async REST endpoints with automated OpenAPI / Swagger documentation (`/docs`).
- **Explainable Risk Scoring Service (`risk_scoring.py`):**
  - Evaluates accounts along 6 clear risk dimensions.
  - Generates human-auditable breakdown:
    $$\text{Total Score} = \sum_{i} \min(w_i, \text{score}_i)$$
  - Directly attaches supporting transaction IDs to each scored dimension.
- **Money-Trail Service (`money_trail.py`):**
  - Computes time-ordered fund movement DAGs (Directed Acyclic Graphs).
  - Traverses from victim debit events through staging mule nodes to terminal withdrawals or merchant gateways.
- **Graph Analytics Service (`graph_analytics.py`):**
  - Backed by **NetworkX**.
  - Computes: In/Out degree centrality, PageRank, strongly/weakly connected components, and cycle detection (circular fund routing).
  - Serializes graph into standard Cytoscape.js JSON payload (`nodes`, `edges`).
- **Complaint Correlation Service (`complaint_correlation.py`):**
  - Matches cybercrime complaint reports to accounts and transactions via multi-parameter matching:
    1. Direct Account Number match.
    2. Linked Mobile Number match.
    3. UPI VPA match.
    4. Proximity in time and transaction value.
- **Report Generation Service (`report_generation.py`):**
  - Generates comprehensive synthetic investigation dossiers containing all evidence, timelines, network maps, and statutory disclaimers.

### 2.3 Data & Storage Architecture
- **Storage Engine:** SQLite for zero-configuration, deterministic local demo mode, seamlessly upgradable to PostgreSQL via SQLAlchemy.
- **Deterministic Synthetic Seed:**
  - Seed generator builds a rich realistic graph of:
    - 60+ synthetic bank accounts across fictional financial institutions (State Bank of Bharat, Canara Union, HDFC Synthetic, etc.).
    - 500+ realistic transactions spanning normal salary accounts, student accounts, benign businesses, and 3 coordinated mule rings.
    - 25+ cybercrime complaints across fraud categories (UPI Phishing, Part-time Job Scam, Investment Ponzi, Fake Loan App).
    - Clear multi-hop money trails (up to 4 layers) from victim deposit to cash withdrawal.

---

## 3. Data Flow

```
[ Victim Complaint Lodged ]
            │
            ▼
[ System Ingestion / Correlation ] ──> Links Complaint #C2026-0158 to Account XXXX 4321
            │
            ▼
[ Risk Scoring Engine ] ────────────> Scores Account XXXX 4321 = 96/100 (Urgent Review)
            │                         - Rapid Pass-Through: 20/20
            │                         - Multi-Hop Layering: 20/20
            │                         - Complaint Linkages: 15/15
            │                         - Deviation from Norm: 15/15
            ▼
[ Money-Trail Tracer ] ─────────────> Traces:
                                      Victim (XXXX 7788) -> Mule 1 (XXXX 4321) -> Mule 2 (XXXX 2211) -> ATM Cashout
            │
            ▼
[ Graph Analytics ] ────────────────> Detects 6 connected entities, cycle loop, fan-out cluster
            │
            ▼
[ Investigator Portal ] ────────────> Analyst reviews timeline, inspects graph, approves freeze,
                                      and exports Evidence Dossier PDF/JSON.
```
