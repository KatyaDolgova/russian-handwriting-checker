from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class CheckRequest(BaseModel):
    text: str
    function_id: str


class SaveCheckRequest(BaseModel):
    filename: str
    original_text: str
    corrected_text: str
    errors: Optional[List[dict]] = []
    score: float
    score_max: float = 100.0
    comment: str
    function_id: str
    folder_id: Optional[str] = None
    pupil_name: Optional[str] = None
    work_date: Optional[datetime] = None


class UpdateCheckRequest(BaseModel):
    score: Optional[float] = None
    score_max: Optional[float] = None
    comment: Optional[str] = None
    corrected_text: Optional[str] = None
    pupil_name: Optional[str] = None
    work_date: Optional[datetime] = None
