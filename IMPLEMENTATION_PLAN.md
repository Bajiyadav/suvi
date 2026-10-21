# Implementation Plan: FraudTrace AI (Team SUVI)

**Deadline:** 26 October 2026  
**Strategy:** Phased, test-driven, verifiable progress with atomic Git commits.  

---

## Roadmap Overview

```
Phase 1: Discovery & Requirements (Completed)
Phase 2: Project Architecture & Documentation (In Progress)
Phase 3: Repository Skeleton & Environment Setup
Phase 4: Synthetic Data Generator & Database Schema
Phase 5: Backend Analytics Services & Unit Tests
  - Transaction Analysis
  - Explainable Risk Scoring Engine
  - Money-Trail Traversal
  - Complaint Correlation Engine
  - Graph Analytics Engine (NetworkX)
Phase 6: Frontend Portal Development (Next.js 14 + Tailwind)
  - Layout & Navigation matching Government Portal Spec
  - Overview KPI Dashboard
  - Risky Accounts Queue & Drawer
  - Interactive Cytoscape.js Network Graph
  - Money-Trail Timeline & Flow View
  - Complaint Correlation Explorer
  - Case Management & Evidence Export
Phase 7: End-to-End Integration & API Wiring
Phase 8: Comprehensive Automated Testing & Validation
Phase 9: Demonstration Verification & Polish
```

---

## Detailed Phase Breakdown

### Phase 1 & 2: Discovery, Documentation & Foundation
- [x] Workspace exploration and environment verification.
- [x] Initialized clean Git repository.
- [x] Created `PROJECT_DISCOVERY.md`, `README.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`.
- [ ] Create `IMPLEMENTATION_PLAN.md`, `DATA_DICTIONARY.md`, `RISK_SCORING.md`, `TESTING_STRATEGY.md`, `SECURITY.md`, `DEMO_SCRIPT.md`, `CHANGELOG.md`, `.gitignore`.

### Phase 3: Project Skeleton & Development Toolchains
- Setup `backend/` directory with FastAPI, Pydantic, SQLAlchemy, NetworkX, Pandas, Pytest.
- Setup `frontend/` directory with Next.js 14, TypeScript, Tailwind CSS, Lucide icons, Cytoscape.js, Recharts.
- Verify basic backend and frontend servers launch cleanly.

### Phase 4: Deterministic Synthetic Dataset & Schemas
- Design SQL models: `Account`, `Transaction`, `CybercrimeComplaint`, `ComplaintAccountLink`, `InvestigationCase`, `AuditLog`.
- Implement `backend/app/seed/generate_fixtures.py` to synthesize:
  - 60+ accounts (Normal salary, merchant, student, dormant, mule rings).
  - 500+ timestamped transactions featuring rapid pass-through, smurfing, layering, and normal baseline activity.
  - 25+ cybercrime complaints across fraud types (UPI fraud, investment scams, task scams).
  - Explicit multi-hop trails with ground truth tags.

### Phase 5: Backend Analytics Services
- Implement `transaction_analysis.py`: velocity, balance anomalies, rapid pass-through detection.
- Implement `risk_scoring.py`: 6 explainable dimensions with max 100 points, evidence binding.
- Implement `money_trail.py`: depth-bounded BFS/DFS money trail tracer with temporal validation.
- Implement `complaint_correlation.py`: multi-attribute link analyzer.
- Implement `graph_analytics.py`: NetworkX graph modeling, cycle detection, cluster extraction, Cytoscape JSON exporter.
- Implement `report_generation.py`: comprehensive JSON/printable dossier generation.
- Implement FastAPI endpoints with full schema validation and error handling.
- Write Pytest suite covering all rules, scoring bounds, and edge cases.

### Phase 6: Frontend Investigation Portal
- Header with agency branding, global search, investigator profile, and notification badge.
- Sidebar with navigation matching target UI.
- Top KPI summary banner (High Risk Accounts, Suspicious Networks, Linked Complaints, Total Transactions).
- Priority Risky Accounts table with risk score badge, indicator pills, and quick view action.
- Interactive Cytoscape.js Network Graph with node coloring, flow direction, zoom/pan controls, and inspector modal.
- Transaction Flow Analysis card (Incoming -> Layering -> Outflow).
- Transaction Timeline stream.
- AI Risk Explanation gauge with breakdown bars.
- Linked Cybercrime Complaints list with verification status.
- Associated Entities table.
- Action buttons: "Generate Investigation Report", "Export Network", "Add to Watchlist".
- Bottom roadmap visualizer matching the reference portal design.

### Phase 7 & 8: Integration, Testing & Verification
- Connect frontend to FastAPI backend API endpoints.
- Add client-side state management for live filtering, search, and detail drawer viewing.
- Execute automated tests (Pytest for backend services and API endpoints).
- Run end-to-end smoke test validating all user flows.

### Phase 9: Demo Readiness & Final Documentation
- Verify demo script against live running app.
- Final commit and tag for submission.
