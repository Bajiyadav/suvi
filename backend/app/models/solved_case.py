from sqlalchemy import Column, String, Float, DateTime, Text, Integer
import datetime
from app.core.database import Base

class SolvedCase(Base):
    """Official Police Record of Solved Cyber Financial Crime & Mule Account Operations.
    Used for judicial records, inter-agency intelligence, and training pattern models.
    """
    __tablename__ = "solved_cases"

    case_id = Column(String(64), primary_key=True, index=True)
    fir_number = Column(String(128), nullable=False, index=True)
    police_station = Column(String(128), nullable=False)
    district = Column(String(64), nullable=False)
    state = Column(String(64), default="Bihar")
    investigating_officer = Column(String(128), nullable=False)
    crime_category = Column(String(128), nullable=False)
    total_fraud_amount = Column(Float, default=0.0)
    recovered_amount = Column(Float, default=0.0)
    date_solved = Column(String(32), nullable=False)
    case_status = Column(String(64), default="Charge-sheeted")

    # Accused / Mule Operative Details
    accused_name = Column(String(128), nullable=False)
    father_name = Column(String(128), nullable=True)
    age = Column(Integer, nullable=True)
    address = Column(Text, nullable=False)
    mobile_number = Column(String(32), nullable=False, index=True)
    alternate_mobile = Column(String(32), nullable=True)
    id_proof = Column(String(128), nullable=True)

    # Banking & Fast-Layering Profile
    bank_name = Column(String(128), nullable=False)
    account_number = Column(String(64), nullable=False, index=True)
    ifsc_code = Column(String(32), nullable=True)
    branch_name = Column(String(128), nullable=True)
    bank_registered_mobile = Column(String(32), nullable=False)
    upi_id = Column(String(128), nullable=True)
    layering_speed_minutes = Column(Integer, default=5)
    layering_route = Column(Text, nullable=False)

    # Investigation & Seizure Memo
    modus_operandi = Column(Text, nullable=False)
    breakthrough_trail = Column(Text, nullable=False)
    seized_items = Column(Text, nullable=True)
    national_portal_ref = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
