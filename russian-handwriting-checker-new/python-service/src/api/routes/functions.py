from fastapi import APIRouter, Depends, HTTPException
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


@router.put("/{function_id}")
async def update_function(function_id: str, data: FunctionCreate, db=Depends(get_db)):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    return await repo.update(function_id, data)


@router.delete("/{function_id}")
async def delete_function(function_id: str, db=Depends(get_db)):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    await repo.delete(function_id)
    return {"success": True}
