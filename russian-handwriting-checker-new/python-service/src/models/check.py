import uuid
from sqlalchemy import Column, String, Float, Text
from src.core.database import Base



class Check(Base):
    __tablename__ = "checks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    filename = Column(String)
    original_text = Column(Text)
    corrected_text = Column(Text)
    score = Column(Float)
    comment = Column(Text)
    pupil_name = Column(String)
    function_id = Column(String)# ✅ тоже строка