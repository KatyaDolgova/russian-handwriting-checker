import uuid
from sqlalchemy import Column, String, Float, Text, JSON, DateTime
from sqlalchemy.sql import func
from src.core.database import Base


class Check(Base):
    __tablename__ = "checks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True, index=True)
    filename = Column(String)
    original_text = Column(Text)
    corrected_text = Column(Text)
    errors = Column(JSON, nullable=True)
    score = Column(Float)
    score_max = Column(Float, nullable=False, server_default='100', default=100.0)
    comment = Column(Text)
    pupil_name = Column(String, nullable=True)
    function_id = Column(String)
    folder_id = Column(String, nullable=True)
    work_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
