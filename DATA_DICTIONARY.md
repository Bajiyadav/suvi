# Data Dictionary: FraudTrace AI (Synthetic Fixtures)

**Team:** SUVI  
**Disclaimer:** All entities, identifiers, account numbers, and complaint numbers described herein are 100% fictional and synthesized for algorithmic evaluation.

---

## 1. Entity: `accounts`
Stores bank account profiles, demographic tags, and aggregate financial baselines.

| Field Name | Data Type | Constraints | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `account_id` | String | Primary Key, Indexed | Unique synthetic identifier | `ACC-IND-4321` |
| `account_number_masked` | String | Not Null | Masked display representation | `XXXX 4321` |
| `bank_name` | String | Not Null | Name of fictional financial institution | `State Bank of Bharat` |
| `branch_code` | String | Nullable | Synthetic IFSC/branch code | `SBBH0001042` |
| `account_holder_name` | String | Not Null | Fictional persona name | `Ramesh K. (Synthetic)` |
| `account_type` | Enum | Not Null | `SAVINGS`, `CURRENT`, `MERCHANT`, `WALLET` | `SAVINGS` |
| `account_category` | Enum | Not Null | `SALARY`, `STUDENT`, `BUSINESS`, `MULE_SUSPECT`, `VICTIM` | `MULE_SUSPECT` |
| `registered_mobile_masked`| String | Not Null | Masked contact phone | `+91 98765 43210` |
| `upi_vpa` | String | Nullable, Indexed | UPI Virtual Payment Address | `ramesh4321@ubharat` |
| `opened_date` | Date | Not Null | Synthetic account opening date | `2025-11-10` |
| `current_balance` | Float | Default 0.0 | Current balance in INR (₹) | `46700.00` |
| `status` | Enum | Default `ACTIVE` | `ACTIVE`, `FROZEN`, `UNDER_MONITORING`, `DORMANT` | `UNDER_MONITORING` |
| `risk_tier` | Enum | Default `LOW` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `CRITICAL` |

---

## 2. Entity: `transactions`
Records individual fund movements between accounts.

| Field Name | Data Type | Constraints | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `transaction_id` | String | Primary Key, Indexed | Unique transaction UTR / reference | `TXN-2026-90812` |
| `sender_account_id` | String | Foreign Key (`accounts.account_id`) | Debited account | `ACC-IND-7788` |
| `receiver_account_id`| String | Foreign Key (`accounts.account_id`) | Credited account | `ACC-IND-4321` |
| `amount` | Float | Not Null, > 0 | Transaction value in INR (₹) | `50000.00` |
| `timestamp` | DateTime | Not Null, Indexed | ISO timestamp of transfer | `2026-10-12T10:14:00Z` |
| `channel` | Enum | Not Null | `UPI`, `IMPS`, `NEFT`, `RTGS`, `ATM_CASH`, `POS` | `UPI` |
| `narrative` | String | Nullable | Synthetic narration / remarks | `Payment for freelance work` |
| `status` | Enum | Default `SUCCESS` | `SUCCESS`, `PENDING`, `REVERSED`, `FAILED` | `SUCCESS` |
| `pattern_tag` | Enum | Nullable | `NORMAL`, `RAPID_TRANSFER`, `LAYERING`, `STRUCTURING` | `RAPID_TRANSFER` |

---

## 3. Entity: `cybercrime_complaints`
Records cybercrime portal reports filed by victims or institutions.

| Field Name | Data Type | Constraints | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `complaint_id` | String | Primary Key, Indexed | NCRP / portal reference | `C2026-0158` |
| `incident_date` | Date | Not Null | Date of incident occurrence | `2026-10-10` |
| `complaint_type` | Enum | Not Null | `UPI_FRAUD`, `JOB_SCAM`, `INVESTMENT_FRAUD`, `LOAN_APP` | `UPI_FRAUD` |
| `reported_loss_amount`| Float| Not Null, > 0 | Financial loss in INR (₹) | `50000.00` |
| `victim_account_id` | String | Foreign Key (`accounts.account_id`) | Debited victim account | `ACC-IND-7788` |
| `suspect_account_id` | String | Foreign Key (`accounts.account_id`) | First receiver account | `ACC-IND-4321` |
| `suspect_upi_vpa` | String | Nullable | Fictional fraudster VPA | `ramesh4321@ubharat` |
| `suspect_mobile` | String | Nullable | Reported contact number | `+91 98765 43210` |
| `status` | Enum | Not Null | `REPORTED`, `UNDER_INVESTIGATION`, `VERIFIED`, `CLOSED`| `VERIFIED` |
| `police_station_jurisdiction` | String | Not Null | Fictional reporting jurisdiction | `Cyber Cell Central Unit, New Delhi` |

---

## 4. Entity: `investigation_cases`
Investigator dossiers tracking formal reviews and legal actions.

| Field Name | Data Type | Constraints | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `case_id` | String | Primary Key | Case dossier reference | `CASE-2026-0042` |
| `target_account_id`| String | Foreign Key (`accounts.account_id`) | Primary account under review | `ACC-IND-4321` |
| `assigned_investigator`| String | Not Null | Officer name or badge | `Insp. S. Verma (Cyber Crime)` |
| `case_status` | Enum | Not Null | `OPEN`, `FROZEN_REQUESTED`, `ESCALATED`, `RESOLVED` | `FROZEN_REQUESTED` |
| `created_at` | DateTime | Not Null | Creation timestamp | `2026-10-14T09:00:00Z` |
| `notes` | Text | Nullable | Running investigative notes | `Mule hub confirmed; fund diverted via 3 layers.` |

---

## 5. Entity: `audit_logs`
Immutable record of all analyst queries and system events.

| Field Name | Data Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `log_id` | String (UUID) | Unique log entry identifier | `log-b291-49fa-9812` |
| `timestamp` | DateTime | Event timestamp | `2026-10-21T16:30:00Z` |
| `actor` | String | Investigator identity | `Insp. S. Verma` |
| `action` | String | Action performed | `VIEW_ACCOUNT_DOSSIER`, `EXPORT_REPORT` |
| `target_entity` | String | Entity reference | `ACC-IND-4321` |
| `details` | JSON / Text | Contextual parameters | `{"format": "PDF", "case_id": "CASE-2026-0042"}` |
