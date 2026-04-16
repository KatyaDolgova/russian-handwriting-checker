from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from pathlib import Path
import shutil
from uuid import uuid4

from src.converters.document_converter import DocumentConverter
from src.ai.llm_service import LLMService

app = FastAPI(
    title="Russian Handwriting Checker AI Service",
    description="MarkItDown + Hybrid OCR + Qwen3",
    version="2.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация сервисов
converter = DocumentConverter()
llm_service = LLMService()

TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)

@app.post("/api/convert")
async def convert_document(file: UploadFile = File(...)):
    if not file.content_type:
        raise HTTPException(400, "Не указан тип файла")

    # Сохраняем временный файл
    temp_path = TEMP_DIR / f"{uuid4()}_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Конвертируем в Markdown через MarkItDown + fallback OCR
        markdown_text = await converter.convert(str(temp_path))

        return JSONResponse({
            "success": True,
            "filename": file.filename,
            "text": markdown_text,
            "format": "markdown"
        })

    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)


@app.post("/api/check-text")
async def check_text(data: dict):
    text = data.get("text", "")
    if not text:
        raise HTTPException(400, "Текст не передан")

    # Пример простого вызова LLM
    result = await llm_service.generate(
        prompt=f"Проверь орфографию, пунктуацию и стиль этого текста. Выведи исправленный вариант и список ошибок:\n\n{text}",
        system="Ты эксперт русского языка и преподаватель."
    )

    return {"success": True, "original": text, "analysis": result}
@app.get("/")
async def root():
    return {
        "message": "Russian Handwriting Checker AI Service запущен",
        "docs": "/docs",
        "endpoints": {
            "convert": "/api/convert (POST)",
            "check_text": "/api/check-text (POST)"
        },
        "status": "running"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)