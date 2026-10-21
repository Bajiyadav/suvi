# Explainable Risk Scoring Framework: FraudTrace AI

**Team:** SUVI  
**Module:** `backend/app/services/risk_scoring.py`  
**Purpose:** Provide transparent, auditable, and mathematically bounded risk assessment for accounts.

---

## 1. Principles of Explainable Scoring
1. **Bounded Range:** Scores are strictly mapped between `0` (Minimal Risk) and `100` (Urgent Priority Review).
2. **Deterministic & Additive:** Every point gained corresponds to an explicit, documented behavioral or linkage indicator.
3. **Evidence-Linked:** Every indicator returns exact transaction IDs, complaint IDs, or timestamp deltas as supporting evidence.
4. **Anti-Double-Counting:** Correlated metrics (e.g. rapid outflow and pass-through volume) are normalized so an account is not penalized redundantly.
5. **Human-in-the-Loop Disclaimers:** Scores indicate *statistical likelihood of suspicious activity* and do **not** constitute proof of criminal liability or legal guilt.

---

## 2. Risk Indicator Matrix & Configurable Weights

| Indicator ID | Name | Max Points | Trigger Condition | Supporting Evidence Attached |
| :--- | :--- | :---: | :--- | :--- |
| `IND-01` | **Rapid Outgoing Transfers (Velocity)** | 20 | Outgoing transfer executed within 15 minutes of incoming credit. Points scale with speed: < 5 min = 20 pts, 5–15 min = 12 pts. | Transaction pair IDs `[TXN_IN, TXN_OUT]`, time elapsed in minutes. |
| `IND-02` | **Pass-Through Ratio (Layering)** | 20 | Ratio of outgoing funds to incoming funds exceeds 80% with minimal retained balance (< 5% of turnover). | Inflow total (₹), Outflow total (₹), Retained percentage. |
| `IND-03` | **Suspicious Multi-Hop Flow Patterns** | 20 | Account acts as an intermediary node in a >= 3 hop money trail or participates in circular routing ($A \to B \to C \to A$). | Directed graph path sequences, hop count, cycle indicators. |
| `IND-04` | **Deviation from Historical Baseline** | 15 | Current 7-day transaction velocity or volume exceeds 300% of historical monthly average, or sudden wakeup from dormant state. | Historical baseline vs observed window volume, days dormant. |
| `IND-05` | **Unusual Transaction Structuring** | 10 | Multiple incoming transactions just below standard reporting or monitoring thresholds (e.g., ₹45,000–₹49,900) in < 24 hrs. | List of structured transaction IDs, average amount, standard deviation. |
| `IND-06` | **Cybercrime Complaint Linkages** | 15 | Direct or entity-level linkage to registered cybercrime complaints (NCRP / Portal reports). Single complaint = 10 pts; multiple = 15 pts. | List of linked complaint IDs, matching attributes (VPA, Phone, Account). |
| **Total** | | **100** | | |

---

## 3. Mathematical Formulation

Let $A$ be the target account. The raw composite score $S(A)$ is defined as:

$$S(A) = \min\left(100, \sum_{k=1}^{6} w_k \cdot \phi_k(A)\right)$$

Where:
- $w_k \in [0, \text{Max}_k]$ represents the configurable weight for indicator $k$.
- $\phi_k(A) \in [0.0, 1.0]$ represents the normalized activation function for indicator $k$.

### Sparse / Missing Data Handling
If an account has fewer than 3 historical transactions or has been active for fewer than 48 hours, a flag `INSUFFICIENT_HISTORICAL_DATA` is emitted. Indicator `IND-04` (Deviation from Baseline) is suppressed or calibrated to neutral (0 points) to avoid false-positive inflation.

---

## 4. Priority Bands

| Score Range | Priority Tier | Recommended Investigative Protocol | UI Badge |
| :---: | :--- | :--- | :--- |
| **80 – 100** | **Urgent Review** | Immediate supervisory escalation; initiate lien/freeze request; notify cyber cell. | Red / Crimson (`#DC2626`) |
| **60 – 79** | **High Priority** | Expedited human analyst review within 12 hours; full money-trail expansion. | Amber / Orange (`#EA580C`) |
| **35 – 59** | **Review Needed** | Standard queue review; periodic monitoring rule applied. | Yellow (`#D97706`) |
| **0 – 34** | **Low Priority** | Normal operational baseline; no intervention needed. | Slate / Blue (`#3B82F6`) |

---

## 5. Sample API Output (JSON Schema)

```json
{
  "account_id": "ACC-IND-4321",
  "account_number_masked": "XXXX 4321",
  "risk_score": 96,
  "risk_tier": "URGENT_REVIEW",
  "confidence": 0.94,
  "top_contributing_factors": [
    {
      "indicator_id": "IND-01",
      "name": "Rapid Outgoing Transfers",
      "points_awarded": 20,
      "max_points": 20,
      "percentage_impact": 20.8,
      "summary": "Transferred ₹49,500 within 3 minutes of receiving ₹50,000 credit",
      "evidence_references": ["TXN-2026-90812", "TXN-2026-90813"]
    },
    {
      "indicator_id": "IND-02",
      "name": "Pass-Through Layering Behavior",
      "points_awarded": 20,
      "max_points": 20,
      "percentage_impact": 20.8,
      "summary": "Outflow ₹11,98,300 represents 97.2% of incoming turnover with minimal retained balance",
      "evidence_references": ["TURNOVER_WINDOW_7D"]
    },
    {
      "indicator_id": "IND-03",
      "name": "Multi-Hop Flow Patterns",
      "points_awarded": 20,
      "max_points": 20,
      "percentage_impact": 20.8,
      "summary": "Intermediary conduit in 4-hop chain connecting victim to cash-out ATM node",
      "evidence_references": ["TRAIL-NODE-001"]
    },
    {
      "indicator_id": "IND-06",
      "name": "Cybercrime Complaint Linkages",
      "points_awarded": 15,
      "max_points": 15,
      "percentage_impact": 15.6,
      "summary": "Directly linked to 5 registered cybercrime complaints (UPI & Job Scams)",
      "evidence_references": ["C2026-0158", "C2026-0210", "C2026-0305"]
    },
    {
      "indicator_id": "IND-04",
      "name": "Deviation from Observed Baseline",
      "points_awarded": 15,
      "max_points": 15,
      "percentage_impact": 15.6,
      "summary": "Sudden volume spike: ₹12.45L transacted vs ₹15,000 monthly average",
      "evidence_references": ["HISTORICAL_SPIKE_OCT2026"]
    },
    {
      "indicator_id": "IND-05",
      "name": "Unusual Structuring",
      "points_awarded": 6,
      "max_points": 10,
      "percentage_impact": 6.4,
      "summary": "Repeated credits of ₹49,500 and ₹49,800 avoiding ₹50,000 threshold",
      "evidence_references": ["TXN-2026-90814", "TXN-2026-90815"]
    }
  ],
  "disclaimer": "Risk scores indicate statistical likelihood of suspicious activity and do not confirm criminality. Requires human review."
}
```
