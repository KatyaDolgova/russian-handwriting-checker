import time
import cv2
import numpy as np
from paddleocr import PaddleOCR
from .base_strategy import OCRStrategy, OcrResult
from ..utils.image_processing import enhance_for_paddle
from ..utils.text_processing import fix_russian_handwriting, clean_text


class PaddleStrategy(OCRStrategy):
    """Стратегия распознавания с использованием PaddleOCR"""

    def __init__(self):
        """Инициализация PaddleOCR"""
        self.ocr = PaddleOCR(
            lang='ru',
            use_angle_cls=False,
            det=True,
            rec=True,
            use_gpu=False,
            show_log=False
        )
        self.name = "PaddleOCR"

    def get_name(self) -> str:
        return self.name

    def recognize(self, image_path: str) -> OcrResult:
        """Распознавание текста с помощью PaddleOCR"""
        start_time = time.time()

        try:
            # Предобработка изображения
            processed_img = enhance_for_paddle(image_path)

            # Распознавание
            result = self.ocr.ocr(processed_img, cls=False)

            # Извлечение текста
            lines = []
            total_confidence = 0
            line_count = 0

            if result and result[0]:
                for line in result[0]:
                    if len(line) >= 2 and len(line[1]) >= 2:
                        text, conf = line[1][0], line[1][1]
                        if conf >= 0.3:  # Порог уверенности
                            lines.append(text)
                            total_confidence += conf
                            line_count += 1

            raw_text = '\n'.join(lines)

            # Постобработка
            cleaned_text = fix_russian_handwriting(raw_text)
            final_text = clean_text(cleaned_text)

            # Расчет уверенности
            avg_confidence = total_confidence / line_count if line_count > 0 else 0
            text_confidence = self._calculate_confidence(final_text)
            final_confidence = 0.7 * avg_confidence + 0.3 * text_confidence

            processing_time = time.time() - start_time

            return OcrResult(
                text=final_text,
                confidence=final_confidence,
                processing_time=processing_time,
                metadata={
                    "raw_text": raw_text,
                    "line_count": line_count,
                    "avg_line_confidence": avg_confidence
                }
            )

        except Exception as e:
            processing_time = time.time() - start_time
            return OcrResult(
                text="",
                confidence=0.0,
                processing_time=processing_time,
                metadata={"error": str(e)}
            )