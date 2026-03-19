# tests/test_rest_api_integration.py
import pytest
from fastapi.testclient import TestClient
from src.rest_api import app
import os

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_process_image_success(test_images):
    # Подготовка
    image_path = test_images["handwritten"] 
    with open(image_path, 'rb') as f:
        image_data = f.read()

    # Вызов
    with open(image_path, 'rb') as image_file:
        response = client.post(
            "/ocr/process-image/",
            files={"file": (os.path.basename(image_path), image_file, "image/jpeg")}
        )

    # Проверка
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["text"], str)
    assert isinstance(data["confidence"], float)
    assert data["confidence"] >= 0.0
    assert data["source_algorithm"] in ["PaddleOCR", "Tesseract"]
    assert isinstance(data["processing_time"], float)
    assert data["processing_time"] >= 0
    assert isinstance(data["errors"], list)
    assert len(data["errors"]) == 0 # Нет ошибок при успешной обработке

def test_process_image_invalid_file():
    # Вызов с не-изображением
    response = client.post(
        "/ocr/process-image/",
        files={"file": ("not_an_image.txt", b"fake image content", "text/plain")}
    )

    # Проверка
    assert response.status_code == 400 # Ошибка валидации

def test_process_image_large_or_corrupted(test_images):
    # Подготовка: пустое изображение
    image_path = test_images["empty"]
    with open(image_path, 'rb') as image_file:
        response = client.post(
            "/ocr/process-image/",
            files={"file": (os.path.basename(image_path), image_file, "image/jpeg")}
        )

    # Проверка: сервер не должен упасть, но может вернуть низкую уверенность
    assert response.status_code == 200 # Сервер должен обработать
    data = response.json()
    assert "success" in data
    assert "text" in data
    assert "confidence" in data
