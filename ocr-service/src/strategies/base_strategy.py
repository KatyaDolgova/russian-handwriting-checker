from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional

@dataclass
class OcrResult:
    """Структура результата распознавания"""
    text: str
    confidence: float
    processing_time: float
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class OCRStrategy(ABC):
    """Абстрактный класс стратегии распознавания"""

    @abstractmethod
    def recognize(self, image_path: str) -> OcrResult:
        """
        Распознает текст на изображении

        Args:
            image_path: Путь к изображению

        Returns:
            OcrResult: Результат распознавания
        """
        pass

    @abstractmethod
    def get_name(self) -> str:
        """Возвращает название стратегии"""
        pass

    def _calculate_confidence(self, text: str) -> float:
        """
        Рассчитывает базовую уверенность на основе качества текста
        (Будет переопределен в конкретных стратегиях)
        """
        if not text:
            return 0.0

        # Подсчет кириллических символов
        cyrillic_chars = sum(1 for c in text if 'а' <= c.lower() <= 'я' or c in 'ёЁ')
        cyrillic_ratio = cyrillic_chars / len(text) if text else 0

        # Подсчет реальных слов
        words = [w for w in text.split() if len(w) > 1]
        word_ratio = len(words) / max(len(text.split()), 1)

        # Базовая формула уверенности
        return 0.6 * cyrillic_ratio + 0.4 * word_ratio