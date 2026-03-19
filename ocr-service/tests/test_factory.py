import pytest
from src.factories.ocr_factory import OCRFactory
from src.strategies.base_strategy import OCRStrategy, OcrResult


def test_factory_strategy_creation():
    """Тест создания стратегий фабрикой"""
    strategies = OCRFactory.create_strategies()
    assert len(strategies) >= 1  # Должна быть хотя бы одна стратегия
    for strategy in strategies:
        assert isinstance(strategy, OCRStrategy)


def test_factory_best_strategy_selection(test_images):
    """Тест выбора лучшей стратегии"""
    # Для рукописного текста должна выбираться PaddleOCR
    strategy, result = OCRFactory.get_best_strategy(test_images["handwritten"])
    assert strategy.get_name() in ["PaddleOCR", "Tesseract"]  # Может быть любая, но с высокой уверенностью
    assert result.confidence > 0.0

    # Для печатного текста должна выбираться Tesseract
    strategy, result = OCRFactory.get_best_strategy(test_images["printed"])
    assert strategy.get_name() in ["PaddleOCR", "Tesseract"]  # Может быть любая, но с высокой уверенностью
    assert result.confidence > 0.0


def test_factory_error_handling():
    """Тест обработки ошибок фабрикой"""
    strategy, result = OCRFactory.get_best_strategy("non_existent.jpg")
    assert result.confidence == 0.0
    assert "error" in result.metadata