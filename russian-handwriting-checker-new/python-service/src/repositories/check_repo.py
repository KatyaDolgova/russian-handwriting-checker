from src.models.check import Check

class CheckRepository:
    def __init__(self, db):
        self.db = db

    async def create(self, data):
        obj = Check(**data)
        self.db.add(obj)
        await self.db.commit()
        return obj