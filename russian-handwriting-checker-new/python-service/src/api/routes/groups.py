from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_db, get_current_user
from src.repositories.group_repo import GroupRepository
from src.schemas.group import GroupCreate, StudentGroupAssign

router = APIRouter(prefix="/groups")


@router.get("/")
async def list_groups(db=Depends(get_db), current_user=Depends(get_current_user)):
    return await GroupRepository(db).list_groups(current_user["user_id"])


@router.post("/")
async def create_group(
    data: GroupCreate, db=Depends(get_db), current_user=Depends(get_current_user)
):
    return await GroupRepository(db).create_group(current_user["user_id"], data.name)


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
    return await repo.update_group(group_id, data.name)


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


@router.get("/students")
async def get_student_groups(
    db=Depends(get_db), current_user=Depends(get_current_user)
):
    return await GroupRepository(db).get_student_groups(current_user["user_id"])


@router.post("/students/assign")
async def assign_student(
    data: StudentGroupAssign,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await GroupRepository(db).set_student_group(
        current_user["user_id"], data.student_id, data.group_id
    )
    return {"success": True}
