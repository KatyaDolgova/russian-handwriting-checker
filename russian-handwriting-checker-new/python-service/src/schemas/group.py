from pydantic import BaseModel
from typing import Optional


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PupilGroupAssign(BaseModel):
    pupil_name: str
    group_id: Optional[str] = None
