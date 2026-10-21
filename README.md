# FraudTrace AI — Financial Fraud Investigation & Mule Account Detection Platform

[![Team](https://img.shields.io/badge/Team-SUVI-blue.svg)](https://github.com/suvi)
[![Problem Statement](https://img.shields.io/badge/Hackathon-Cyber%20Hackathon%202026%20PS--01-green.svg)](#)
[![Status](https://img.shields.io/badge/Status-Active%20Development-orange.svg)](#)

> **FraudTrace AI** is an intelligent, explainable financial crime investigation platform engineered for Team SUVI (Cyber Hackathon 2026, Problem Statement PS-01). It empowers law enforcement agencies, cybercrime cells, and bank fraud analysts to detect suspected mule bank accounts, trace complex multi-hop fund flows, correlate cybercrime complaints (e.g., NCRP/UPI fraud reports), and export legally sound, evidence-backed synthetic investigation dossiers.

---

## Key Features

1. **Transaction Velocity & Layering Analysis**
   - Rapid pass-through detection (funds transferred out within minutes of credit).
   - Smurfing / structuring detection (multiple sub-threshold deposits followed by rapid lump-sum withdrawal).
   - Inflow vs outflow ratio and velocity anomalies.

2. **Explainable Account Risk Scoring (0–100)**
   - Transparent, auditable scoring rubric with configurable weights.
   - Deconstructs every score into contributing indicators with direct evidence links.
   - Guardrails against duplicate penalization and handles sparse data gracefully.

3. **Multi-Hop Money-Trail Investigation**
   - Breadth-First and Depth-Bounded multi-hop path tracing from victim/source to cash-out points.
   - Time-ordered flow visualization preserving temporal causality.
   - Identification of intermediary mule accounts, staging nodes, and ultimate sink accounts.

4. **Multi-Incident Cybercrime Complaint Correlation**
   - Cross-references formal complaints (complaint IDs, FIR numbers, crime categories) against accounts and transactions.
   - Identifies co-offender networks, shared phone/device/UPI identifiers, and serial offenders.

5. **Interactive Relationship Graph Analytics**
   - Cytoscape.js interactive graph with directional fund flow edges, entity badges, and risk-weighted nodes.
   - Suspicious cluster detection, circular routing analysis, and high-degree node isolation.

6. **Government Investigation Portal UI**
   - High-contrast, clean, light-themed executive dashboard engineered to government portal guidelines.
   - KPI cards, prioritized alerts queue, transaction explorer, network graph canvas, and timeline inspector.

7. **Evidence-Based Dossier Export**
   - Downloadable case reports (PDF & structured JSON) with timestamped audit logs, limitation disclaimers, and synthetic data notices.

---

## Architecture Overview

```
               ┌────────────────────────────────────────────────────────┐
               │         Frontend (Next.js 14 / React / Tailwind)       │
               │  - Dashboard & KPIs    - Cytoscape.js Network Graph    │
               │  - Alerts Queue        - Money Trail Explorer          │
               │  - Account Dossier     - Evidence Report Generator     │
               └───────────────────────────▲────────────────────────────┘
                                           │ REST API (JSON)
               ┌───────────────────────────▼────────────────────────────┐
               │           Backend Service (FastAPI / Python)           │
               │  - /api/v1/overview       - /api/v1/accounts           │
               │  - /api/v1/alerts         - /api/v1/money-trail        │
               │  - /api/v1/graph          - /api/v1/complaints         │
               │  - /api/v1/reports        - /api/v1/cases              │
               ├────────────────────────────────────────────────────────┤
               │                   Analytics Engines                    │
               │  - Risk Scoring Engine (Explainable Rubric)            │
               │  - Money-Trail Tracer (Temporal Graph Traversal)       │
               │  - NetworkX Graph Engine (Clusters, Centrality, Loops) │
               │  - Complaint Correlator (Entity Matching Rules)        │
               ├────────────────────────────────────────────────────────┤
               │                  Data Layer / Storage                  │
               │  - SQLite (Local deterministic demo mode) / PostgreSQL │
               │  - Deterministic Synthetic Fixture Generator           │
               └────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on v24.11.1)
- Python >= 3.10 (Tested on Python 3.12 / 3.14 via `uv`)

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.seed.generate_fixtures
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Hackathon Rules & Compliance
- **Team Name:** `SUVI`
- **GitHub Repository:** `suvi`
- **Problem Statement:** `PS-01`
- **Deadline:** 26 October 2026
- **Safety Disclaimer:** All data, accounts, bank entities, complaints, and names used in this project are 100% synthetic and generated for demonstration purposes only.
