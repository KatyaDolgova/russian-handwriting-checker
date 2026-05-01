from sqlalchemy import select
from src.models.user_profile import UserProfile


class UserProfileRepository:
    def __init__(self, db):
        self.db = db

    async def get(self, user_id: str) -> UserProfile | None:
        res = await self.db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        return res.scalar_one_or_none()

    async def upsert(self, user_id: str, data: dict) -> UserProfile:
        obj = await self.get(user_id)
        if obj is None:
            obj = UserProfile(user_id=user_id, **data)
            self.db.add(obj)
        else:
            for key, value in data.items():
                setattr(obj, key, value)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
