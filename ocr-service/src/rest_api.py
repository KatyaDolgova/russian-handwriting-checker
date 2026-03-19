# src/rest_api.py
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from uuid import uuid4
from pathlib import Path
import logging
import os

# Импорты для OCR-логики
from .factories.ocr_factory import OCRFactory
from .strategies.base_strategy import OcrResult

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic модели
class ErrorDetail(BaseModel):
    code: str
    message: str

class ProcessImageResponse(BaseModel):
    success: bool
    text: str
    confidence: float
    source_algorithm: str
    processing_time: float
    errors: list[ErrorDetail] = []

# Создание приложения
app = FastAPI(
    title="OCR Service API",
    description="API для распознавания текста на изображениях (рукописный и печатный, русский)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

# Глобальная директория для временных файлов
TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(parents=True, exist_ok=True)


@app.post("/ocr/process-image/", summary="Обработать изображение", tags=["OCR"])
async def process_image(file: UploadFile = File(...)):
    # Проверка типа файла
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением (image/jpeg, image/png и др.)"
        )

    # Безопасное имя файла
    import re
    safe_filename = re.sub(r'[\\/:*?"<>|]', "", file.filename)
    temp_file_path = TEMP_DIR / f"{uuid4()}_{safe_filename}"

    try:
        # Сохранение временного файла
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Вызов OCR
        logger.info(f"Запуск OCR для файла: {temp_file_path}")
        strategy, result = OCRFactory.get_best_strategy(str(temp_file_path))

        # Формирование ответа
        response_data = ProcessImageResponse(
            success=True,
            text=result.text,
            confidence=result.confidence,
            source_algorithm=strategy.get_name(),
            processing_time=result.processing_time,
            errors=[]
        )
        logger.info(f"OCR завершён. Алгоритм: {strategy.get_name()}, Уверенность: {result.confidence:.3f}")

        return response_data

    except Exception as e:
        logger.error(f"Ошибка при обработке изображения: {e}", exc_info=True)
        error_detail = ErrorDetail(code="PROCESSING_ERROR", message=str(e))
        return ProcessImageResponse(
            success=False,
            text="",
            confidence=0.0,
            source_algorithm="Unknown",
            processing_time=0.0,
            errors=[error_detail]
        )

    finally:
        # Удаление временного файла
        if 'temp_file_path' in locals():
            try:
                Path(temp_file_path).unlink(missing_ok=True)
                logger.debug(f"Временный файл удалён: {temp_file_path}")
            except OSError as e:
                logger.warning(f"Не удалось удалить временный файл {temp_file_path}: {e}")


@app.get("/health", summary="Проверка состояния", tags=["General"])
async def health_check():
    return {"status": "healthy"}


@app.get("/", summary="Главная страница", tags=["General"])
async def root():
    return {
        "message": "OCR Service API is running.",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.rest_api:app", host="0.0.0.0", port=8000, reload=True)