from typing import Dict, Any
from ..factories.ocr_factory import OCRFactory


class OCRService:
    """Сервис для распознавания текста с использованием фабрики стратегий"""

    @staticmethod
    def process_image(image_path: str) -> Dict[str, Any]:
        """
        Обрабатывает изображение и возвращает результат распознавания

        Args:
            image_path: Путь к изображению

        Returns:
            Словарь с результатами в формате JSON
        """
        try:
            # Выбор лучшей стратегии и получение результата
            best_strategy, result = OCRFactory.get_best_strategy(image_path)

            # Формирование ответа
            response = {
                "success": True,
                "text": result.text,
                "confidence": result.confidence,
                "processing_time": result.processing_time,
                "selected_strategy": best_strategy.get_name(),
                "metadata": {
                    "raw_text": result.metadata.get("raw_text", ""),
                    "line_count": result.metadata.get("line_count", 0),
                    "avg_line_confidence": result.metadata.get("avg_line_confidence", 0),
                    "errors": []
                }
            }
            # Добавление информации об ошибках из метаданных
            if result.metadata.get("error"):
                response["metadata"]["errors"].append(result.metadata["error"])
                response["success"] = False

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Ошибка при обработке изображения"
            }