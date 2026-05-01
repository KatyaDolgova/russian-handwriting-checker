from sqlalchemy import select
from src.models.check import Check


class CheckRepository:
    def __init__(self, db):
        self.db = db

    async def create(self, data: dict) -> Check:
        obj = Check(**data)
        self.db.add(obj)
        await self.db.commit()
        return obj

    async def get(self, check_id: str) -> Check | None:
        res = await self.db.execute(select(Check).where(Check.id == check_id))
        return res.scalar_one_or_none()

    async def get_by_user(self, user_id: str) -> list[Check]:
        res = await self.db.execute(
            select(Check)
            .where(Check.user_id == user_id)
            .order_by(Check.created_at.desc())
        )
        return res.scalars().all()

    async def update(self, check_id: str, data: dict) -> Check | None:
        obj = await self.get(check_id)
        if not obj:
            return None
        for key, value in data.items():
            if value is not None:
                setattr(obj, key, value)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete(self, check_id: str) -> None:
        obj = await self.get(check_id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()
