from src.core.task_store import tasks
from src.services.document_service import DocumentService
from pathlib import Path

class OCRService:

    def __init__(self):
        self.doc_service = DocumentService()

    async def process_file(self, file_path, task_id):
        try:
            text = await self.doc_service.process(file_path)

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
