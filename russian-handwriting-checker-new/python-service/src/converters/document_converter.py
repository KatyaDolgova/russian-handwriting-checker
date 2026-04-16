from markitdown import MarkItDown
from pathlib import Path
from ..strategies.hybrid_ocr import HybridOCR

class DocumentConverter:
    """Главный конвертер: MarkItDown + fallback на твой гибридный OCR"""

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

        print(f"[Converter] Обработка файла: {path.name} ({ext})")

        # Если это изображение — используем твой гибридный OCR
        if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            try:
                print("[Converter] Изображение → используем HybridOCR")
                return await self.ocr_fallback.process_async(str(path))
            except Exception as e:
                print(f"[Converter] HybridOCR ошибка: {e}")

        # Для всех остальных форматов (PDF, DOCX и т.д.) — используем MarkItDown
        try:
            print("[Converter] Документ → используем MarkItDown")
            result = self.md.convert(str(path))
            text = result.text_content.strip()
            return text if text else "[MarkItDown] Текст не извлечён"
        except Exception as e:
            print(f"[Converter] MarkItDown ошибка: {e}")
            # Последний fallback
            return await self.ocr_fallback.process_async(str(path))