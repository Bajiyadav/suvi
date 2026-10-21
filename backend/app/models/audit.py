from sqlalchemy import Column, String, DateTime, Text
import datetime
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    actor = Column(String(128), default="Investigator Cyber Crime Unit")
    action = Column(String(64), nullable=False)
    target_entity = Column(String(128), nullable=False)
    details = Column(Text, nullable=True)
