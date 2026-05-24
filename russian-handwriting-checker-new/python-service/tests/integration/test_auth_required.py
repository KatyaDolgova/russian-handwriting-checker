"""
Интеграционные тесты: защита эндпоинтов авторизацией.
Проверяют, что запросы без токена возвращают 401.
"""
import pytest
import pytest_asyncio
from fastapi import HTTPException
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

import src.models.folder            # noqa: F401
import src.models.group             # noqa: F401
import src.models.user_profile      # noqa: F401
import src.models.student           # noqa: F401
import src.models.function_version  # noqa: F401

from main import app
from src.core.database import Base
from src.api.deps import get_db, get_current_user, get_optional_user_id


def _raise_401():
    raise HTTPException(status_code=401, detail="Требуется авторизация")


@pytest_asyncio.fixture
async def anon_client():
    """Клиент без авторизации: get_current_user выбрасывает 401."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def override_db():
        async with Session() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = _raise_401
    app.dependency_overrides[get_optional_user_id] = lambda: None

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c

    app.dependency_overrides.clear()
    await engine.dispose()


FUNCTION_PAYLOAD = {
    "name": "Тест",
    "description": "Описание",
    "system_prompt": "Ты учитель.",
    "user_template": "Проверь:\n\n{text}",
}


class TestCheckAuthRequired:
    async def test_history_requires_auth(self, anon_client):
        r = await anon_client.get("/api/check/history")
        assert r.status_code == 401

    async def test_update_check_requires_auth(self, anon_client):
        r = await anon_client.put("/api/check/some-id", json={"comment": "новый"})
        assert r.status_code == 401

    async def test_delete_check_requires_auth(self, anon_client):
        r = await anon_client.delete("/api/check/some-id")
        assert r.status_code == 401


class TestFunctionsAuthRequired:
    async def test_create_function_requires_auth(self, anon_client):
        r = await anon_client.post("/api/functions/", json=FUNCTION_PAYLOAD)
        assert r.status_code == 401

    async def test_update_function_requires_auth(self, anon_client):
        r = await anon_client.put("/api/functions/some-id", json=FUNCTION_PAYLOAD)
        assert r.status_code == 401

    async def test_delete_function_requires_auth(self, anon_client):
        r = await anon_client.delete("/api/functions/some-id")
        assert r.status_code == 401

    async def test_publish_function_requires_auth(self, anon_client):
        r = await anon_client.post("/api/functions/some-id/publish")
        assert r.status_code == 401

    async def test_copy_function_requires_auth(self, anon_client):
        r = await anon_client.post("/api/functions/some-id/copy")
        assert r.status_code == 401

    async def test_list_functions_accessible_without_auth(self, anon_client):
        """GET /functions/ использует get_optional_user_id — доступен анонимно."""
        r = await anon_client.get("/api/functions/")
        assert r.status_code == 200
