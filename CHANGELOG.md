# Changelog: FraudTrace AI (Team SUVI)

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added - 2026-10-21 (Full End-to-End Implementation)
- **Scaffolded complete application structure:**
  - `backend/`: FastAPI 0.114, SQLAlchemy 2.1, Pydantic v2, NetworkX, ReportLab.
  - `frontend/`: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons.
  - `database/`, `data/synthetic/`, `scripts/`, `.github/workflows/`.
- **Deterministic Synthetic Fixture Generator (`backend/app/seed/generate_fixtures.py`):**
  - Synthesized 16 benchmark accounts, 12 correlated transaction flows, 3 verified cybercrime complaints (UPI & Task Scams), and active case dossiers.
- **Core Analytics Services (`backend/app/services/`):**
  - `risk_scoring.py`: 6 explainable indicators, max 100 points, evidence binding.
  - `transaction_analysis.py`: rapid pass-through velocity and fund flow aggregation.
  - `money_trail.py`: depth-bounded multi-hop BFS/DFS path tracer.
  - `complaint_correlation.py`: multi-attribute link analyzer and entity extractor.
  - `graph_analytics.py`: NetworkX graph modeling with Cytoscape JSON exporter.
  - `report_generation.py`: structured JSON dossiers and printable PDF exports with statutory disclaimers.
- **REST API Layer (`backend/app/api/v1/`):**
  - `/overview`, `/alerts`, `/accounts`, `/transactions`, `/money-trail`, `/graph`, `/complaints`, `/cases`, `/reports`.
- **Automated Pytest Suite (`backend/tests/`):**
  - 9 automated unit and integration tests passing with 100% success rate.
- **Investigation Portal UI (`frontend/`):**
  - Exact layout implementation matching reference design: Header, Sidebar, KPI Cards, Risky Accounts Queue, Suspicious Network Graph (SVG canvas with directional arrows and color-coded legend), Transaction Flow Card, Transaction Timeline, AI Risk Explanation circular gauge with factor bars, Linked Complaints Table, Associated Entities Table, Investigation Action Buttons, Statutory Disclaimer banner, and 8-Step Roadmap Footer.
  - Next.js 14 production bundle verified and compiled successfully.

### Added - 2026-10-21 (Phase 1 & Phase 2 Foundation)
- Initialized clean Git repository for Team `SUVI` (Problem Statement PS-01).
- Performed workspace discovery and environment verification (`PROJECT_DISCOVERY.md`).
- Authored system documentation:
  - `README.md`: Overview, architecture, and quick-start instructions.
  - `REQUIREMENTS.md`: Detailed functional (FR-01 to FR-07) and non-functional requirements.
  - `ARCHITECTURE.md`: High-level system architecture and data flows.
  - `IMPLEMENTATION_PLAN.md`: 9-phase execution roadmap leading to 26 October deadline.
  - `DATA_DICTIONARY.md`: Complete synthetic data schema for accounts, transactions, complaints, cases, and audit logs.
  - `RISK_SCORING.md`: Explainable 0–100 risk scoring formula, indicator weights, and sample JSON contract.
  - `TESTING_STRATEGY.md`: Test plan across unit tests, graph traversal validation, and API integration.
  - `SECURITY.md`: Data privacy safeguards, synthetic disclaimers, input validation, and audit controls.
  - `DEMO_SCRIPT.md`: Step-by-step hackathon jury presentation script.
  - `.gitignore`: Ignoring build outputs, node_modules, python venvs, and sqlite databases.
  - `.env.example`: Environment variable templates.
