import time
from pathlib import Path
from typing import Dict, Any

from .paddle_strategy import PaddleStrategy
from .tesseract_strategy import TesseractStrategy
from ..utils.text_processing import fix_russian_handwriting, clean_text
from ..core.logger import get_logger

logger = get_logger("hybrid_ocr")


class HybridOCR:
    """Гибридный OCR: PaddleOCR + Tesseract с выбором лучшего результата"""

    def __init__(self):
        self.paddle = PaddleStrategy()
        self.tesseract = TesseractStrategy()

    def process(self, image_path: str) -> str:
        """Синхронная обработка изображения"""
        logger.info("Обработка: %s", Path(image_path).name)

        start_time = time.time()

        try:
            paddle_result = self.paddle.recognize(image_path)
            tess_result = self.tesseract.recognize(image_path)

            # Выбираем лучший по уверенности
            if paddle_result.confidence >= tess_result.confidence:
                best = paddle_result
                source = "PaddleOCR"
            else:
                best = tess_result
                source = "Tesseract"

            logger.info("Выбран %s | Уверенность: %.3f | Длина текста: %d", source, best.confidence, len(best.text))

            return best.text

        except Exception as e:
            logger.error("Ошибка: %s", e, exc_info=True)
            return f"[Ошибка OCR] Не удалось распознать текст из файла {Path(image_path).name}"

    async def process_async(self, image_path: str) -> str:
        """Асинхронная версия для FastAPI"""
        return self.process(image_path)