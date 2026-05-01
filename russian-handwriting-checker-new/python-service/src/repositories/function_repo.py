from sqlalchemy import select
from src.models.function import Function
from src.schemas.function import FunctionCreate


class FunctionRepository:
    def __init__(self, db):
        self.db = db

    async def list(self) -> list[Function]:
        res = await self.db.execute(select(Function))
        return res.scalars().all()

    async def get(self, function_id: str) -> Function | None:
        res = await self.db.execute(
            select(Function).where(Function.id == function_id)
        )
        return res.scalar_one_or_none()

    async def create(self, data: FunctionCreate) -> Function:
        import uuid
        obj = Function(id=str(uuid.uuid4()), **data.model_dump())
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update(self, function_id: str, data: FunctionCreate) -> Function:
        obj = await self.get(function_id)
        for field, value in data.model_dump().items():
            setattr(obj, field, value)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete(self, function_id: str) -> None:
        obj = await self.get(function_id)
        await self.db.delete(obj)
        await self.db.commit()
