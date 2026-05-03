import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.sql import func
from src.core.database import Base


class FunctionVersion(Base):
    __tablename__ = "function_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    function_id = Column(String, nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    name = Column(String)
    description = Column(String)
    system_prompt = Column(Text)
    user_template = Column(Text)
    change_note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
