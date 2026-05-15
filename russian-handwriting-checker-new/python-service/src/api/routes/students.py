import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from src.api.deps import get_db, get_current_user
from src.models.student import Student

router = APIRouter(prefix="/students")


class CreateStudentRequest(BaseModel):
    name: str


@router.get("/")
async def list_students(db=Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        select(Student)
        .where(Student.user_id == current_user["user_id"])
        .order_by(Student.name)
    )
    students = result.scalars().all()
    return [{"id": s.id, "name": s.name} for s in students]


@router.post("/")
async def create_student(
    data: CreateStudentRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Имя не может быть пустым")

    result = await db.execute(
        select(Student).where(
            Student.user_id == current_user["user_id"],
            Student.name == name,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"id": existing.id, "name": existing.name}

    s = Student(id=str(uuid.uuid4()), user_id=current_user["user_id"], name=name)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"id": s.id, "name": s.name}


@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.user_id == current_user["user_id"],
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Ученик не найден")
    await db.delete(s)
    await db.commit()
    return {"success": True}
