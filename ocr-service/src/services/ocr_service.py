import cv2
from typing import List, Tuple
from ..strategies.base_strategy import OCRStrategy, OcrResult
from ..strategies.paddle_strategy import PaddleStrategy
from ..strategies.tesseract_strategy import TesseractStrategy
from ..utils.text_processing import score_text


class OCRFactory:
    """Фабрика для выбора оптимальной OCR-стратегии"""

    @staticmethod
    def create_strategies() -> List[OCRStrategy]:
        return [PaddleStrategy(), TesseractStrategy()]

    @staticmethod
    def quick_image_type_predict(image_path: str) -> str:
        """Быстрый предиктор (теперь правильно определяет печатный текст)"""
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                return "unknown"

            contrast = img.std()
            laplacian_var = cv2.Laplacian(img, cv2.CV_64F).var()

            print(f"[DEBUG PREDICT] Contrast: {contrast:.1f} | Sharpness: {laplacian_var:.1f}")

            if contrast < 60 and laplacian_var < 160:
                return "handwritten"
            if contrast > 50 and laplacian_var > 70:
                return "printed"
            return "unknown"
        except Exception as e:
            print(f"[DEBUG PREDICT] Ошибка: {e}")
            return "unknown"

    @staticmethod
    def get_best_strategy(image_path: str) -> Tuple[OCRStrategy, OcrResult]:
        img_type = OCRFactory.quick_image_type_predict(image_path)
        print(f"[OCR FACTORY] Быстрый анализ → {img_type.upper()}")

        if img_type == "handwritten":
            strategies = [PaddleStrategy()]
        elif img_type == "printed":
            strategies = [TesseractStrategy()]
        else:
            strategies = OCRFactory.create_strategies()

        results = []
        for strategy in strategies:
            result = strategy.recognize(image_path)
            results.append((strategy, result))

        best_strategy, best_result = max(
            results,
            key=lambda x: OCRFactory._calculate_final_score(x[0], x[1], image_path)
        )

        print(f"[OCR FACTORY] ✅ Выбрана: {best_strategy.get_name()}")
        return best_strategy, best_result

    @staticmethod
    def _calculate_final_score(strategy: OCRStrategy, result: OcrResult, image_path: str) -> float:
        if not result.text or result.confidence == 0:
            return 0.0

        base = result.confidence
        text_quality = score_text(result.text)
        image_score = 0.9 if strategy.get_name() == "Tesseract" else 0.7 

        final = 0.5 * base + 0.3 * text_quality + 0.2 * image_score
        final *= (1 - min(result.processing_time / 10, 0.2))
        return max(0.0, min(1.0, final))