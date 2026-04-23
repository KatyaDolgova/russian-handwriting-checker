from pydantic import BaseModel
from typing import List, Optional

class CheckRequest(BaseModel):
    text: str
    function_id: str

class SaveCheckRequest(BaseModel):
    filename: str
    original_text: str
    corrected_text: str
    errors: List[dict]
    score: float
    comment: str
    function_id: str
    pupil_name: Optional[str]