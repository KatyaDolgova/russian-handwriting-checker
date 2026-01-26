# -*- coding: utf-8 -*-
"""
Гибридный OCR: PaddleOCR + Tesseract.
Используется для рукописных и печатных заданий по русскому языку.
"""
import sys
import os
import cv2
import numpy as np
import re
from paddleocr import PaddleOCR
import pytesseract
from PIL import Image

DEBUG = False

# === Утилиты ===
def clean_text(text: str) -> str:
    """
    Очищает текст, оставляя:
      - кириллицу (А-Я, а-я, Ёё)
      - латиницу (A-Z, a-z) — для совместимости с опечатками
      - цифры 0-9
      - пробелы и основную пунктуацию: . , ! ? ; : " ' - – —
    """
    allowed = r'А-Яа-яЁёA-Za-z0-9\s\.\,\!\?\;\:\"\'\-–—'
    return re.sub(rf'[^{allowed}]', '', text).strip()

def fix_russian_handwriting(text: str) -> str:
    replacements = [
        ('0', 'О'), ('1', 'И'), ('2', 'З'), ('3', 'Э'), ('4', 'Ч'),
        ('5', 'П'), ('6', 'Б'), ('7', 'Г'), ('8', 'В'), ('9', 'Д'),
        ('A', 'А'), ('B', 'В'), ('C', 'С'), ('E', 'Е'), ('F', 'Ф'),
        ('G', 'Г'), ('H', 'Н'), ('I', 'И'), ('K', 'К'), ('L', 'Л'),
        ('M', 'М'), ('N', 'Н'), ('O', 'О'), ('P', 'Р'), ('Q', 'Я'),
        ('R', 'Р'), ('S', 'С'), ('T', 'Т'), ('U', 'У'), ('V', 'В'),
        ('W', 'В'), ('X', 'Х'), ('Y', 'У'), ('Z', 'З'),
        ('$', 'Р'), ('@', 'А'), ('?', 'Р'), ('!', 'И'), ('.', ''), (',', ''),
        ('"', ''), ("'", ''), ('(', ''), (')', ''), ('-', ''), ('_', ''),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return clean_text(text)


# === Предобработка для PaddleOCR ===
def enhance_for_paddle(image_path: str) -> np.ndarray:
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=15, C=2
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
    return cv2.bitwise_not(cleaned)


# === Предобработка для Tesseract ===
def enhance_for_tesseract(image_path: str) -> np.ndarray:
    # Загрузка изображения через OpenCV (лучше работает с обработкой)
    img = cv2.imread(image_path)
    # Преобразование в оттенки серого
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Инверсия цветов (если текст тёмный на светлом фоне)
    gray = cv2.bitwise_not(gray)
    # Пороговая обработка (бинаризация)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Удаление шума (морфологические операции)
    kernel = np.ones((1, 1), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    # Инверсия обратно (для Tesseract: чёрный текст на белом фоне)
    processed = cv2.bitwise_not(opening)
    return processed

# === Tesseract OCR  ===
def recognize_handwriting(image_path: str) -> str:
    """
    Распознаёт текст на изображении с помощью Tesseract OCR.
    Предполагается, что Tesseract установлен и доступен через PATH.
    """
    # Предобработка
    img_cv = enhance_for_tesseract(image_path)
    # Конвертация в PIL.Image для pytesseract
    img_pil = Image.fromarray(img_cv)
    # Распознавание
    text = pytesseract.image_to_string(
        img_pil,
        lang='rus',
        config='--psm 6 --oem 3'  # psm 6 = блок текста, oem 3 = LSTM
    )
    return text.strip()


# === Основная логика ===
def main():
    if len(sys.argv) < 2:
        print("Использование: python ocr_fallback.py <путь_к_изображению>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.isfile(image_path):
        print(f"Ошибка: файл не найден — {image_path}")
        sys.exit(1)

    print(f"[INFO] Обработка: {image_path}")

    # --- Шаг 1: PaddleOCR ---
    temp_paddle = "temp_paddle.jpg"
    try:
        img_paddle = enhance_for_paddle(image_path)
        cv2.imwrite(temp_paddle, img_paddle)
        ocr = PaddleOCR(lang='ru', use_angle_cls=False, det=True, rec=True, use_gpu=False, show_log=False)
        result = ocr.ocr(temp_paddle, cls=False)
        lines = []
        if result and result[0]:
            for line in result[0]:
                if len(line) >= 2:
                    text, conf = line[1][0], line[1][1]
                    if conf >= 0.3:
                        lines.append(text)
        paddle_text = '\n'.join(lines)
        paddle_clean = fix_russian_handwriting(paddle_text)
        print(f"[PADDLE] Распознано строк: {len(lines)}")
    except Exception as e:
        print(f"[PADDLE] Ошибка: {e}")
        paddle_clean = ""
    finally:
        if os.path.exists(temp_paddle):
            os.remove(temp_paddle)

    # --- Шаг 2: Tesseract (с вашей предобработкой) ---
    try:
        tess_text = recognize_handwriting(image_path)
        tess_clean = fix_russian_handwriting(tess_text)
        print(f"[TESSERACT] Распознано текст (длина: {len(tess_clean)})")
    except Exception as e:
        print(f"[TESSERACT] Ошибка: {e}")
        tess_clean = ""

    # --- Выбор лучшего результата ---
    def score_text(text, name=""):
        if not text:
            print(f"[DEBUG] {name}: пустой текст, оценка 0")
            return 0

        cyr_chars = len(re.findall(r'[А-Яа-яЁё]', text))
        cyr_ratio = cyr_chars / len(text) if len(text) > 0 else 0

        # Только реальные слова, не из 1 символа, без латиницы внутри
        words = re.findall(r'[А-Яа-яЁё]{2,}', text)
        valid_words = [w for w in words if not re.search(r'[A-Za-z0-9]', w)]
        readability = len(valid_words) * 2 / len(text) if len(text) > 0 else 0

        # Длина
        length_score = min(len(text) / 1000, 0.2)

        # Увеличение веса читаемости и длины, уменьшение кириллицы
        score = cyr_ratio * 0.2 + readability * 0.6 + length_score

        print(f"[DEBUG] {name}: длина={len(text)}, кириллица={cyr_ratio:.2f}, слов={len(valid_words)}, оценка={score:.3f}")
        return score

    paddle_score = score_text(paddle_clean, "Paddle")
    tess_score = score_text(tess_clean, "Tesseract")

    best_text, source, raw = (
        (paddle_clean, "PaddleOCR", paddle_text)
        if paddle_score >= tess_score
        else (tess_clean, "Tesseract", tess_text)
    )

    print(f"\n=== Лучший результат ({source}) ===")
    print(best_text or "[Пусто]")

    # Сохранение деталей
    with open("result.txt", "w", encoding="utf-8") as f:
        f.write(f"Источник: {source}\n")
        f.write(f"Оценка: {max(paddle_score, tess_score):.3f}\n")
        f.write("=" * 60 + "\n")
        f.write("Оригинальный результат:\n")
        f.write(raw + "\n\n")
        f.write("После коррекции:\n")
        f.write(best_text)

    print(f"\n[INFO] Полный отчёт сохранён в: result.txt")


if __name__ == "__main__":
    main()