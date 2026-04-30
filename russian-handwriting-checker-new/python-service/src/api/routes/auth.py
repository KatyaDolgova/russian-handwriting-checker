from fastapi import APIRouter, Depends, HTTPException
from src.core.supabase_client import supabase
from src.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from src.api.deps import get_current_user

router = APIRouter(prefix="/auth")


def _require_supabase():
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase не настроен. Добавьте SUPABASE_URL и SUPABASE_ANON_KEY в .env"
        )


@router.post("/register")
async def register(data: RegisterRequest):
    _require_supabase()
    try:
        res = supabase.auth.sign_up({"email": data.email, "password": data.password})
        if not res.user:
            raise HTTPException(status_code=400, detail="Не удалось зарегистрировать пользователя")

        # Если email-подтверждение включено — session будет None
        if not res.session:
            return {
                "message": "Регистрация прошла успешно. Проверьте почту и подтвердите email.",
                "user_id": str(res.user.id),
                "email": res.user.email,
                "access_token": None,
            }

        return TokenResponse(
            access_token=res.session.access_token,
            user_id=str(res.user.id),
            email=res.user.email,
        )
    except HTTPException:
        raise
    except Exception as e:
        msg = getattr(e, "message", None) or str(e)
        raise HTTPException(status_code=400, detail=msg)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    _require_supabase()
    try:
        res = supabase.auth.sign_in_with_password({"email": data.email, "password": data.password})
        if not res.user or not res.session:
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        return TokenResponse(
            access_token=res.session.access_token,
            user_id=str(res.user.id),
            email=res.user.email,
        )
    except HTTPException:
        raise
    except Exception as e:
        msg = getattr(e, "message", None) or str(e)
        raise HTTPException(status_code=401, detail=msg)


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user
