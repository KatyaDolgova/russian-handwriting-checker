from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from src.core.config import settings

# Supabase Transaction pooler (PgBouncer) не поддерживает prepared statements.
# Нужно отключить кеш на уровне asyncpg через statement_cache_size=0.
_is_pooler = "pooler.supabase.com" in settings.database_url

engine = create_async_engine(
    settings.database_url,
    connect_args={"statement_cache_size": 0} if _is_pooler else {},
    pool_pre_ping=True,   # проверяет соединение перед использованием
    pool_recycle=280,     # пересоздаёт соединение каждые ~4.5 мин (до таймаута Supabase)
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

Base = declarative_base()
