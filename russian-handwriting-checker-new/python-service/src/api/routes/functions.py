from fastapi import APIRouter, Depends
from src.api.deps import get_db
from src.repositories.function_repo import FunctionRepository
from src.schemas.function import FunctionCreate

router = APIRouter(prefix="/functions")

@router.get("/")
async def list_functions(db=Depends(get_db)):
    return await FunctionRepository(db).list()

@router.post("/")
async def create_function(data: FunctionCreate, db=Depends(get_db)):
    return await FunctionRepository(db).create(data)