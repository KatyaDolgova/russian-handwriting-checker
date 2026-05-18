import re
import json
from typing import AsyncIterator
from src.core.logger import get_logger

logger = get_logger(__name__)


class CheckService:
    def __init__(self, llm, function_repo):
        self.llm = llm
        self.function_repo = function_repo

    #основной метод: строит сообщения, стримит, парсит JSON
    async def stream_check(self, text: str, function_id: str) -> AsyncIterator[dict]:
        messages, func = await self._build_messages(text, function_id)
        fn_score_max = getattr(func, "score_max", None)
        fn_min_words = getattr(func, "min_words", None)
        full_text = ""
        async for chunk in self.llm.stream(messages):
            full_text += chunk
            yield {"type": "chunk", "text": chunk}
        result = self._build_result(text, self._parse(full_text), full_text, fn_score_max, fn_min_words)
        yield {"type": "done", "result": result}

    #подставляет текст ученика в шаблон функции через {text}
    async def _build_messages(self, text: str, function_id: str):
        func = await self.function_repo.get(function_id)
        if not func:
            raise ValueError(f"Функция {function_id} не найдена")
        tmpl = (func.user_template or "").strip()
        if not tmpl:
            user_content = text.strip() if text and text.strip() else "Выполни задание."
        elif "{text}" in tmpl:
            user_content = tmpl.replace("{text}", text)
        else:
            user_content = tmpl
        messages = [
            {"role": "system", "content": func.system_prompt},
            {"role": "user", "content": user_content},
        ]
        return messages, func
    
    #формирует итоговый объект с оценкой, ошибками, выделением
    def _build_result(self, original_text: str, data: dict, raw_text: str = "",
                      fn_score_max: int | None = None, fn_min_words: int | None = None) -> dict:
        is_generation = "corrected" not in data and "errors" not in data
        raw_score = data.get("score")
        if raw_score is None:
            score = None
        else:
            try:
                score = float(raw_score)
            except (TypeError, ValueError):
                score = None

        errors = data.get("errors") or []
        corrected = data.get("corrected") or (raw_text.strip() if is_generation else original_text)
        return {
            "corrected_text": corrected,
            "errors": errors,
            "score": score,
            "score_max": fn_score_max,
            "min_words": fn_min_words,
            "score_label": str(raw_score) if raw_score is not None and not isinstance(raw_score, (int, float)) else None,
            "criteria": data.get("criteria"),
            "comment": data.get("comment", ""),
            "html_highlighted": self._highlight(original_text, errors),
            "is_generation": is_generation,
        }

    #парсит JSON из ответа модели, обрабатывает случай когда модель оборачивает ответ в json
    def _parse(self, raw: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        cleaned = re.sub(r"\s*```\s*$", "", cleaned)
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            logger.warning("В ответе модели не найден JSON")
            return {}
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as e:
            logger.warning(f"Ошибка разбора JSON: {e}")
            fixed = re.sub(r",\s*([\]}])", r"\1", match.group(0))
            fixed = re.sub(r"[\x00-\x1f\x7f]", " ", fixed)
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
