import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from src.api.deps import get_db, get_current_user
from src.models.pupil import Pupil

router = APIRouter(prefix="/pupils")


class CreatePupilRequest(BaseModel):
    name: str


@router.get("/")
async def list_pupils(db=Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        select(Pupil)
        .where(Pupil.user_id == current_user["user_id"])
        .order_by(Pupil.name)
    )
    pupils = result.scalars().all()
    return [{"id": p.id, "name": p.name} for p in pupils]


@router.post("/")
async def create_pupil(
    data: CreatePupilRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Имя не может быть пустым")

    result = await db.execute(
        select(Pupil).where(
            Pupil.user_id == current_user["user_id"],
            Pupil.name == name,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"id": existing.id, "name": existing.name}

    p = Pupil(id=str(uuid.uuid4()), user_id=current_user["user_id"], name=name)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return {"id": p.id, "name": p.name}


@router.delete("/{pupil_id}")
async def delete_pupil(
    pupil_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Pupil).where(
            Pupil.id == pupil_id,
            Pupil.user_id == current_user["user_id"],
        )
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Ученик не найден")
    await db.delete(p)
    await db.commit()
    return {"success": True}
