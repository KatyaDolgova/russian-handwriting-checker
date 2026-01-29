import pytest
from src.utils.text_processing import clean_text, fix_russian_handwriting, score_text
from src.utils.image_processing import enhance_for_paddle, enhance_for_tesseract


def test_clean_text():
    """Тест очистки текста"""
    dirty_text = "Привет! Это тест123 @#$%^&*()_+"
    clean = clean_text(dirty_text)
    assert "Привет! Это тест123" in clean
    assert "@" not in clean
    assert "#" not in clean
    assert "$" not in clean

def test_fix_russian_handwriting():
    """Тест коррекции рукописного текста"""
    # Тест замены цифр на буквы
    assert fix_russian_handwriting("0") == "О"
    assert fix_russian_handwriting("1") == "И"
    assert fix_russian_handwriting("3") == "Э"

    # Тест замены латинских букв на кириллицу
    assert fix_russian_handwriting("A") == "А"
    assert fix_russian_handwriting("B") == "В"
    assert fix_russian_handwriting("P") == "Р"

    # Тест комплексного текста
    fixed = fix_russian_handwriting("P@B0T 123")

    assert "РАВОТ" in fixed  # Это то, что реально произойдет
    assert "ИЗЭ" in fixed  # 123 -> ИЗЭ


def test_score_text():
    """Тест оценки качества текста"""
    # Хороший текст
    good_score = score_text("Привет мир! Это хороший текст с кириллицей.")
    assert good_score > 0.7

    # Плохой текст (латиница, символы)
    bad_score = score_text("Hello world! @#$%^&*")
    assert bad_score < 0.3

    # Пустой текст
    assert score_text("") == 0.0
    assert score_text("   ") == 0.0


def test_image_processing(test_images):
    """Тест предобработки изображений"""
    # Тест для PaddleOCR
    paddle_img = enhance_for_paddle(test_images["handwritten"])
    assert paddle_img is not None
    assert len(paddle_img.shape) == 2  # Должно быть grayscale

    # Тест для Tesseract
    tesseract_img = enhance_for_tesseract(test_images["printed"])
    assert tesseract_img is not None
    assert len(tesseract_img.shape) == 2  # Должно быть grayscale