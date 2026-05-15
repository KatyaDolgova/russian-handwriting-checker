from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class CheckRequest(BaseModel):
    text: str
    function_id: str


class SaveCheckRequest(BaseModel):
    filename: str
    title: Optional[str] = None
    source_text: Optional[str] = None
    original_text: str
    corrected_text: str
    errors: Optional[List[dict]] = []
    criteria: Optional[dict] = None
    pass_fail: Optional[str] = None
    score: Optional[float] = None
    score_max: Optional[float] = None
    comment: str
    function_id: str
    folder_id: Optional[str] = None
    student_id: Optional[str] = None
    work_date: Optional[datetime] = None


class UpdateCheckRequest(BaseModel):
    pass_fail: Optional[str] = None
    score: Optional[float] = None
    score_max: Optional[float] = None
    comment: Optional[str] = None
    corrected_text: Optional[str] = None
    student_id: Optional[str] = None
    work_date: Optional[datetime] = None
    folder_id: Optional[str] = None
