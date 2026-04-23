from pydantic import BaseModel

class FunctionCreate(BaseModel):
    name: str
    description: str
    system_prompt: str
    user_template: str

class FunctionOut(FunctionCreate):
    id: str