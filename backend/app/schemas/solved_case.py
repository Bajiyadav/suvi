from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SolvedCaseBase(BaseModel):
    fir_number: str = Field(..., description="Police Station FIR number and law sections")
    police_station: str = Field(..., description="Police Station or Cyber Crime Unit")
    district: str = Field(..., description="District")
    state: str = Field(default="Bihar", description="State")
    investigating_officer: str = Field(..., description="Investigating Officer name and rank")
    crime_category: str = Field(..., description="Categorization of the cyber financial fraud")
    total_fraud_amount: float = Field(default=0.0, ge=0)
    recovered_amount: float = Field(default=0.0, ge=0)
    date_solved: str = Field(..., description="Date of resolution (YYYY-MM-DD)")
    case_status: str = Field(default="Charge-sheeted")

    # Accused / Mule Operative Details
    accused_name: str = Field(..., description="Full legal name of accused/mule")
    father_name: Optional[str] = Field(None, description="Father's name")
    age: Optional[int] = Field(None, ge=18, le=100)
    address: str = Field(..., description="Full postal address and jurisdiction")
    mobile_number: str = Field(..., description="Mobile number used in crime")
    alternate_mobile: Optional[str] = None
    id_proof: Optional[str] = Field(None, description="Masked Aadhaar / PAN / Voter ID")

    # Banking & Fast-Layering Profile
    bank_name: str = Field(..., description="Bank name of primary beneficiary/mule")
    account_number: str = Field(..., description="Bank account number or identifier")
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    bank_registered_mobile: str = Field(..., description="Mobile number linked to the bank account")
    upi_id: Optional[str] = None
    layering_speed_minutes: int = Field(default=5, ge=1)
    layering_route: str = Field(..., description="Chain of fund movement across mule layers")

    # Investigation & Seizure Memo
    modus_operandi: str = Field(..., description="How the victim was defrauded")
    breakthrough_trail: str = Field(..., description="How the police detected and intercepted the mules")
    seized_items: Optional[str] = Field(None, description="Details of seized devices, cash, SIM cards")
    national_portal_ref: Optional[str] = Field(None, description="NCRP / 1930 / CCTNS reference token")

class SolvedCaseCreate(SolvedCaseBase):
    pass

class SolvedCaseResponse(SolvedCaseBase):
    case_id: str
    created_at: datetime

    class Config:
        from_attributes = True
