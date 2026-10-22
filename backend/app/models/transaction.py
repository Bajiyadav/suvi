from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import datetime
import enum
from app.core.database import Base

class PaymentChannel(str, enum.Enum):
    UPI = "UPI"
    IMPS = "IMPS"
    NEFT = "NEFT"
    RTGS = "RTGS"
    ATM_CASH = "ATM_CASH"
    POS = "POS"

class TransactionStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    PENDING = "PENDING"
    REVERSED = "REVERSED"
    FAILED = "FAILED"

class PatternTag(str, enum.Enum):
    NORMAL = "NORMAL"
    RAPID_TRANSFER = "RAPID_TRANSFER"
    LAYERING = "LAYERING"
    STRUCTURING = "STRUCTURING"
    ROUND_TRIP = "ROUND_TRIP"

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(64), primary_key=True, index=True)
    sender_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    receiver_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    channel = Column(String(32), default=PaymentChannel.UPI.value)
    narrative = Column(String(256), nullable=True)
    status = Column(String(32), default=TransactionStatus.SUCCESS.value)
    pattern_tag = Column(String(32), default=PatternTag.NORMAL.value)
    device_id = Column(String(64), nullable=True, index=True)
    ip_address = Column(String(64), nullable=True)
    location = Column(String(128), default="Bengaluru, KA")

    # Relationships
    sender = relationship("Account", foreign_keys=[sender_account_id], back_populates="outgoing_transactions")
    receiver = relationship("Account", foreign_keys=[receiver_account_id], back_populates="incoming_transactions")
