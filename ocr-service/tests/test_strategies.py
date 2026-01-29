import pytest
from src.strategies.base_strategy import OcrResult

def test_paddle_strategy_recognize(paddle_strategy, test_images):
    """Тест распознавания PaddleStrategy"""
    result = paddle_strategy.recognize(test_images["handwritten"])

    assert isinstance(result, OcrResult)
    assert result.confidence >= 0.0
    assert result.processing_time > 0

    assert "error" not in result.metadata

def test_tesseract_strategy_recognize(tesseract_strategy, test_images):
    """Тест распознавания TesseractStrategy"""
    result = tesseract_strategy.recognize(test_images["printed"])

    assert isinstance(result, OcrResult)
    assert result.confidence >= 0.0
    assert result.processing_time > 0

    assert "error" not in result.metadata

def test_strategy_error_handling(paddle_strategy, test_images):
    """Тест обработки ошибок в стратегиях"""
    # Тест с несуществующим файлом
    result = paddle_strategy.recognize("non_existent.jpg")
    assert result.confidence == 0.0
    assert "error" in result.metadata


def test_strategy_empty_image(paddle_strategy, test_images):
    """Тест обработки пустого изображения"""
    result = paddle_strategy.recognize(test_images["empty"])
    assert result.confidence == 0.0
    assert len(result.text) == 0