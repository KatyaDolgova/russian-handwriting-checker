from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import shutil
from pathlib import Path
from uuid import uuid4

from src.converters.document_converter import DocumentConverter
from src.services.check_service import CheckService

app = FastAPI(
    title="Russian Handwriting Checker AI",
    description="Workflow для учителя: загрузка → редактирование текста → проверка → редактирование результата → сохранение",
    version="1.3"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

converter = DocumentConverter()
check_service = CheckService()

TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)


class UploadResponse(BaseModel):
    success: bool
    filename: str
    raw_text: str


class CheckRequest(BaseModel):
    text: str
    check_type: str = "grammar"   # grammar, oge_essay, ege_essay, final_essay, custom
    custom_prompt: Optional[str] = None


class CheckResponse(BaseModel):
    success: bool
    original_text: str
    corrected_text: str
    errors: List[dict] = []
    score: float = 0.0
    comment: str = ""
    check_type: str
    html_highlighted: Optional[str] = None


class SaveResultRequest(BaseModel):
    filename: str
    original_text: str
    corrected_text: str
    errors: List[dict] = []
    score: float
    comment: str
    check_type: str
    pupil_name: Optional[str] = None


class SaveResultResponse(BaseModel):
    success: bool
    result_id: str
    message: str


@app.get("/")
async def root():
    return {"status": "ok", "message": "Сервис работает. Workflow: загрузка → редактирование → проверка → сохранение"}


@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """1. Загрузка файла → возврат сырого текста"""
    temp_path = TEMP_DIR / f"{uuid4()}_{file.filename}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        text = await converter.convert(str(temp_path))

        return UploadResponse(
            success=True,
            filename=file.filename,
            raw_text=text
        )
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)


@app.post("/api/check", response_model=CheckResponse)
async def check_text(request: CheckRequest):
    """2. Проверка текста (после возможного редактирования учителем)"""
    result = await check_service.check_text(
        text=request.text,
        check_type=request.check_type,
        custom_prompt=request.custom_prompt
    )
    return CheckResponse(success=True, original_text=request.text, **result)


@app.post("/api/save-result", response_model=SaveResultResponse)
async def save_result(request: SaveResultRequest):
    """3. Учитель отредактировал результат → сохраняем"""
    result_id = str(uuid4())

    # Пока сохранение в консоль
    print(f"\n=== СОХРАНЕНА ПРОВЕРКА ===")
    print(f"ID: {result_id}")
    print(f"Файл: {request.filename}")
    print(f"Ученик: {request.pupil_name or 'Не указан'}")
    print(f"Тип проверки: {request.check_type}")
    print(f"Оценка: {request.score}")
    print(f"Комментарий: {request.comment}")
    print(f"========================\n")

    return SaveResultResponse(
        success=True,
        result_id=result_id,
        message="Результат успешно сохранён"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)