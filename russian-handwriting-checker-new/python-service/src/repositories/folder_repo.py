from sqlalchemy import select
from src.models.folder import Folder


class FolderRepository:
    def __init__(self, db):
        self.db = db

    async def list(self, user_id: str) -> list[Folder]:
        res = await self.db.execute(
            select(Folder).where(Folder.user_id == user_id).order_by(Folder.created_at)
        )
        return res.scalars().all()

    async def create(self, user_id: str, name: str, description: str | None = None) -> Folder:
        obj = Folder(user_id=user_id, name=name, description=description)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get(self, folder_id: str) -> Folder | None:
        res = await self.db.execute(select(Folder).where(Folder.id == folder_id))
        return res.scalar_one_or_none()

    async def update(self, folder_id: str, name: str, description: str | None = None) -> Folder | None:
        obj = await self.get(folder_id)
        if not obj:
            return None
        obj.name = name
        obj.description = description
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete(self, folder_id: str) -> None:
        obj = await self.get(folder_id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()
