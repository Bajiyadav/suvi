from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import datetime
import enum
from app.core.database import Base

class ComplaintType(str, enum.Enum):
    UPI_FRAUD = "UPI Fraud"
    JOB_SCAM = "Job Scam"
    INVESTMENT_FRAUD = "Investment Fraud"
    LOAN_APP = "Fake Loan App"
    IDENTITY_THEFT = "Identity Theft"

class ComplaintStatus(str, enum.Enum):
    REPORTED = "Reported"
    UNDER_INVESTIGATION = "Under Investigation"
    VERIFIED = "Verified"
    CLOSED = "Closed"

class CybercrimeComplaint(Base):
    __tablename__ = "cybercrime_complaints"

    complaint_id = Column(String(64), primary_key=True, index=True)
    incident_date = Column(DateTime, default=datetime.datetime.utcnow)
    complaint_type = Column(String(64), default=ComplaintType.UPI_FRAUD.value)
    reported_loss_amount = Column(Float, nullable=False)
    victim_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=True)
    suspect_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=True, index=True)
    suspect_upi_vpa = Column(String(128), nullable=True)
    suspect_mobile = Column(String(32), nullable=True)
    status = Column(String(64), default=ComplaintStatus.VERIFIED.value)
    police_station_jurisdiction = Column(String(128), default="Cyber Crime Unit, Central")
    description = Column(String(512), nullable=True)

    links = relationship("ComplaintAccountLink", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintAccountLink(Base):
    __tablename__ = "complaint_account_links"

    id = Column(String(64), primary_key=True)
    complaint_id = Column(String(64), ForeignKey("cybercrime_complaints.complaint_id"), nullable=False, index=True)
    account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    link_reason = Column(String(256), nullable=False)
    match_confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaint = relationship("CybercrimeComplaint", back_populates="links")
