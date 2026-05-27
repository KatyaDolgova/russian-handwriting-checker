from sqlalchemy import select, delete as sql_delete
from src.models.group import Group, StudentGroup
from src.models.student import Student


class GroupRepository:
    def __init__(self, db):
        self.db = db

    async def list_groups(self, user_id: str) -> list[Group]:
        res = await self.db.execute(
            select(Group).where(Group.user_id == user_id).order_by(Group.created_at)
        )
        return res.scalars().all()

    async def create_group(self, user_id: str, name: str) -> Group:
        obj = Group(user_id=user_id, name=name)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get_group(self, group_id: str) -> Group | None:
        res = await self.db.execute(select(Group).where(Group.id == group_id))
        return res.scalar_one_or_none()

    async def update_group(self, group_id: str, name: str) -> Group | None:
        obj = await self.get_group(group_id)
        if not obj:
            return None
        obj.name = name
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete_group(self, group_id: str) -> None:
        await self.db.execute(
            sql_delete(StudentGroup).where(StudentGroup.group_id == group_id)
        )
        obj = await self.get_group(group_id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()

    async def get_student_groups(self, user_id: str) -> list[dict]:
        res = await self.db.execute(
            select(StudentGroup, Student.name.label("student_name"))
            .join(Student, StudentGroup.student_id == Student.id)
            .where(StudentGroup.user_id == user_id)
        )
        rows = res.all()
        return [
            {"student_id": sg.student_id, "student_name": name, "group_id": sg.group_id}
            for sg, name in rows
        ]

    async def set_student_group(
        self, user_id: str, student_id: str, group_id: str | None
    ) -> None:
        await self.db.execute(
            sql_delete(StudentGroup).where(
                StudentGroup.user_id == user_id,
                StudentGroup.student_id == student_id,
            )
        )
        if group_id:
            self.db.add(
                StudentGroup(user_id=user_id, student_id=student_id, group_id=group_id)
            )
        await self.db.commit()
