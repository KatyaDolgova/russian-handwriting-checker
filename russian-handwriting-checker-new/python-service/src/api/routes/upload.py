from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from pathlib import Path
import shutil
from uuid import uuid4

from src.services.ocr_service import OCRService
from src.core.task_store import tasks

router = APIRouter(prefix="/upload")

TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)

ocr_service = OCRService()


@router.post("/")
async def upload(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    task_id = str(uuid4())

    path = TEMP_DIR / f"{task_id}_{file.filename}"

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # сохраняем статус
    tasks[task_id] = {"status": "processing"}

    # 🔥 запускаем OCR в фоне
    background_tasks.add_task(
        ocr_service.process_file,
        str(path),
        task_id
    )

    return {
        "task_id": task_id,
        "status": "processing"
    }

@router.get("/{task_id}")
async def get_status(task_id: str):
    return tasks.get(task_id, {"status": "not_found"})