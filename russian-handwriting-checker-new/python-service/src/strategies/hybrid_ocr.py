import asyncio
import time
from pathlib import Path

from .tesseract_strategy import TesseractStrategy
from .paddle_strategy import PaddleStrategy
from .yandex_vision_strategy import YandexVisionStrategy
from ..core.logger import get_logger

logger = get_logger("hybrid_ocr")


class HybridOCR:
    """Гибридный OCR: параллельный запуск стратегий, выбор по взвешенной уверенности"""

    def __init__(self):
        self.strategies = [
            YandexVisionStrategy(),
            PaddleStrategy(),
            TesseractStrategy(),
        ]

    async def process_async(self, image_path: str) -> str:
        logger.info("Обработка: %s", Path(image_path).name)
        start_time = time.time()

        async def run(strategy):
            try:
                result = await asyncio.to_thread(strategy.recognize, image_path)
                if result.text:
                    logger.info(
                        "%s | уверенность: %.3f | длина: %d",
                        strategy.get_name(),
                        result.confidence,
                        len(result.text),
                    )
                    return (result, strategy.get_name())
            except Exception as e:
                logger.warning("%s упал: %s", strategy.get_name(), e)
            return None

        results = await asyncio.gather(*[run(s) for s in self.strategies])
        candidates = [r for r in results if r is not None]

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

    def process(self, image_path: str) -> str:
        return asyncio.run(self.process_async(image_path))
