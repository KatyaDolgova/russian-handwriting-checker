from src.core.task_store import tasks
from src.services.document_service import DocumentService
from src.services.llm_service import LLMService
from src.core.logger import get_logger
from pathlib import Path

logger = get_logger(__name__)


class OCRService:

    def __init__(self):
        self.doc_service = DocumentService()
        self.llm = LLMService()

    async def _correct_ocr(self, raw_text: str) -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "Ты — инструмент очистки текста после OCR-распознавания рукописи.\n"
                    "Твоя задача: убрать только артефакты распознавания, не трогая содержание.\n\n"
                    "Исправляй:\n"
                    "- перепутанные символы из-за похожего начертания: ш↔и, л↔п, 0↔О, 8↔В, з↔з, р↔р\n"
                    "- слипшиеся слова: «онпошёл» → «он пошёл»\n"
                    "- разорванные слова: «до го вор» → «договор»\n"
                    "- случайные лишние символы от шума на изображении\n\n"
                    "Не исправляй:\n"
                    "- орфографические ошибки автора\n"
                    "- пунктуацию\n"
                    "- грамматику\n"
                    "- стиль и формулировки\n\n"
                    "Верни только очищенный текст без пояснений."
                ),
            },
            {"role": "user", "content": raw_text},
        ]
        result = ""
        async for chunk in self.llm.stream(messages):
            result += chunk
        return result.strip()

    async def process_file(self, file_path, task_id):
        try:
            raw_text = await self.doc_service.process(file_path)
            logger.info("OCR завершён, запускаем коррекцию через LLM")
            text = await self._correct_ocr(raw_text)

            tasks[task_id] = {
                "status": "done",
                "text": text
            }

        except Exception as e:
            tasks[task_id] = {
                "status": "error",
                "error": str(e)
            }

        finally:
            Path(file_path).unlink(missing_ok=True)
