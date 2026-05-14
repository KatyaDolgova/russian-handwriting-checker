from sqlalchemy import select, delete as sql_delete
from src.models.group import Group, PupilGroup
from src.models.pupil import Pupil


class GroupRepository:
    def __init__(self, db):
        self.db = db

    async def list_groups(self, user_id: str) -> list[Group]:
        res = await self.db.execute(
            select(Group).where(Group.user_id == user_id).order_by(Group.created_at)
        )
        return res.scalars().all()

    async def create_group(self, user_id: str, name: str, description: str | None = None) -> Group:
        obj = Group(user_id=user_id, name=name, description=description)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get_group(self, group_id: str) -> Group | None:
        res = await self.db.execute(select(Group).where(Group.id == group_id))
        return res.scalar_one_or_none()

    async def update_group(self, group_id: str, name: str, description: str | None = None) -> Group | None:
        obj = await self.get_group(group_id)
        if not obj:
            return None
        obj.name = name
        obj.description = description
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete_group(self, group_id: str) -> None:
        await self.db.execute(sql_delete(PupilGroup).where(PupilGroup.group_id == group_id))
        obj = await self.get_group(group_id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()

    async def get_pupil_groups(self, user_id: str) -> list[dict]:
        res = await self.db.execute(
            select(PupilGroup, Pupil.name.label("pupil_name"))
            .join(Pupil, PupilGroup.pupil_id == Pupil.id)
            .where(PupilGroup.user_id == user_id)
        )
        rows = res.all()
        return [
            {"pupil_id": pg.pupil_id, "pupil_name": name, "group_id": pg.group_id}
            for pg, name in rows
        ]

    async def set_pupil_group(self, user_id: str, pupil_id: str, group_id: str | None) -> None:
        await self.db.execute(
            sql_delete(PupilGroup).where(
                PupilGroup.user_id == user_id,
                PupilGroup.pupil_id == pupil_id,
            )
        )
        if group_id:
            self.db.add(PupilGroup(user_id=user_id, pupil_id=pupil_id, group_id=group_id))
        await self.db.commit()
