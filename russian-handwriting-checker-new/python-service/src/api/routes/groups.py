from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_db, get_current_user
from src.repositories.group_repo import GroupRepository
from src.schemas.group import GroupCreate, PupilGroupAssign

router = APIRouter(prefix="/groups")


@router.get("/")
async def list_groups(db=Depends(get_db), current_user=Depends(get_current_user)):
    return await GroupRepository(db).list_groups(current_user["user_id"])


@router.post("/")
async def create_group(data: GroupCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return await GroupRepository(db).create_group(current_user["user_id"], data.name, data.description)


@router.put("/{group_id}")
async def update_group(
    group_id: str,
    data: GroupCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = GroupRepository(db)
    obj = await repo.get_group(group_id)
    if not obj or obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return await repo.update_group(group_id, data.name, data.description)


@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = GroupRepository(db)
    obj = await repo.get_group(group_id)
    if not obj or obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    await repo.delete_group(group_id)
    return {"success": True}


@router.get("/pupils")
async def get_pupil_groups(db=Depends(get_db), current_user=Depends(get_current_user)):
    items = await GroupRepository(db).get_pupil_groups(current_user["user_id"])
    return [{"pupil_name": a.pupil_name, "group_id": a.group_id} for a in items]


@router.post("/pupils/assign")
async def assign_pupil(
    data: PupilGroupAssign,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await GroupRepository(db).set_pupil_group(
        current_user["user_id"], data.pupil_name, data.group_id
    )
    return {"success": True}
