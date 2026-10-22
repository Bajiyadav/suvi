from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Boolean
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


class WatchlistEntry(Base):
    """Tracks accounts marked by investigators for active monitoring.
    Prevents duplicates and records timestamps with reliable audit logging.
    """
    __tablename__ = "watchlist_entries"

    entry_id = Column(String(64), primary_key=True, index=True)
    account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    reason = Column(String(255), nullable=True)
    priority = Column(String(32), default="HIGH")
    added_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    investigator_id = Column(String(128), nullable=True)  # Recorded only if reliable identity provided
    is_active = Column(Boolean, default=True, index=True)
    removed_at = Column(DateTime, nullable=True)

    account = relationship("Account", foreign_keys=[account_id])


class InvestigationNote(Base):
    """Stores immutable case notes logged by investigators during triage or money trail analysis."""
    __tablename__ = "investigation_notes"

    note_id = Column(String(64), primary_key=True, index=True)
    account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    case_id = Column(String(64), ForeignKey("investigation_cases.case_id"), nullable=True, index=True)
    note_text = Column(Text, nullable=False)
    author = Column(String(128), nullable=True)  # Recorded only if reliable identity provided
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    account = relationship("Account", foreign_keys=[account_id])

