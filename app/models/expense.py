from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vendor = Column(String(255), nullable=True)
    total = Column(Float, nullable=True)
    date = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
