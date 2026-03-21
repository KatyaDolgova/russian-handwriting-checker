import cv2
from typing import List, Tuple, Optional
from ..strategies.base_strategy import OCRStrategy, OcrResult
from ..strategies.paddle_strategy import PaddleStrategy
from ..strategies.tesseract_strategy import TesseractStrategy
from ..utils.text_processing import score_text


class OCRFactory:
    """Фабрика для выбора оптимальной OCR-стратегии"""

    @staticmethod
    def create_strategies() -> List[OCRStrategy]:
        """Создает все доступные стратегии"""
        return [
            PaddleStrategy(),
            TesseractStrategy()
        ]

    @staticmethod
    def quick_image_type_predict(image_path: str) -> str:
        """
        Быстрый предиктор типа изображения (рукописный / печатный).
        Работает за ~0.01 сек, до запуска тяжёлых OCR-моделей.
        """
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
        """
        Выбирает лучшую стратегию с использованием быстрого предиктора.
        Теперь запускается только одна стратегия в 80-90% случаев!
        """
        img_type = OCRFactory.quick_image_type_predict(image_path)
        print(f"[OCR FACTORY] Быстрый анализ: {img_type.upper()} (контраст/резкость)")

        if img_type == "handwritten":
            strategies = [PaddleStrategy()]
        elif img_type == "printed":
            strategies = [TesseractStrategy()]
        else:
            strategies = OCRFactory.create_strategies()  # fallback — обе

        results = []
        print(f"[OCR FACTORY] Тестирование {len(strategies)} стратегий для: {image_path}")

        for strategy in strategies:
            print(f"[OCR FACTORY] Запуск: {strategy.get_name()}")
            result = strategy.recognize(image_path)
            results.append((strategy, result))

            print(f"[OCR FACTORY] {strategy.get_name()} → текст: {len(result.text)} символов, "
                  f"уверенность: {result.confidence:.3f}")

            if result.metadata.get("error"):
                print(f"  Ошибка: {result.metadata['error']}")

        # Выбор лучшего
        best_strategy, best_result = max(
            results,
            key=lambda x: OCRFactory._calculate_final_score(x[0], x[1], image_path)
        )

        print(f"\n[OCR FACTORY] ✅ Выбрана стратегия: {best_strategy.get_name()}")
        return best_strategy, best_result

    @staticmethod
    def _calculate_final_score(strategy: OCRStrategy, result: OcrResult, image_path: str) -> float:
        """ Рассчитывает итоговую оценку результата с учетом стратегии

        Args:
            strategy: Стратегия распознавания
            result: Результат распознавания
            image_path: Путь к изображению (для анализа типа изображения)

        Returns:
            Итоговая оценка (0.0 - 1.0) """
        if not result.text or result.confidence == 0:
            return 0.0

        # Базовая оценка из результатов стратегии
        base_score = result.confidence
        # Дополнительная оценка качества текста
        text_quality = score_text(result.text)
        # Оценка на основе типа изображения
        image_score = OCRFactory._evaluate_image_type(image_path, strategy.get_name())
        
        # Взвешенная итоговая оценка
        final_score = (
                0.5 * base_score +
                0.3 * text_quality +
                0.2 * image_score
        )
        # Штраф за время обработки
        time_penalty = min(result.processing_time / 10.0, 0.2)
        final_score *= (1 - time_penalty)

        return max(0.0, min(1.0, final_score))

    @staticmethod
    def _evaluate_image_type(image_path: str, strategy_name: str) -> float:
        """
        Оценивает соответствие стратегии типу изображения

        Args:
            image_path: Путь к изображению
            strategy_name: Название стратегии

        Returns:
            Оценка соответствия (0.0 - 1.0)
        """
        try:
            # Оценка на основе типа изображения
            img = cv2.imread(image_path)
            if img is None:
                return 0.5
            # Простой анализ: определение контрастности и резкости
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            contrast = gray.std()
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Выбор стратегии
            # PaddleOCR лучше работает с рукописным текстом (низкий контраст, неровные линии)
            if strategy_name == "PaddleOCR":
                return 0.9 if contrast < 50 and sharpness < 100 else 0.4 if contrast > 80 else 0.6
            # Tesseract лучше работает с печатным текстом (высокий контраст, резкие края)
            elif strategy_name == "Tesseract":
                return 0.9 if contrast > 70 and sharpness > 150 else 0.3 if contrast < 40 else 0.7
            return 0.5
        except:
            return 0.5