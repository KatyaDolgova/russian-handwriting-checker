import uuid
from sqlalchemy import Column, String, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from src.core.database import Base


class Pupil(Base):
    __tablename__ = "pupils"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_user_pupil"),)
