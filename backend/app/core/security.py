from fastapi import Header, HTTPException, status, Depends
from typing import Optional, List
from pydantic import BaseModel
import re
from app.core.config import settings

class InvestigatorRole:
    INVESTIGATOR = "INVESTIGATOR"
    LEAD_ANALYST = "LEAD_ANALYST"
    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER"
    AUDITOR = "AUDITOR"

class InvestigatorUser(BaseModel):
    investigator_id: str
    name: str
    role: str
    agency: str
    permissions: List[str]

# Pre-configured test/demo identities
INVESTIGATOR_PROFILES = {
    "ft-investigator-secret-key-2026": InvestigatorUser(
        investigator_id="INV-LEO-01",
        name="Inspector Sharma",
        role=InvestigatorRole.INVESTIGATOR,
        agency="Cyber Crime Investigation Cell, Mumbai",
        permissions=["read", "write", "watchlist", "notes", "export"]
    ),
    "ft-lead-analyst-key-2026": InvestigatorUser(
        investigator_id="ANL-LEAD-07",
        name="Dr. V. Rao",
        role=InvestigatorRole.LEAD_ANALYST,
        agency="Financial Intelligence Unit (FIU-IND)",
        permissions=["read", "write", "watchlist", "notes", "export", "admin"]
    ),
    "ft-auditor-key-2026": InvestigatorUser(
        investigator_id="AUD-COMP-03",
        name="Compliance Auditor K. Patel",
        role=InvestigatorRole.AUDITOR,
        agency="Independent Cyber Audit Oversight",
        permissions=["read", "export"]
    )
}

DEFAULT_SANDBOX_USER = InvestigatorUser(
    investigator_id="INV-SANDBOX-01",
    name="Officer R. Verma (Synthetic Sandbox)",
    role=InvestigatorRole.INVESTIGATOR,
    agency="Cyber Cell Demo Sandbox",
    permissions=["read", "write", "watchlist", "notes", "export"]
)

def get_current_investigator(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> InvestigatorUser:
    """Authenticates the caller as an authorized investigator or analyst.
    Supports X-API-Key header or Bearer Token in Authorization header.
    When AUTH_ENABLED is False (development/sandbox mode), allows unauthenticated access
    with an explicit sandbox identity so audit logs maintain accountability.
    """
    token = None
    if x_api_key:
        token = x_api_key.strip()
    elif authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if token:
        if token in INVESTIGATOR_PROFILES:
            return INVESTIGATOR_PROFILES[token]
        elif token == settings.API_KEY:
            return INVESTIGATOR_PROFILES["ft-investigator-secret-key-2026"]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid investigator credentials or API key."
            )

    if settings.AUTH_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid 'X-API-Key' or 'Authorization: Bearer <token>' header."
        )

    return DEFAULT_SANDBOX_USER

def require_role(allowed_roles: List[str]):
    """Role-Based Access Control (RBAC) dependency factory."""
    def role_checker(user: InvestigatorUser = Depends(get_current_investigator)) -> InvestigatorUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Investigator role '{user.role}' lacks permission for this operation. Required: {allowed_roles}."
            )
        return user
    return role_checker

def mask_account_number(account_number: Optional[str]) -> str:
    """Masks banking account numbers for sensitive data exposure prevention."""
    if not account_number:
        return "XXXX 0000"
    clean = re.sub(r"\s+", "", str(account_number))
    if len(clean) <= 4:
        return f"XXXX {clean}"
    return f"XXXX {clean[-4:]}"

def mask_mobile_number(mobile: Optional[str]) -> str:
    """Masks personal contact numbers for PII exposure prevention."""
    if not mobile:
        return "NOT_RECORDED"
    clean = re.sub(r"[^\d+]", "", str(mobile))
    if len(clean) >= 10:
        return f"{clean[:3]} {clean[3:5]}XXXXX {clean[-2:]}"
    return "+91 XXXXX XXXXX"

def enforce_human_review_policy(score: float, action: str):
    """Enforces statutory prohibition on automated adverse financial actions.
    Ensures AI risk scores are exclusively decision-support tools.
    """
    if "freeze" in action.lower() or "lien" in action.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Statutory Violation: Automated account freezing or lien placement based on AI risk scores "
                "is strictly prohibited. All adverse actions require independent investigator subpoena "
                "and judicial/regulatory verification."
            )
        )
