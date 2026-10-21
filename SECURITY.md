# Security & Privacy Architecture: FraudTrace AI

**Team:** SUVI  
**Date:** 21 October 2026  

---

## 1. Data Privacy & Synthetic Guardrails
- **100% Synthetic Data:** Zero real customer banking records, Aadhaar numbers, PAN numbers, credit cards, or real police FIRs are used.
- **Masking Standards:** All synthetic account numbers are masked in display and log outputs (e.g. `XXXX 4321`), synthetic mobile numbers are formatted with standard prefixes (`+91 98765 XXXXX`), and all names are marked `(Synthetic)`.
- **Statutory Notice:** Every exported investigation dossier and UI view includes an unalterable banner:
  > *"NOTICE: This report and all associated records are generated synthetically for technology evaluation purposes under Cyber Hackathon 2026 PS-01. They do not represent actual criminal records or real financial intelligence."*

---

## 2. Application Security Controls

### 2.1 API & Network Security
- **Strict Input Validation:** All API inputs are rigorously validated using Pydantic v2 schemas with strict typing, regex constraints, and length limits.
- **SQL Injection Prevention:** All database operations utilize SQLAlchemy 2.0 ORM with parameter binding. No raw string interpolation into SQL queries.
- **Cross-Origin Resource Sharing (CORS):** Backend restricts CORS origins explicitly to the designated frontend port (`http://localhost:3000` / configurable origin list), disallowing wildcard `*` with credentials in production.
- **Error Sanitization:** API errors return standardized JSON error bodies. Internal stack traces and database connection strings are never exposed in production HTTP responses.

### 2.2 Auditability & Tamper Resistance
- **Immutable Audit Logging:** Every investigator query, case assignment, risk score override, and dossier export is written to an append-only audit log table with UTC timestamps.
- **Least Privilege Access:** Clear role separation modeled (`INVESTIGATOR`, `SUPERVISOR`, `AUDITOR`).

---

## 3. Secret Management
- Zero secrets, API keys, or private keys committed to Git.
- Configuration managed strictly via `.env` with a sanitized `.env.example` committed to version control.
