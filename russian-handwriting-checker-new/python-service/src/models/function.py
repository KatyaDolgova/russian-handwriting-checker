import uuid
from sqlalchemy import Column, String, Text, Boolean
from src.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())  # ✅ строка

class Function(Base):
    __tablename__ = "functions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    description = Column(String)
    system_prompt = Column(Text)
    user_template = Column(Text)
    is_default = Column(Boolean, default=False)