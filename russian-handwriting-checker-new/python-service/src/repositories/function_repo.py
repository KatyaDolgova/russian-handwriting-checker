from sqlalchemy import select
from src.models.function import Function

class FunctionRepository:
    def __init__(self, db):
        self.db = db

    async def list(self):
        res = await self.db.execute(select(Function))
        return res.scalars().all()

    async def get(self, function_id: bytes):
        res = await self.db.execute(
            select(Function).where(Function.id == function_id)
        )
        return res.scalar_one_or_none()

    async def create(self, data):
        obj = Function(**data.dict())
        self.db.add(obj)
        await self.db.commit()
        return obj