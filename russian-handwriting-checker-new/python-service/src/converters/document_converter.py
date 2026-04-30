from markitdown import MarkItDown
from pathlib import Path
from ..strategies.hybrid_ocr import HybridOCR
from ..core.logger import get_logger

logger = get_logger("document_converter")


class DocumentConverter:
    """Главный конвертер: MarkItDown + fallback на гибридный OCR"""

    def __init__(self):
        self.md = MarkItDown(enable_plugins=True)
        self.ocr_fallback = HybridOCR()

    async def convert(self, file_path: str) -> str:
        """
        Универсальный конвертер:
        - Для PDF/DOCX/PPTX и т.д. → MarkItDown
        - Для изображений с рукописным текстом → HybridOCR (Paddle + Tesseract)
        """
        path = Path(file_path)
        ext = path.suffix.lower()

        logger.info("Обработка файла: %s (%s)", path.name, ext)

        # Если это изображение — используем гибридный OCR
        if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            try:
                logger.info("Изображение → используем HybridOCR")
                return await self.ocr_fallback.process_async(str(path))
            except Exception as e:
                logger.error("HybridOCR ошибка: %s", e, exc_info=True)

        # Для всех остальных форматов (PDF, DOCX и т.д.) — используем MarkItDown
        try:
            logger.info("Документ → используем MarkItDown")
            result = self.md.convert(str(path))
            text = result.text_content.strip()
            return text if text else "[MarkItDown] Текст не извлечён"
        except Exception as e:
            logger.error("MarkItDown ошибка: %s", e, exc_info=True)
            # Последний fallback
            return await self.ocr_fallback.process_async(str(path))