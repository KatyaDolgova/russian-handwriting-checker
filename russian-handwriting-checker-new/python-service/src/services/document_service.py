from src.converters.document_converter import DocumentConverter

class DocumentService:
    def __init__(self):
        self.converter = DocumentConverter()

    async def process(self, file_path: str) -> str:
        return await self.converter.convert(file_path)