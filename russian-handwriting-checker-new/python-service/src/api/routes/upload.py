from fastapi import APIRouter, UploadFile, File
from pathlib import Path
import shutil
from uuid import uuid4
from src.services.document_service import DocumentService

router = APIRouter(prefix="/upload")

TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)

doc_service = DocumentService()

@router.post("/")
async def upload(file: UploadFile = File(...)):
    path = TEMP_DIR / f"{uuid4()}_{file.filename}"

    try:
        with open(path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        text = await doc_service.process(str(path))

        return {"success": True, "filename": file.filename, "raw_text": text}
    finally:
        path.unlink(missing_ok=True)