import time
import base64
import requests
from .base_strategy import OCRStrategy, OcrResult
from ..utils.text_processing import clean_text
from ..core.config import settings
from ..core.logger import get_logger

logger = get_logger("yandex_vision_strategy")

YANDEX_VISION_URL = "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze"


class YandexVisionStrategy(OCRStrategy):
    def __init__(self):
        self.name = "YandexVision"
        self.available = bool(settings.yandex_vision_api_key)
        if not self.available:
            logger.info("Yandex Vision недоступен: не задан YANDEX_VISION_API_KEY")

    def get_name(self) -> str:
        return self.name

    def recognize(self, image_path: str) -> OcrResult:
        if not self.available:
            return OcrResult(text="", confidence=0.0, processing_time=0.0)

        start_time = time.time()
        try:
            with open(image_path, "rb") as f:
                image_b64 = base64.b64encode(f.read()).decode()

            payload = {
                "analyzeSpecs": [
                    {
                        "content": image_b64,
                        "features": [
                            {
                                "type": "TEXT_DETECTION",
                                "textDetectionConfig": {"languageCodes": ["ru"]},
                            }
                        ],
                    }
                ]
            }
            headers = {
                "Authorization": f"Api-Key {settings.yandex_vision_api_key}",
                "Content-Type": "application/json",
            }
            response = requests.post(
                YANDEX_VISION_URL, json=payload, headers=headers, timeout=30
            )
            response.raise_for_status()
            data = response.json()

            pages = data["results"][0]["results"][0]["textDetection"]["pages"]
            lines = []
            confidences = []
            for page in pages:
                for block in page.get("blocks", []):
                    for line in block.get("lines", []):
                        words = [
                            w["text"] for w in line.get("words", []) if w.get("text")
                        ]
                        if words:
                            lines.append(" ".join(words))
                        for w in line.get("words", []):
                            if "confidence" in w:
                                confidences.append(float(w["confidence"]))

            raw_text = "\n".join(lines)
            final_text = clean_text(raw_text)
            avg_conf = (
                sum(confidences) / len(confidences)
                if confidences
                else self._calculate_confidence(final_text)
            )

            return OcrResult(
                text=final_text,
                confidence=avg_conf,
                processing_time=time.time() - start_time,
            )

        except Exception as e:
            logger.error("Yandex Vision ошибка: %s", e)
            return OcrResult(
                text="", confidence=0.0, processing_time=time.time() - start_time
            )
