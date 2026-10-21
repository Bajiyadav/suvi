from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import datetime
import enum
from app.core.database import Base

class CaseStatus(str, enum.Enum):
    OPEN = "Open"
    UNDER_INVESTIGATION = "Under Investigation"
    FROZEN_REQUESTED = "Lien / Freeze Requested"
    ESCALATED = "Escalated to Cyber Cell"
    CLOSED = "Closed"

class InvestigationCase(Base):
    __tablename__ = "investigation_cases"

    case_id = Column(String(64), primary_key=True, index=True)
    target_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    assigned_investigator = Column(String(128), default="Investigator Cyber Crime Unit")
    case_status = Column(String(64), default=CaseStatus.UNDER_INVESTIGATION.value)
    priority = Column(String(32), default="HIGH")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    target_account = relationship("Account", back_populates="cases")
