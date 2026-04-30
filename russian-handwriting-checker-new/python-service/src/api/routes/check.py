from fastapi import APIRouter, Depends
from src.api.deps import get_db
from src.repositories.function_repo import FunctionRepository
from src.repositories.check_repo import CheckRepository
from src.services.check_service import CheckService
from src.services.llm_service import LLMService
from src.schemas.check import CheckRequest, SaveCheckRequest

router = APIRouter(prefix="/check")

@router.post("/")
async def run_check(request: CheckRequest, db=Depends(get_db)):
    service = CheckService(LLMService(), FunctionRepository(db))

    return await service.run_check(
        request.text,
        request.function_id
    )

@router.post("/save")
async def save(request: SaveCheckRequest, db=Depends(get_db)):
    repo = CheckRepository(db)

    obj = await repo.create({
        "filename": request.filename,
        "original_text": request.original_text,
        "corrected_text": request.corrected_text,
        "score": request.score,
        "comment": request.comment,
        "pupil_name": request.pupil_name,
        "function_id": request.function_id
    })

    return {"success": True, "id": obj.id}