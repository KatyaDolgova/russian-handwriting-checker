from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from src.api.deps import get_db, get_current_user, get_optional_user_id
from src.repositories.function_repo import FunctionRepository
from src.schemas.function import FunctionCreate

router = APIRouter(prefix="/functions")


class VersionRequest(BaseModel):
    change_note: Optional[str] = None


@router.get("/")
async def list_functions(
    db=Depends(get_db),
    user_id: str | None = Depends(get_optional_user_id),
):
    return await FunctionRepository(db).list(user_id)


@router.post("/")
async def create_function(
    data: FunctionCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return await FunctionRepository(db).create(data, current_user["user_id"])


@router.put("/{function_id}")
async def update_function(
    function_id: str,
    data: FunctionCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    if obj.is_default:
        raise HTTPException(
            status_code=403, detail="Нельзя изменить стандартную функцию"
        )
    if obj.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403, detail="Нет прав на редактирование этой функции"
        )

    was_published = obj.is_published
    updated = await repo.update(function_id, data)

    if was_published:
        await repo.republish(function_id)

    return updated


@router.delete("/{function_id}")
async def delete_function(
    function_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    if obj.is_default:
        raise HTTPException(
            status_code=403, detail="Нельзя удалить стандартную функцию"
        )
    if obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Нет прав на удаление этой функции")
    await repo.delete(function_id)
    return {"success": True}


# Галерея


@router.get("/gallery")
async def gallery(
    search: str = Query(default=""),
    db=Depends(get_db),
    user_id: str | None = Depends(get_optional_user_id),
):
    return await FunctionRepository(db).list_gallery(user_id, search)


# Публикация


@router.post("/{function_id}/publish")
async def publish_function(
    function_id: str,
    body: VersionRequest = VersionRequest(),
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    if obj.is_default:
        raise HTTPException(
            status_code=403, detail="Нельзя публиковать стандартную функцию"
        )
    if obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Нет прав")
    return await repo.publish(function_id, body.change_note)


# Копирование из галереи


@router.post("/{function_id}/copy")
async def copy_function(
    function_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    if not obj.is_published:
        raise HTTPException(status_code=403, detail="Функция не опубликована")
    return await repo.copy(function_id, current_user["user_id"])


# История версий


@router.get("/{function_id}/versions")
async def function_versions(
    function_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    is_owner = obj.user_id == current_user["user_id"]
    if not is_owner and not obj.is_published:
        raise HTTPException(status_code=403, detail="Нет прав")
    return await repo.get_versions(function_id)


@router.post("/{function_id}/versions")
async def create_version(
    function_id: str,
    body: VersionRequest = VersionRequest(),
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    if obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Нет прав")
    return await repo.create_version(function_id, body.change_note)


@router.delete("/{function_id}/versions/{version_id}")
async def delete_version(
    function_id: str,
    version_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = FunctionRepository(db)
    obj = await repo.get(function_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Функция не найдена")
    if obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Нет прав")
    await repo.delete_version(version_id)
    return {"success": True}
