# Project Discovery Report: FraudTrace AI (Team SUVI)

**Date:** 21 October 2026  
**Problem Statement:** PS-01 — Financial Fraud Investigation & Mule Account Detection  
**Team:** SUVI  
**Repository:** suvi  

---

## 1. Workspace State & Existing Artifacts
- **Current Directory:** `/Users/bajiyadav/.gemini/antigravity-ide/scratch/suvi`
- **Initial State:** Fresh empty project directory established inside the standard IDE scratch space.
- **Git Repository:** Newly initialized clean Git repository (`git init`). Default branch: `main`. No previous Git commit history or detached head.
- **Pre-existing Code/Assets:** None in the target directory. No legacy code to preserve or migrate. Neighboring scratch folders (`uber-clone`, `Venky-ride`, `hello-stranger-48`, etc.) remain completely untouched.

---

## 2. Environment & Toolchain Inspection
- **Operating System:** macOS (Darwin / Apple Silicon / arm64)
- **Node.js:** v24.11.1
- **Package Manager (Node):** npm v11.6.2
- **Python:** Python 3.14.3 system default, with `uv` available at `/Users/bajiyadav/.local/bin/uv` (enabling fast dependency management and pinned virtual environment support e.g. Python 3.12 / 3.11 if binary wheels require).
- **Git:** Git v2.39.5 (Apple Git-154)

---

## 3. Scope & Requirement Alignment
- **Problem Statement (PS-01):** Detect suspected mule bank accounts and cyber-enabled financial fraud by analyzing transactional behaviour, fund flows, cybercrime complaints, and relationships among connected entities.
- **Core Pillars:**
  1. Transaction analysis (unusual velocity, rapid pass-through / layering, deviations).
  2. Explainable risk scoring (0–100 scale, indicator weights, evidence-backed breakdown).
  3. Multi-hop money-trail investigation across accounts and intermediaries.
  4. Cybercrime complaint correlation (linking NCRP/complaint IDs with accounts/transactions).
  5. Interactive Graph Analytics (NetworkX backend + Cytoscape.js frontend).
  6. Government-grade investigation portal matching the UI specification (clean, high-contrast, light theme, navy accents).
  7. Evidence-based report generation (PDF & JSON export with audit trails and legal synthetic disclaimers).
  8. Deterministic synthetic dataset with normal patterns, benign anomalies, and verified multi-hop mule rings.

---

## 4. Preservation & Safety Notes
- No real banking or personal data will ever be introduced.
- All datasets are 100% synthetic, tagged explicitly with `SYNTHETIC_DATA_FLAG=true`.
- No credentials or private tokens will be committed to version control.
