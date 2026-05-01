import asyncio
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.database import SessionLocal
from src.core.supabase_client import supabase
from src.core.logger import get_logger

security = HTTPBearer(auto_error=False)
logger = get_logger(__name__)


async def get_db():
    async with SessionLocal() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase не настроен")
    try:
        response = await asyncio.to_thread(supabase.auth.get_user, credentials.credentials)
        if not response.user:
            raise HTTPException(status_code=401, detail="Недействительный токен")
        return {"user_id": str(response.user.id), "email": response.user.email}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Auth validation failed: {e}")
        raise HTTPException(status_code=401, detail="Недействительный или просроченный токен")


async def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str | None:
    """Возвращает user_id если токен валидный, иначе None (не бросает ошибку)."""
    if not credentials or supabase is None:
        return None
    try:
        response = await asyncio.to_thread(supabase.auth.get_user, credentials.credentials)
        return str(response.user.id) if response.user else None
    except Exception:
        return None
