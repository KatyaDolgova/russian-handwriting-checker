import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from src.core.database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StudentGroup(Base):
    __tablename__ = "student_groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    student_id = Column(String, nullable=False)
    group_id = Column(String, nullable=False)
