from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FunctionCreate(BaseModel):
    name: str
    description: str
    system_prompt: str
    user_template: str


class FunctionOut(FunctionCreate):
    id: str
    user_id: Optional[str] = None
    is_default: bool = False
    is_published: bool = False
    original_function_id: Optional[str] = None


class GalleryFunctionOut(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    user_template: str
    author_display_name: str
    author_user_id: Optional[str]
    version_number: int
    is_published: bool


class FunctionVersionOut(BaseModel):
    id: str
    function_id: str
    version_number: int
    name: str
    description: str
    system_prompt: str
    user_template: str
    change_note: Optional[str]
    created_at: datetime
