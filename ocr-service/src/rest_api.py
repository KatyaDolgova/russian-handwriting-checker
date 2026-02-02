# src/rest_api.py
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from uuid import uuid4
from typing import List, Optional
import logging
import tempfile
import os
from pathlib import Path

# Импорты для OCR-логики
from .factories.ocr_factory import OCRFactory
from .strategies.base_strategy import OcrResult

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OCR Service API",
    description="API для распознавания текста на изображениях (рукописный и печатный, русский)",
    version="1.0.0"
)

# Pydantic модели для запросов/ответов 
class ProcessImageRequest(BaseModel):
    # Это будет использоваться для документации, но не для валидации файла
    pass

class ErrorDetail(BaseModel):
    code: str
    message: str

class ProcessImageResponse(BaseModel):
    success: bool
    text: str
    confidence: float
    source_algorithm: str
    processing_time: float
    errors: List[ErrorDetail] = []

@app.post("/ocr/process-image/", summary="Обработать изображение", tags=["OCR"], response_model=ProcessImageResponse)
async def process_image(file: UploadFile = File(...)):
    logger.info(f"Получен запрос на обработку файла: {file.filename}")

    # 1. Проверка типа файла
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением (image/jpeg, image/png, etc.)")

    # 2. Создание временного файла для сохранения загруженного изображения
    # Это нужно, потому что OCR-библиотеки работают с файлами
    temp_dir = Path("temp_uploads")
    temp_dir.mkdir(exist_ok=True) # Создать папку, если её нет

    # Чтобы избежать коллизий имен, используем UUID
    temp_file_path = temp_dir / f"{uuid4()}_{file.filename}"

    try:
        # 3. Сохранение файла на диск во временный путь
        with open(temp_file_path, 'wb') as buffer:
            content = await file.read()
            buffer.write(content)

        # 4. Вызов OCRFactory для обработки изображения
        logger.info(f"Запуск OCR для файла: {temp_file_path}")
        strategy, result = OCRFactory.get_best_strategy(str(temp_file_path))

        # 5. Формирование ответа
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
        logger.error(f"Ошибка при обработке изображения: {e}")
        # Возвращаем ошибку клиенту
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
        # 6. Удаление временного файла
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                logger.debug(f"Временный файл удален: {temp_file_path}")
        except OSError as e:
            logger.warning(f"Не удалось удалить временный файл {temp_file_path}: {e}")


@app.get("/", summary="Главная страница", tags=["General"])
async def root():
    return {"message": "OCR Service API is running. See /docs for documentation."}

@app.get("/health", summary="Проверка состояния", tags=["General"])
async def health_check():
    return {"status": "healthy"}