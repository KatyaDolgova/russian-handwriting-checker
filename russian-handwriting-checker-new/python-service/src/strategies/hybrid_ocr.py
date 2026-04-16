import time
from pathlib import Path
from typing import Dict, Any

from .paddle_strategy import PaddleStrategy
from .tesseract_strategy import TesseractStrategy
from ..utils.text_processing import fix_russian_handwriting, clean_text


class HybridOCR:
    """Гибридный OCR: PaddleOCR + Tesseract с выбором лучшего результата"""

    def __init__(self):
        self.paddle = PaddleStrategy()
        self.tesseract = TesseractStrategy()

    def process(self, image_path: str) -> str:
        """Синхронная обработка изображения"""
        print(f"[HybridOCR] Обработка: {Path(image_path).name}")

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

            print(f"[HybridOCR] Выбран {source} | Уверенность: {best.confidence:.3f} | Длина текста: {len(best.text)}")

            return best.text

        except Exception as e:
            print(f"[HybridOCR] Ошибка: {e}")
            return f"[Ошибка OCR] Не удалось распознать текст из файла {Path(image_path).name}"

    async def process_async(self, image_path: str) -> str:
        """Асинхронная версия для FastAPI"""
        return self.process(image_path)