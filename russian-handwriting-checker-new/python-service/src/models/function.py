import uuid
from sqlalchemy import Column, String, Text, Boolean
from src.core.database import Base


class Function(Base):
    __tablename__ = "functions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True, index=True)
    name = Column(String)
    description = Column(String)
    system_prompt = Column(Text)
    user_template = Column(Text)
    is_default = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    original_function_id = Column(String, nullable=True)