from pydantic import BaseModel
from typing import Optional


class FolderCreate(BaseModel):
    name: str
    description: Optional[str] = None
