from __future__ import annotations

import uuid
from sqlalchemy import select, func as sa_func, or_
from src.models.function import Function
from src.models.function_version import FunctionVersion
from src.models.user_profile import UserProfile
from src.schemas.function import FunctionCreate


class FunctionRepository:
    def __init__(self, db):
        self.db = db

    async def list(self, user_id: str | None = None) -> list[Function]:
        q = select(Function).where(
            or_(Function.is_default == True, Function.user_id == user_id)  # noqa: E712
        )
        res = await self.db.execute(q)
        return res.scalars().all()

    async def get(self, function_id: str) -> Function | None:
        res = await self.db.execute(
            select(Function).where(Function.id == function_id)
        )
        return res.scalar_one_or_none()

    async def create(self, data: FunctionCreate, user_id: str | None = None) -> Function:
        obj = Function(id=str(uuid.uuid4()), user_id=user_id, **data.model_dump())
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

    # ── Галерея ──────────────────────────────────────────────────────────────

    async def list_gallery(self, user_id: str | None = None, search: str = "") -> list[dict]:
        max_ver_subq = (
            select(
                FunctionVersion.function_id,
                sa_func.max(FunctionVersion.version_number).label("max_ver"),
            )
            .group_by(FunctionVersion.function_id)
            .subquery()
        )

        q = (
            select(Function, UserProfile.display_name, max_ver_subq.c.max_ver)
            .outerjoin(UserProfile, UserProfile.user_id == Function.user_id)
            .outerjoin(max_ver_subq, max_ver_subq.c.function_id == Function.id)
            .where(Function.is_published == True)  # noqa: E712
        )
        if user_id:
            q = q.where(Function.user_id != user_id)
        if search:
            q = q.where(
                or_(
                    Function.name.ilike(f"%{search}%"),
                    Function.description.ilike(f"%{search}%"),
                    UserProfile.display_name.ilike(f"%{search}%"),
                )
            )
        q = q.order_by(Function.name)

        result = await self.db.execute(q)
        rows = result.all()
        return [
            {
                "id": fn.id,
                "name": fn.name,
                "description": fn.description,
                "system_prompt": fn.system_prompt,
                "user_template": fn.user_template or "",
                "author_display_name": display_name or "Аноним",
                "author_user_id": fn.user_id,
                "version_number": max_ver or 1,
                "is_published": fn.is_published,
            }
            for fn, display_name, max_ver in rows
        ]

    # ── Публикация ────────────────────────────────────────────────────────────

    async def publish(self, function_id: str, change_note: str | None = None) -> Function:
        obj = await self.get(function_id)
        obj.is_published = not obj.is_published

        if obj.is_published:
            max_ver_result = await self.db.execute(
                select(sa_func.max(FunctionVersion.version_number))
                .where(FunctionVersion.function_id == function_id)
            )
            max_ver = max_ver_result.scalar() or 0
            ver = FunctionVersion(
                id=str(uuid.uuid4()),
                function_id=function_id,
                version_number=max_ver + 1,
                name=obj.name,
                description=obj.description,
                system_prompt=obj.system_prompt,
                user_template=obj.user_template or "",
                change_note=change_note,
            )
            self.db.add(ver)

        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def republish(self, function_id: str, change_note: str | None = None) -> Function:
        """Публикует новую версию уже опубликованной функции после её редактирования."""
        obj = await self.get(function_id)
        if not obj.is_published:
            return obj

        max_ver_result = await self.db.execute(
            select(sa_func.max(FunctionVersion.version_number))
            .where(FunctionVersion.function_id == function_id)
        )
        max_ver = max_ver_result.scalar() or 0
        ver = FunctionVersion(
            id=str(uuid.uuid4()),
            function_id=function_id,
            version_number=max_ver + 1,
            name=obj.name,
            description=obj.description,
            system_prompt=obj.system_prompt,
            user_template=obj.user_template or "",
            change_note=change_note,
        )
        self.db.add(ver)
        await self.db.commit()
        return obj

    # ── Копирование ───────────────────────────────────────────────────────────

    async def copy(self, function_id: str, user_id: str) -> Function:
        src = await self.get(function_id)
        copied = Function(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=src.name,
            description=src.description,
            system_prompt=src.system_prompt,
            user_template=src.user_template,
            is_default=False,
            is_published=False,
            original_function_id=function_id,
        )
        self.db.add(copied)
        await self.db.commit()
        await self.db.refresh(copied)
        return copied

    # ── Версии ────────────────────────────────────────────────────────────────

    async def get_versions(self, function_id: str) -> list[FunctionVersion]:
        result = await self.db.execute(
            select(FunctionVersion)
            .where(FunctionVersion.function_id == function_id)
            .order_by(FunctionVersion.version_number.desc())
        )
        return result.scalars().all()
