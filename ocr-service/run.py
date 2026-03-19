#!/usr/bin/env python3
"""
Скрипт запуска OCR-сервиса
Использование: python run.py <путь_к_изображению>
"""
import sys
import os

# Добавляем src в путь поиска модулей
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

if __name__ == "__main__":
    # Передаем аргументы напрямую в app.main()
    from app import main
    main()