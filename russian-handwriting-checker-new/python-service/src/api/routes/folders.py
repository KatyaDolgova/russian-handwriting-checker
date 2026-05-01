from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_db, get_current_user
from src.repositories.folder_repo import FolderRepository
from src.schemas.folder import FolderCreate

router = APIRouter(prefix="/folders")


@router.get("/")
async def list_folders(db=Depends(get_db), current_user=Depends(get_current_user)):
    return await FolderRepository(db).list(current_user["user_id"])


@router.post("/")
async def create_folder(data: FolderCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return await FolderRepository(db).create(current_user["user_id"], data.name, data.description)


@router.put("/{folder_id}")
async def update_folder(
    folder_id: str,
    data: FolderCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = FolderRepository(db)
    obj = await repo.get(folder_id)
    if not obj or obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Папка не найдена")
    return await repo.update(folder_id, data.name, data.description)


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = FolderRepository(db)
    obj = await repo.get(folder_id)
    if not obj or obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Папка не найдена")
    await repo.delete(folder_id)
    return {"success": True}
