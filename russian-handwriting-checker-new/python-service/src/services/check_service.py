import re
import json
from typing import AsyncIterator
from src.core.logger import get_logger

logger = get_logger(__name__)


class CheckService:
    def __init__(self, llm, function_repo):
        self.llm = llm
        self.function_repo = function_repo

    async def run_check(self, text: str, function_id: str) -> dict:
        messages = await self._build_messages(text, function_id)
        raw = await self.llm.generate(messages)
        logger.info(f"LLM raw response length: {len(raw)}")
        return self._build_result(text, self._parse(raw), raw)

    async def stream_check(self, text: str, function_id: str) -> AsyncIterator[dict]:
        messages = await self._build_messages(text, function_id)
        full_text = ""
        async for chunk in self.llm.stream(messages):
            full_text += chunk
            yield {"type": "chunk", "text": chunk}
        result = self._build_result(text, self._parse(full_text), full_text)
        yield {"type": "done", "result": result}

    async def _build_messages(self, text: str, function_id: str) -> list:
        func = await self.function_repo.get(function_id)
        if not func:
            raise ValueError(f"Function {function_id} not found")
        tmpl = (func.user_template or "").strip()
        if not tmpl:
            # Шаблон пустой — отправляем текст напрямую или дефолтную команду
            user_content = text.strip() if text and text.strip() else "Выполни задание."
        elif "{text}" in tmpl:
            user_content = tmpl.replace("{text}", text)
        else:
            # Шаблон есть, но без {text} — например, "Придумай тему для сочинения"
            user_content = tmpl
        return [
            {"role": "system", "content": func.system_prompt},
            {"role": "user", "content": user_content},
        ]

    def _build_result(self, original_text: str, data: dict, raw_text: str = "") -> dict:
        is_generation = "corrected" not in data and "errors" not in data
        raw_score = data.get("score", 0 if is_generation else 75)
        try:
            score = float(raw_score)
        except (TypeError, ValueError):
            score = 0.0

        errors = data.get("errors") or []
        corrected = data.get("corrected") or (raw_text.strip() if is_generation else original_text)
        return {
            "corrected_text": corrected,
            "errors": errors,
            "score": score,
            "score_label": str(raw_score) if not isinstance(raw_score, (int, float)) else None,
            "criteria": data.get("criteria"),
            "comment": data.get("comment", ""),
            "html_highlighted": self._highlight(original_text, errors),
            "is_generation": is_generation,
        }

    def _parse(self, raw: str) -> dict:
        # Try to extract a JSON block from anywhere in the response
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            logger.warning("LLM response contains no JSON block")
            return {}
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e}")
            # Try to fix common LLM JSON issues: trailing commas
            fixed = re.sub(r",\s*([\]}])", r"\1", match.group(0))
            try:
                return json.loads(fixed)
            except json.JSONDecodeError:
                return {}

    def _highlight(self, text: str, errors: list) -> str:
        result = text
        for e in errors:
            original = e.get("original", "")
            if not original or len(original) < 2:
                continue
            try:
                result = re.sub(
                    re.escape(original),
                    f'<span class="error-highlight">{original}</span>',
                    result,
                    count=1,
                )
            except re.error:
                continue
        return result
