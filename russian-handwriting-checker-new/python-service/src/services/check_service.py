from typing import Dict, Any
from src.ai.llm_service import LLMService

class CheckService:
    def __init__(self):
        self.llm = LLMService(model="qwen2.5:7b")

    async def check_text(self, text: str, check_type: str, custom_prompt: str = None) -> Dict[str, Any]:
        """Центральный сервис проверки текста"""

        prompts = {
            "grammar": "Ты строгий учитель русского языка. Исправь орфографию, пунктуацию и стилистику.",
            "oge_essay": "Ты эксперт по проверке сочинений ОГЭ по русскому языку. Оцени по официальным критериям.",
            "ege_essay": "Ты эксперт по проверке сочинений ЕГЭ по русскому языку.",
            "final_essay": "Ты эксперт по проверке итогового сочинения.",
            "custom": custom_prompt or "Ты помощник учителя русского языка."
        }

        system = prompts.get(check_type, prompts["grammar"])

        user_prompt = f"""
Текст ученика:
{text}

Верни строго JSON:
{{
    "corrected": "полностью исправленный текст",
    "errors": [{{"offset": число, "length": число, "message": "понятное объяснение", "type": "spelling"}}],
    "score": число от 60 до 100,
    "comment": "короткий комментарий учителя"
}}
"""

        raw = await self.llm.generate(prompt=user_prompt, system=system)

        # Парсинг JSON (защита от мусора)
        import re, json
        match = re.search(r'\{[\s\S]*\}', raw)
        data = json.loads(match.group(0)) if match else {}

        # Генерация HTML-подсветки
        highlighted = text
        shift = 0
        for err in sorted(data.get("errors", []), key=lambda x: x.get("offset", 0)):
            start = err.get("offset", 0) + shift
            end = start + err.get("length", 0)
            if start < len(highlighted):
                tag = f'<span style="color:red; text-decoration:underline; font-weight:bold;">{highlighted[start:end]}</span>'
                highlighted = highlighted[:start] + tag + highlighted[end:]
                shift += len(tag) - err.get("length", 0)

        return {
            "corrected_text": data.get("corrected", text),
            "errors": data.get("errors", []),
            "score": float(data.get("score", 75)),
            "comment": data.get("comment", "Анализ выполнен"),
            "check_type": check_type,
            "html_highlighted": highlighted
        }