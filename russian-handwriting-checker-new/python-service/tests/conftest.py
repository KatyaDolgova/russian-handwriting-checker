"""
Общие фикстуры для всех тестов.
Используют SQLite in-memory вместо реальной БД.
Supabase-аутентификация заменяется stub-зависимостями.
"""
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Регистрируем все модели в Base.metadata до create_all
import src.models.folder            # noqa: F401
import src.models.group             # noqa: F401
import src.models.user_profile      # noqa: F401
import src.models.pupil             # noqa: F401
import src.models.function_version  # noqa: F401

from main import app
from src.core.database import Base
from src.api.deps import get_db, get_current_user, get_optional_user_id

# ── Тестовые пользователи ────────────────────────────────────────────────────

USER_1 = {"user_id": "user-1-uid", "email": "user1@test.com"}
USER_2 = {"user_id": "user-2-uid", "email": "user2@test.com"}


# ── Базовая фикстура клиента (аутентифицирован как USER_1) ───────────────────

@pytest_asyncio.fixture
async def client():
    """
    Поднимает SQLite in-memory БД, создаёт таблицы, переопределяет
    зависимости FastAPI и возвращает AsyncClient.
    После теста — очищает overrides и закрывает engine.
    """
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
    app.dependency_overrides[get_current_user] = lambda: USER_1
    app.dependency_overrides[get_optional_user_id] = lambda: USER_1["user_id"]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c

    app.dependency_overrides.clear()
    await engine.dispose()


# ── Вспомогательная фикстура: переключение на другого пользователя ────────────

@pytest_asyncio.fixture
async def client_user2(client):
    """
    Тот же client и та же БД, но аутентифицирован как USER_2.
    Используй в тестах, где нужно проверить права доступа.
    """
    app.dependency_overrides[get_current_user] = lambda: USER_2
    app.dependency_overrides[get_optional_user_id] = lambda: USER_2["user_id"]
    yield client
    # Восстанавливаем USER_1 (для последующих шагов, если нужно)
    app.dependency_overrides[get_current_user] = lambda: USER_1
    app.dependency_overrides[get_optional_user_id] = lambda: USER_1["user_id"]


# ── Вспомогательный контекст-менеджер для временной смены пользователя ───────

def as_user(user: dict):
    """
    Использование: async with as_user(USER_2): ...
    Позволяет сменить аутентификацию внутри одного теста.
    """
    class _Ctx:
        def __enter__(self):
            app.dependency_overrides[get_current_user] = lambda: user
            app.dependency_overrides[get_optional_user_id] = lambda: user["user_id"]
            return self

        def __exit__(self, *_):
            app.dependency_overrides[get_current_user] = lambda: USER_1
            app.dependency_overrides[get_optional_user_id] = lambda: USER_1["user_id"]

    return _Ctx()


# ── Фабрики тестовых данных ──────────────────────────────────────────────────

FUNCTION_PAYLOAD = {
    "name": "Тест функция",
    "description": "Описание",
    "system_prompt": "Ты учитель. Верни JSON.",
    "user_template": "Проверь:\n\n{text}",
}
