from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from uuid import uuid4
from pathlib import Path
import logging
import re
import os

# Импорты OCR
from .factories.ocr_factory import OCRFactory
from .services.ocr_service import OCRService  # если используешь

# ====================== НАСТРОЙКИ ======================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic модели
class ErrorDetail(BaseModel):
    code: str
    message: str

class ProcessImageResponse(BaseModel):
    success: bool
    text: str
    #corrected_text: str = ""
    confidence: float
    quality_score: int = 0
    source_algorithm: str
    processing_time: float
    corrections: list[dict] = []
    errors: list[ErrorDetail] = []

# ====================== FastAPI ======================
app = FastAPI(
    title="OCR Service API",
    description="Гибридный OCR для рукописного и печатного текста (русский)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

# ====================== CORS ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      
        "http://127.0.0.1:3000"
        #"https://мой-домен.ру"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ====================================================

# Глобальная папка для временных файлов
TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(parents=True, exist_ok=True)


@app.post("/ocr/process-image/", summary="Обработать изображение")
async def process_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением"
        )

    safe_filename = re.sub(r'[\\/:*?"<>|]', "", file.filename or "image")
    temp_file_path = TEMP_DIR / f"{uuid4()}_{safe_filename}"

    try:
        # Сохраняем файл
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        logger.info(f"OCR: обработка {temp_file_path}")

        result = OCRService.process_image(str(temp_file_path))

        response_data = ProcessImageResponse(
            success=result.get("success", True),
            text=result.get("text", ""),
            #corrected_text=result.get("corrected_text", ""),
            confidence=result.get("confidence", 0.0),
            #quality_score=result.get("quality_score", 0),
            source_algorithm=result.get("selected_strategy", "Unknown"),
            processing_time=result.get("processing_time", 0.0),
            #corrections=result.get("corrections", []),
            errors=[ErrorDetail(code="ERROR", message=e) for e in result.get("metadata", {}).get("errors", [])]
        )

        return response_data

    except Exception as e:
        logger.error(f"Ошибка обработки: {e}", exc_info=True)
        return ProcessImageResponse(
            success=False,
            text="",
            errors=[ErrorDetail(code="PROCESSING_ERROR", message=str(e))]
        )

    finally:
        if temp_file_path.exists():
            temp_file_path.unlink(missing_ok=True)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.rest_api:app", host="0.0.0.0", port=8000, reload=True)