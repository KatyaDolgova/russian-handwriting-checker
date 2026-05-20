import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.check_service import CheckService


def make_service(llm_response="", func=None):
    llm = AsyncMock()
    llm.generate = AsyncMock(return_value=llm_response)

    repo = AsyncMock()
    if func is None:
        func = MagicMock()
        func.system_prompt = "Ты учитель."
        func.user_template = "Проверь:\n\n{text}"
    repo.get = AsyncMock(return_value=func)

    return CheckService(llm, repo)


class TestParse:
    def setup_method(self):
        self.svc = make_service()

    def test_parses_valid_json(self):
        raw = '{"score": 80, "errors": []}'
        assert self.svc._parse(raw) == {"score": 80, "errors": []}

    def test_extracts_json_from_text(self):
        raw = 'Вот результат: {"score": 90} — готово'
        result = self.svc._parse(raw)
        assert result["score"] == 90

    def test_returns_empty_on_no_json(self):
        assert self.svc._parse("просто текст без JSON") == {}

    def test_fixes_trailing_comma(self):
        raw = '{"score": 80, "errors": [],}'
        result = self.svc._parse(raw)
        assert result.get("score") == 80

    def test_returns_empty_on_invalid_json(self):
        result = self.svc._parse("{invalid json {{{{")
        assert result == {}

    def test_nested_json(self):
        raw = '{"errors": [{"original": "тест", "correction": "Тест"}]}'
        result = self.svc._parse(raw)
        assert len(result["errors"]) == 1


class TestBuildResult:
    def setup_method(self):
        self.svc = make_service()

    def test_normal_check_result(self):
        data = {"score": 75, "errors": [{"original": "тест"}], "corrected": "Тест"}
        result = self.svc._build_result("тест", data)
        assert result["score"] == 75.0
        assert result["is_generation"] is False
        assert len(result["errors"]) == 1

    def test_generation_result(self):
        data = {"comment": "Сгенерировано"}
        result = self.svc._build_result("", data, "Результат генерации")
        assert result["is_generation"] is True
        assert result["errors"] == []
        assert result["corrected_text"] == "Результат генерации"

    def test_generation_score_defaults_to_zero(self):
        data = {"comment": "ok"}
        result = self.svc._build_result("", data)
        assert result["score"] == 0.0

    def test_invalid_score_defaults_to_zero(self):
        data = {"score": "не число", "corrected": "текст", "errors": []}
        result = self.svc._build_result("текст", data)
        assert result["score"] == 0.0

    def test_float_score_preserved(self):
        data = {"score": 85.5, "corrected": "текст", "errors": []}
        result = self.svc._build_result("текст", data)
        assert result["score"] == 85.5

    def test_html_highlighted_in_result(self):
        data = {"score": 50, "corrected": "текст", "errors": [{"original": "тест"}]}
        result = self.svc._build_result("тест", data)
        assert "html_highlighted" in result

    def test_comment_in_result(self):
        data = {"score": 80, "corrected": "текст", "errors": [], "comment": "Хорошо"}
        result = self.svc._build_result("текст", data)
        assert result["comment"] == "Хорошо"


class TestHighlight:
    def setup_method(self):
        self.svc = make_service()

    def test_wraps_error_in_span(self):
        errors = [{"original": "тест"}]
        result = self.svc._highlight("тест слово", errors)
        assert '<span class="error-highlight">тест</span>' in result

    def test_skips_short_originals(self):
        errors = [{"original": "а"}]
        result = self.svc._highlight("а б в", errors)
        assert "<span" not in result

    def test_skips_empty_original(self):
        errors = [{"original": ""}]
        result = self.svc._highlight("текст", errors)
        assert "<span" not in result

    def test_no_errors_returns_original(self):
        assert self.svc._highlight("текст", []) == "текст"

    def test_highlights_only_first_occurrence(self):
        errors = [{"original": "тест"}]
        result = self.svc._highlight("тест тест", errors)
        assert result.count("<span") == 1

    def test_multiple_errors(self):
        errors = [{"original": "ошибка"}, {"original": "слово"}]
        result = self.svc._highlight("ошибка и слово", errors)
        assert result.count("<span") == 2


class TestBuildMessages:
    def test_injects_text_into_template(self):
        func = MagicMock()
        func.system_prompt = "Ты учитель."
        func.user_template = "Проверь:\n\n{text}"
        svc = make_service(func=func)

        import asyncio
        messages = asyncio.get_event_loop().run_until_complete(
            svc._build_messages("мой текст", "func-1")
        )
        assert messages[0]["role"] == "system"
        assert "мой текст" in messages[1]["content"]

    def test_no_template_sends_text_directly(self):
        func = MagicMock()
        func.system_prompt = "Ты учитель."
        func.user_template = ""
        svc = make_service(func=func)

        import asyncio
        messages = asyncio.get_event_loop().run_until_complete(
            svc._build_messages("мой текст", "func-1")
        )
        assert messages[1]["content"] == "мой текст"

    def test_template_without_placeholder_used_verbatim(self):
        func = MagicMock()
        func.system_prompt = "Ты учитель."
        func.user_template = "Придумай тему для сочинения"
        svc = make_service(func=func)

        import asyncio
        messages = asyncio.get_event_loop().run_until_complete(
            svc._build_messages("игнорируется", "func-1")
        )
        assert messages[1]["content"] == "Придумай тему для сочинения"

    def test_raises_if_function_not_found(self):
        llm = AsyncMock()
        repo = AsyncMock()
        repo.get = AsyncMock(return_value=None)
        svc = CheckService(llm, repo)

        import asyncio
        with pytest.raises(ValueError, match="not found"):
            asyncio.get_event_loop().run_until_complete(
                svc._build_messages("текст", "missing-id")
            )
