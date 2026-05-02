from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, distinct

from src.core.supabase_client import supabase
from src.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    UpdateProfileRequest, ChangePasswordRequest,
)
from src.api.deps import get_db, get_current_user
from src.repositories.user_profile_repo import UserProfileRepository
from src.models.check import Check
from src.models.folder import Folder
from src.models.group import Group

router = APIRouter(prefix="/auth")


def _require_supabase():
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase не настроен. Добавьте SUPABASE_URL и SUPABASE_ANON_KEY в .env"
        )


def _rank(total: int) -> dict:
    if total < 5:
        return {"label": "Новичок", "color": "slate"}
    if total < 20:
        return {"label": "Начинающий", "color": "blue"}
    if total < 50:
        return {"label": "Опытный учитель", "color": "indigo"}
    if total < 100:
        return {"label": "Мастер", "color": "violet"}
    return {"label": "Эксперт", "color": "amber"}


@router.post("/register")
async def register(data: RegisterRequest):
    _require_supabase()
    try:
        res = supabase.auth.sign_up({"email": data.email, "password": data.password})
        if not res.user:
            raise HTTPException(status_code=400, detail="Не удалось зарегистрировать пользователя")
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
        raise HTTPException(status_code=400, detail=getattr(e, "message", None) or str(e))


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
        raise HTTPException(status_code=401, detail=getattr(e, "message", None) or str(e))


@router.get("/me")
async def me(
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]

    profile = await UserProfileRepository(db).get(user_id)

    total_q = await db.execute(select(func.count(Check.id)).where(Check.user_id == user_id))
    total_checks = total_q.scalar() or 0

    students_q = await db.execute(
        select(func.count(distinct(Check.pupil_name)))
        .where(Check.user_id == user_id)
        .where(Check.pupil_name.isnot(None))
        .where(Check.pupil_name != "")
    )
    unique_students = students_q.scalar() or 0

    scores_q = await db.execute(
        select(func.sum(Check.score), func.sum(Check.score_max))
        .where(Check.user_id == user_id)
    )
    total_score, total_max = scores_q.one()
    avg_pct = round((total_score or 0) / total_max * 100) if total_max else 0

    dates_q = await db.execute(select(Check.created_at).where(Check.user_id == user_id))
    dates = dates_q.scalars().all()
    month_counts = Counter(d.strftime("%Y-%m") for d in dates if d)
    most_active_month = max(month_counts, key=month_counts.get) if month_counts else None

    folders_q = await db.execute(select(func.count(Folder.id)).where(Folder.user_id == user_id))
    total_folders = folders_q.scalar() or 0

    groups_q = await db.execute(select(func.count(Group.id)).where(Group.user_id == user_id))
    total_groups = groups_q.scalar() or 0

    return {
        **current_user,
        "display_name": profile.display_name if profile else None,
        "bio": profile.bio if profile else None,
        "stats": {
            "total_checks": total_checks,
            "unique_students": unique_students,
            "avg_pct": avg_pct,
            "most_active_month": most_active_month,
            "total_folders": total_folders,
            "total_groups": total_groups,
        },
        "rank": _rank(total_checks),
    }


@router.put("/profile")
async def update_profile(
    data: UpdateProfileRequest,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Нет данных для обновления")
    profile = await UserProfileRepository(db).upsert(current_user["user_id"], updates)
    return {"success": True, "display_name": profile.display_name, "bio": profile.bio}


@router.post("/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    _require_supabase()
    try:
        from supabase import create_client
        from src.core.config import settings
        fresh = create_client(settings.supabase_url, settings.supabase_anon_key)
        sign_in = fresh.auth.sign_in_with_password(
            {"email": current_user["email"], "password": data.current_password}
        )
        if not sign_in.session:
            raise HTTPException(status_code=401, detail="Неверный текущий пароль")
        fresh.auth.update_user({"password": data.new_password})
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=getattr(e, "message", None) or str(e))
