import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from src.api.deps import get_db, get_current_user, get_optional_user_id
from src.repositories.function_repo import FunctionRepository
from src.repositories.check_repo import CheckRepository
from src.services.check_service import CheckService
from src.services.llm_service import LLMService
from src.schemas.check import CheckRequest, SaveCheckRequest, UpdateCheckRequest
from src.core.logger import get_logger

router = APIRouter(prefix="/check")
logger = get_logger(__name__)


def _make_service(db) -> CheckService:
    return CheckService(LLMService(), FunctionRepository(db))


@router.post("/")
async def run_check(request: CheckRequest, db=Depends(get_db)):
    service = _make_service(db)
    return await service.run_check(request.text, request.function_id)


@router.post("/stream")
async def stream_check(request: CheckRequest, db=Depends(get_db)):
    service = _make_service(db)

    async def generate():
        try:
            async for event in service.stream_check(request.text, request.function_id):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/save")
async def save(
    request: SaveCheckRequest,
    db=Depends(get_db),
    user_id: str | None = Depends(get_optional_user_id),
):
    repo = CheckRepository(db)
    obj = await repo.create({
        "filename": request.filename,
        "original_text": request.original_text,
        "corrected_text": request.corrected_text,
        "errors": request.errors,
        "score": request.score,
        "score_max": request.score_max,
        "comment": request.comment,
        "pupil_name": request.pupil_name,
        "function_id": request.function_id,
        "folder_id": request.folder_id,
        "work_date": request.work_date,
        "user_id": user_id,
    })
    return {"success": True, "id": obj.id}


@router.get("/history")
async def history(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    repo = CheckRepository(db)
    checks = await repo.get_by_user(current_user["user_id"])
    return checks


@router.put("/{check_id}")
async def update_check(
    check_id: str,
    request: UpdateCheckRequest,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    from fastapi import HTTPException
    repo = CheckRepository(db)
    obj = await repo.get(check_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Нет прав")
    updated = await repo.update(check_id, request.model_dump(exclude_none=True))
    return updated


@router.delete("/{check_id}")
async def delete_check(
    check_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    from fastapi import HTTPException
    repo = CheckRepository(db)
    obj = await repo.get(check_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if obj.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    await repo.delete(check_id)
    return {"success": True}
