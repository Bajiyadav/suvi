from sqlalchemy import Column, String, Float, DateTime, Enum, Integer
from sqlalchemy.orm import relationship
import datetime
import enum
from app.core.database import Base

class AccountType(str, enum.Enum):
    SAVINGS = "SAVINGS"
    CURRENT = "CURRENT"
    MERCHANT = "MERCHANT"
    WALLET = "WALLET"

class AccountCategory(str, enum.Enum):
    SALARY = "SALARY"
    STUDENT = "STUDENT"
    BUSINESS = "BUSINESS"
    MULE_SUSPECT = "MULE_SUSPECT"
    VICTIM = "VICTIM"

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    UNDER_MONITORING = "UNDER_MONITORING"
    DORMANT = "DORMANT"

class RiskTier(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(String(64), primary_key=True, index=True)
    account_number_masked = Column(String(32), nullable=False)
    bank_name = Column(String(128), nullable=False)
    branch_code = Column(String(64), nullable=True)
    account_holder_name = Column(String(128), nullable=False)
    account_type = Column(String(32), default=AccountType.SAVINGS.value)
    account_category = Column(String(32), default=AccountCategory.SALARY.value)
    registered_mobile_masked = Column(String(32), nullable=False)
    upi_vpa = Column(String(128), nullable=True, index=True)
    device_id = Column(String(64), nullable=True, index=True)
    ip_address = Column(String(64), nullable=True)
    opened_date = Column(DateTime, default=datetime.datetime.utcnow)
    current_balance = Column(Float, default=0.0)
    status = Column(String(32), default=AccountStatus.ACTIVE.value)
    
    # Precomputed / cached risk metrics
    risk_score = Column(Integer, default=15)
    risk_tier = Column(String(32), default=RiskTier.LOW.value)
    key_indicators = Column(String(512), nullable=True)
    
    # Relationships
    outgoing_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.sender_account_id",
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    incoming_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.receiver_account_id",
        back_populates="receiver",
        cascade="all, delete-orphan"
    )
    cases = relationship("InvestigationCase", back_populates="target_account")
