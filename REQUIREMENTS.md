# System Requirements Specification: FraudTrace AI

**Project Name:** FraudTrace AI  
**Team:** SUVI  
**Target Statement:** Cyber Hackathon 2026 Problem Statement PS-01  
**Target Deadline:** 26 October 2026  

---

## 1. Functional Requirements (FR)

### FR-01: Transaction Analysis & Pattern Detection
- **FR-01.1:** System shall ingest structured transaction records including Transaction ID, Sender Account, Receiver Account, Timestamp, Amount, Channel (UPI, IMPS, RTGS, NEFT, ATM), Currency, and Status.
- **FR-01.2:** System shall flag **Rapid Pass-Through** behavior: account receives incoming credit and dispatches >= 80% of funds within 15 minutes.
- **FR-01.3:** System shall detect **Smurfing / Structuring**: multiple credits below regulatory reporting thresholds (e.g., ₹10,000–₹49,999) followed by a consolidated single outflow.
- **FR-01.4:** System shall detect **Dormancy Wakeup**: accounts with minimal historical balance/activity suddenly transacting high velocity/volume.

### FR-02: Explainable Account Risk Scoring
- **FR-02.1:** System shall compute an integer risk score between 0 and 100 for each evaluated account.
- **FR-02.2:** System shall categorize scores into 4 risk priority bands:
  - **Urgent Review (Score 80–100):** High confidence of mule / layering hub.
  - **High Priority (Score 60–79):** Significant anomalies or complaint linkages.
  - **Review Needed (Score 35–59):** Moderate deviations; manual audit recommended.
  - **Low Priority (Score 0–34):** Benign transactional behavior.
- **FR-02.3:** System must provide an explainability breakdown for every calculated score showing each indicator's points, max potential weight, contributing transaction references, and plain-language justification.
- **FR-02.4:** The scoring engine must avoid double-counting correlated risk factors and flag sparse/insufficient data.

### FR-03: Multi-Hop Money-Trail Tracing
- **FR-03.1:** Given a seed account or transaction, system shall perform forward and backward depth-bounded money-trail exploration (up to 5 hops).
- **FR-03.2:** System shall identify source of funds (victim accounts), pass-through intermediary mules, and terminus/cash-out nodes (ATM withdrawals, crypto gateways, merchant payments).
- **FR-03.3:** Fund traces must maintain strict temporal ordering ($T_{hop1} \le T_{hop2}$).

### FR-04: Cybercrime Complaint Correlation
- **FR-04.1:** System shall ingest synthetic cybercrime complaints (Complaint ID, Category, Incident Date, Reported Loss, Associated Bank/UPI/Phone/IP, Status).
- **FR-04.2:** System shall link complaints to bank accounts and transactions via direct account matches, shared mobile numbers, shared UPI VPA handles, and timing proximity.
- **FR-04.3:** System shall highlight syndicates where multiple independent complaints converge on a single account or tight cluster of accounts.

### FR-05: Graph Analytics & Visual Network Exploration
- **FR-05.1:** Graph analytics service shall model entities (Accounts, Persons, Devices, Complaints, Merchants) as nodes and financial transactions as directed edges.
- **FR-05.2:** System shall detect circular transaction loops ($A \to B \to C \to A$), fan-in / fan-out hubs, and weakly connected mule clusters.
- **FR-05.3:** Interactive web graph canvas (Cytoscape.js) shall allow panning, zooming, node selection, path highlighting, and detail inspection.

### FR-06: Case Management & Audit Trails
- **FR-06.1:** Investigators can create cases, assign statuses (`New`, `Under Investigation`, `Escalated to Cyber Cell`, `Frozen / Closed`), and add timestamped investigation notes.
- **FR-06.2:** All investigator actions (viewing, risk overrides, note additions, report exports) must be recorded in an immutable audit trail.

### FR-07: Evidence Report Export
- **FR-07.1:** System shall generate an official synthetic evidence dossier in JSON and printable/downloadable format.
- **FR-07.2:** Dossier shall include: Case Metadata, Target Account Profile, Risk Factor Breakdown, Complete Money Trail Sequence, Linked Complaints, Visual Graph Snapshot, and Mandatory Synthetic Legal Disclaimer.

---

## 2. Non-Functional Requirements (NFR)

### NFR-01: Performance & Scalability
- Sub-200ms API response time for account queries and graph neighborhood expansions under local demonstration loads (1,000+ accounts, 10,000+ transactions).
- Client-side graph rendering optimized for smooth interaction up to 500 simultaneous nodes/edges.

### NFR-02: Security & Privacy
- Zero inclusion of real banking records, real PII, or actual police FIRs.
- Environment-configured CORS and strict Pydantic input validation to prevent injection attacks.
- Read-only demo mode prevents unintended data corruption.

### NFR-03: Accessibility & Design Standards
- Light-themed, government portal UI compliant with WCAG 2.1 AA contrast ratios.
- Responsive layout supporting viewports from 1280px desktop down to tablet screens.
- Keyboard accessible navigation across tables, drawers, and modal dialogs.
