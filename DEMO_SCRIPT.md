# Hackathon Demonstration Script: FraudTrace AI (Team SUVI)

**Problem Statement:** PS-01 Financial Fraud & Mule Account Detection  
**Target Duration:** 5–7 Minutes  
**Audience:** Hackathon Jury, Cybercrime Investigation Experts & Technical Evaluators  

---

## Act 1: The Challenge & Executive Overview (1 Minute)
1. **Introduction:** Introduce Team SUVI and the core challenge of PS-01: Cyber fraudsters rapidly move stolen funds across multi-tier mule accounts, leaving victims with unrecoverable losses and investigators with fragmented data.
2. **Launch Portal:** Open FraudTrace AI at `http://localhost:3000`.
3. **Dashboard KPIs:** Highlight the live KPI cards:
   - **High Risk Accounts (127)** flagged for immediate review.
   - **Suspicious Networks (32)** uncovered through graph clustering.
   - **Linked Complaints (214)** correlated across cyber cells.
   - **Total Transactions (1.8M)** analyzed across synthetic feeds.

---

## Act 2: Priority Alerts & Account Deep Dive (2 Minutes)
1. **Inspect Alert Queue:** Navigate to the Risky Accounts queue. Point out the top suspect: **Account XXXX 4321** with a Risk Score of **96 (High / Urgent Review)**.
2. **AI Risk Explanation:** Show the explainable breakdown card:
   - Rapid fund transfers: Outflow dispatched within 3 minutes of victim credit (20 pts).
   - High pass-through layering: 97.2% funds forwarded, zero retained balance (20 pts).
   - 5 Cybercrime complaints directly linked (15 pts).
   - Multi-hop flow pattern (20 pts).
   - Emphasize that every score is fully transparent and mathematically backed with real transaction references.
3. **Transaction Flow Analysis:** Walk through the flow card showing:
   - Incoming Funds: ₹12,45,000 (42 credits)
   - Layering / Transfers: ₹12,10,500 (38 transfers)
   - Outflow to Sinks: ₹11,98,300 (36 transfers)

---

## Act 3: Multi-Hop Money Trail & Graph Network (2 Minutes)
1. **Interactive Relationship Graph:**
   - Explore the Cytoscape.js network canvas.
   - Click on the central mule hub (`XXXX 4321`). Observe highlighted inbound edges from victims and outbound fan-out to second-tier mules (`XXXX 2211`, `XXXX 5555`, `XXXX 4444`).
   - Highlight circular routing cycles and the terminal cash-out ATM node.
2. **Complaint Correlation:**
   - Open Complaint `#C2026-0158` (UPI Fraud, ₹50,000) and `#C2026-0210` (Job Scam, ₹1,20,000).
   - Show how the platform automatically connects independent complaints filed in different districts to the same mule syndicate.

---

## Act 4: Case Action & Evidence Dossier Export (1 Minute)
1. **Case Action:** Change case status to `FROZEN_REQUESTED` and add investigator notes.
2. **Generate Investigation Report:** Click **"Generate Investigation Report"**.
3. **Show Dossier:** Present the generated official synthetic dossier containing complete entity profiles, transaction timelines, money-trail sequence, and mandatory legal disclaimers.
4. **Conclusion:** Summarize how FraudTrace AI cuts investigation time from days to minutes while providing complete explainability and auditable evidence.
