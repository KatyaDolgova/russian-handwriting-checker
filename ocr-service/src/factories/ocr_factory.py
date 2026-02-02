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
    def get_best_strategy(image_path: str) -> Tuple[OCRStrategy, OcrResult]:
        """
        Выбирает лучшую стратегию для изображения

        Args:
            image_path: Путь к изображению

        Returns:
            Кортеж (лучшая стратегия, результат распознавания)
        """
        strategies = OCRFactory.create_strategies()
        results = []

        print(f"[OCR FACTORY] Тестирование {len(strategies)} стратегий для: {image_path}")

        # Запуск всех стратегий
        for strategy in strategies:
            print(f"[OCR FACTORY] Запуск: {strategy.get_name()}")
            result = strategy.recognize(image_path)
            results.append((strategy, result))

            print(f"[OCR FACTORY] {strategy.get_name()} результат:")
            print(f"  Текст (длина: {len(result.text)}): {result.text[:100]}{'...' if len(result.text) > 100 else ''}")
            print(f"  Уверенность: {result.confidence:.3f}")
            print(f"  Время: {result.processing_time:.2f} сек")

            if result.metadata.get("error"):
                print(f"  Ошибка: {result.metadata['error']}")

        # Выбор лучшего результата
        best_strategy, best_result = max(
            results,
            key=lambda x: OCRFactory._calculate_final_score(x[0], x[1], image_path)
        )

        print(f"\n[OCR FACTORY] Выбрана стратегия: {best_strategy.get_name()}")
        print(f"  Итоговая оценка: {OCRFactory._calculate_final_score(best_strategy, best_result, image_path):.3f}")

        return best_strategy, best_result

    @staticmethod
    def _calculate_final_score(strategy: OCRStrategy, result: OcrResult, image_path: str) -> float:
        """
        Рассчитывает итоговую оценку результата с учетом стратегии

        Args:
            strategy: Стратегия распознавания
            result: Результат распознавания
            image_path: Путь к изображению (для анализа типа изображения)

        Returns:
            Итоговая оценка (0.0 - 1.0)
        """
        if not result.text or result.confidence == 0:
            return 0.0

        # Базовая оценка из результатов стратегии
        base_score = result.confidence

        # Дополнительная оценка качества текста
        text_quality = score_text(result.text)

        # Оценка на основе типа изображения (гипотетическая)
        image_score = OCRFactory._evaluate_image_type(image_path, strategy.get_name())

        # Взвешенная итоговая оценка
        final_score = (
                0.5 * base_score +  # Уверенность модели
                0.3 * text_quality +  # Качество текста
                0.2 * image_score  # Соответствие типу изображения
        )

        # Штраф за время обработки
        time_penalty = min(result.processing_time / 10.0, 0.2)  # Макс. штраф 0.2
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
            # Анализ изображения для определения типа
            img = cv2.imread(image_path)
            if img is None:
                return 0.5

            # Простой анализ: определение контрастности и резкости
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            contrast = gray.std()
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Выбор стратегии
            if strategy_name == "PaddleOCR":
                # PaddleOCR лучше работает с рукописным текстом (низкий контраст, неровные линии)
                if contrast < 50 and sharpness < 100:
                    return 0.9  # Высокая оценка для рукописного
                elif contrast > 80:
                    return 0.4  # Низкая оценка для печатного
                else:
                    return 0.6

            elif strategy_name == "Tesseract":
                # Tesseract лучше работает с печатным текстом (высокий контраст, резкие края)
                if contrast > 70 and sharpness > 150:
                    return 0.9  # Высокая оценка для печатного
                elif contrast < 40:
                    return 0.3  # Низкая оценка для рукописного
                else:
                    return 0.7

            return 0.5

        except Exception as e:
            print(f"[OCR FACTORY] Ошибка анализа изображения: {e}")
            return 0.5