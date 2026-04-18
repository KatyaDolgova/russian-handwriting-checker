from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from pathlib import Path
import shutil
from uuid import uuid4
from pydantic import BaseModel

from src.converters.document_converter import DocumentConverter
from src.ai.llm_service import LLMService

from typing import List, Optional
import json
import re

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


class CheckRequest(BaseModel):
    text: str
    check_type: str = "grammar"   # grammar, oge_essay, ege_essay, final_essay, custom



class ErrorDetail(BaseModel):
    offset: int
    length: int
    message: str
    type: str = "spelling"

class CheckResponse(BaseModel):
    success: bool
    original: str
    corrected: str
    errors: List[ErrorDetail] = []
    score: float = 0.0
    comment: str = ""
    check_type: str
    html_highlighted: Optional[str] = None


@app.post("/api/check", response_model=CheckResponse)
async def check_text(request: CheckRequest):
    """Улучшенная версия с надёжным парсингом и генерацией HTML"""
    try:
        system_prompt = {
            "grammar": "Ты строгий, но справедливый учитель русского языка. Исправляй только реальные ошибки.",
            "oge_essay": "Ты эксперт по проверке сочинений ОГЭ. Оцени по официальным критериям.",
            "ege_essay": "Ты эксперт по проверке сочинений ЕГЭ.",
        }.get(request.check_type, "Ты эксперт русского языка.")

        user_prompt = f"""
Текст ученика:
{request.text}

Проанализируй и верни **только** чистый JSON (без объяснений):

{{
    "corrected": "полностью исправленный текст",
    "errors": [
    {{
        "offset": начальная_позиция,
        "length": длина_ошибки,
        "message": "короткое понятное объяснение ошибки",
        "type": "spelling"
    }}
    ],
    "score": число от 60 до 100,
    "comment": "короткий комментарий"
}}
"""

        raw_response = await llm_service.generate(prompt=user_prompt, system=system_prompt)

        # Извлекаем JSON из ответа модели
        json_match = re.search(r'\{[\s\S]*\}', raw_response)
        if json_match:
            try:
                data = json.loads(json_match.group(0))
            except:
                data = {"corrected": request.text, "errors": [], "score": 70, "comment": "Не удалось разобрать JSON"}
        else:
            data = {"corrected": raw_response, "errors": [], "score": 70, "comment": "Модель вернула неструктурированный ответ"}

        # Формируем список ошибок
        errors = []
        for e in data.get("errors", []):
            errors.append(ErrorDetail(
                offset=int(e.get("offset", 0)),
                length=int(e.get("length", 0)),
                message=str(e.get("message", "")),
                type=str(e.get("type", "spelling"))
            ))

        # Генерируем HTML с подсветкой ошибок
        highlighted = request.text
        offset_shift = 0
        for err in sorted(errors, key=lambda x: x.offset):
            start = err.offset + offset_shift
            end = start + err.length
            if start < len(highlighted) and end <= len(highlighted):
                wrong_part = highlighted[start:end]
                replacement = f'<span style="color:red; text-decoration:underline; font-weight:bold;">{wrong_part}</span>'
                highlighted = highlighted[:start] + replacement + highlighted[end:]
                offset_shift += len(replacement) - err.length

        return CheckResponse(
            success=True,
            original=request.text,
            corrected=data.get("corrected", request.text),
            errors=errors,
            score=float(data.get("score", 75)),
            comment=data.get("comment", "Анализ выполнен Qwen3"),
            check_type=request.check_type,
            html_highlighted=highlighted
        )

    except Exception as e:
        return CheckResponse(
            success=False,
            original=request.text,
            corrected="",
            errors=[],
            score=0.0,
            comment=f"Ошибка анализа: {str(e)}",
            check_type=request.check_type
        )
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)