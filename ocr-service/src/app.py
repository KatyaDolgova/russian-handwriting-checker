import sys
import json
import os
from .services.ocr_service import OCRService

def main():
    """Точка входа в приложение"""
    if len(sys.argv) < 2:
        print("Использование: python -m src.app <путь_к_изображению>")
        print("Пример: python -m src.app test_images/handwritten.jpg")
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.isfile(image_path):
        print(f"Ошибка: файл не найден — {image_path}")
        sys.exit(1)

    print(f"\n{'=' * 60}")
    print(f"ЗАПУСК OCR-СЕРВИСА")
    print(f"Изображение: {image_path}")
    print(f"{'=' * 60}\n")

    # Обработка изображения
    result = OCRService.process_image(image_path)

    # Вывод результата
    print(f"\n{'=' * 60}")
    print("РЕЗУЛЬТАТЫ РАСПОЗНАВАНИЯ")
    print(f"{'=' * 60}")

    if result["success"]:
        print(f"\nРАСПОЗНАННЫЙ ТЕКСТ ({result['selected_strategy']}):")
        print("-" * 60)
        print(result["text"])
        print("-" * 60)
        print(f"\nМЕТРИКИ:")
        print(f"  Уверенность: {result['confidence']:.3f}")
        print(f"  Время обработки: {result['processing_time']:.2f} сек")
        print(f"  Стратегия: {result['selected_strategy']}")

        if result["metadata"]["raw_text"]:
            print(f"\nСЫРОЙ ТЕКСТ (до постобработки):")
            print("-" * 60)
            print(result["metadata"]["raw_text"][:200] + "..." if len(result["metadata"]["raw_text"]) > 200 
        else
            result["metadata"]["raw_text"])
    else:
        print(f"\nОШИБКА: {result.get('error', 'Неизвестная ошибка')}")
        print(f"ДЕТАЛИ: {result.get('message', '')}")

    # Сохранение результата в файл
    output_file = "ocr_result.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"РЕЗУЛЬТАТ СОХРАНЕН В: {output_file}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()