import time
from pathlib import Path

from .tesseract_strategy import TesseractStrategy
from .paddle_strategy import PaddleStrategy
from .yandex_vision_strategy import YandexVisionStrategy
from ..utils.text_processing import fix_russian_handwriting, clean_text
from ..core.logger import get_logger

logger = get_logger("hybrid_ocr")


class HybridOCR:
    """Гибридный OCR: выбирает лучший результат среди доступных движков"""

    def __init__(self):
        self.tesseract = TesseractStrategy()
        self.paddle = PaddleStrategy()
        self.yandex = YandexVisionStrategy()

    def process(self, image_path: str) -> str:
        logger.info("Обработка: %s", Path(image_path).name)
        start_time = time.time()

        candidates = []

        for strategy in [self.yandex, self.paddle, self.tesseract]:
            try:
                result = strategy.recognize(image_path)
                if result.text:
                    candidates.append((result, strategy.get_name()))
                    logger.info(
                        "%s | уверенность: %.3f | длина: %d",
                        strategy.get_name(),
                        result.confidence,
                        len(result.text),
                    )
            except Exception as e:
                logger.warning("%s упал: %s", strategy.get_name(), e)

        if not candidates:
            return "[Ошибка OCR] Ни один движок не смог распознать текст"

        best_result, best_name = max(candidates, key=lambda x: x[0].confidence)
        logger.info(
            "Победитель: %s | уверенность: %.3f | время: %.2f с",
            best_name,
            best_result.confidence,
            time.time() - start_time,
        )
        return best_result.text

    async def process_async(self, image_path: str) -> str:
        return self.process(image_path)
