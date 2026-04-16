import time
import cv2
from PIL import Image
import pytesseract
from .base_strategy import OCRStrategy, OcrResult
from ..utils.image_processing import enhance_for_tesseract
from ..utils.text_processing import fix_russian_handwriting, clean_text


class TesseractStrategy(OCRStrategy):
    """Стратегия распознавания с использованием Tesseract OCR"""

    def __init__(self):
        """Инициализация Tesseract"""
        self.name = "Tesseract"
        # Проверка доступности Tesseract
        try:
            pytesseract.get_tesseract_version()
        except Exception as e:
            print(f"Внимание: Tesseract не доступен. Ошибка: {e}")

    def get_name(self) -> str:
        return self.name

    def recognize(self, image_path: str) -> OcrResult:
        """Распознавание текста с помощью Tesseract"""
        start_time = time.time()

        try:
            # Предобработка изображения
            processed_img = enhance_for_tesseract(image_path)

            # Конвертация в PIL Image
            img_pil = Image.fromarray(processed_img)

            # Распознавание
            raw_text = pytesseract.image_to_string(
                img_pil,
                lang='rus',
                config='--psm 6 --oem 3'
            ).strip()

            # Постобработка
            cleaned_text = fix_russian_handwriting(raw_text)
            final_text = clean_text(cleaned_text)

            # Расчет уверенности
            text_confidence = self._calculate_confidence(final_text)

            processing_time = time.time() - start_time

            return OcrResult(
                text=final_text,
                confidence=text_confidence,
                processing_time=processing_time,
                metadata={
                    "raw_text": raw_text,
                    "tesseract_version": str(pytesseract.get_tesseract_version())
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