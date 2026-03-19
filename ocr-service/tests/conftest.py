import sys
import os

# Добавляем src в путь к модулям
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

# Определяем fixture-и
import pytest
import cv2
import numpy as np
from pathlib import Path

# Создаем временную директорию для тестовых изображений
TEST_IMAGES_DIR = Path(__file__).parent / "test_images"
TEST_IMAGES_DIR.mkdir(exist_ok=True)

@pytest.fixture(scope="session")
def test_images():
    """Фикстура для создания тестовых изображений"""
    images = {}

    # 1. Создаем изображение с рукописным текстом (прописные буквы)
    handwritten_path = TEST_IMAGES_DIR / "handwritten.jpg"
    if not handwritten_path.exists():
        img = np.ones((300, 600, 3), dtype=np.uint8) * 255  # Белый фон
        cv2.putText(img, "ПРИВЕТ МИР", (50, 150), cv2.FONT_HERSHEY_SIMPLEX,2, (0, 0, 0), 3, cv2.LINE_AA)
        cv2.putText(img, "ЭТО РУКОПИСНЫЙ ТЕКСТ", (50, 220), cv2.FONT_HERSHEY_SIMPLEX,1, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.imwrite(str(handwritten_path), img)
    images["handwritten"] = str(handwritten_path)

    # 2. Создаем изображение с печатным текстом
    printed_path = TEST_IMAGES_DIR / "printed.jpg"
    if not printed_path.exists():
        img = np.ones((400, 800, 3), dtype=np.uint8) * 255
        font = cv2.FONT_HERSHEY_COMPLEX
        cv2.putText(img, "Это печатный текст для тестирования", (50, 100), font,1.2, (0, 0, 0), 2)
        cv2.putText(img, "Tesseract должен распознать его хорошо", (50, 180), font,1.0, (0, 0, 0), 2)
        cv2.imwrite(str(printed_path), img)
    images["printed"] = str(printed_path)

    # 3. Создаем пустое изображение для тестирования ошибок
    empty_path = TEST_IMAGES_DIR / "empty.jpg"
    if not empty_path.exists():
        img = np.ones((100, 100, 3), dtype=np.uint8) * 255
        cv2.imwrite(str(empty_path), img)
    images["empty"] = str(empty_path)

    return images

@pytest.fixture
def paddle_strategy():
    """Фикстура для PaddleStrategy"""
    from src.strategies.paddle_strategy import PaddleStrategy
    return PaddleStrategy()

@pytest.fixture
def tesseract_strategy():
    """Фикстура для TesseractStrategy"""
    from src.strategies.tesseract_strategy import TesseractStrategy
    return TesseractStrategy()