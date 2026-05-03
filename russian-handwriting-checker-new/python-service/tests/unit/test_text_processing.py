import pytest
from src.utils.text_processing import clean_text, fix_russian_handwriting, score_text


class TestCleanText:
    def test_keeps_cyrillic_and_latin(self):
        assert clean_text("Привет Hello") == "Привет Hello"

    def test_removes_special_symbols(self):
        result = clean_text("Текст # @ * ^ ~")
        assert "#" not in result
        assert "@" not in result
        assert "Текст" in result

    def test_keeps_punctuation(self):
        result = clean_text("Привет, мир! Как дела?")
        assert "," in result
        assert "!" in result
        assert "?" in result

    def test_keeps_digits(self):
        assert "123" in clean_text("abc 123 xyz")

    def test_strips_whitespace(self):
        assert clean_text("  текст  ") == "текст"

    def test_empty_string(self):
        assert clean_text("") == ""

    def test_only_forbidden_chars(self):
        assert clean_text("###^^^***") == ""


class TestFixRussianHandwriting:
    def test_replaces_latin_o_with_cyrillic(self):
        result = fix_russian_handwriting("O")
        assert "О" in result

    def test_replaces_digit_0_with_O(self):
        result = fix_russian_handwriting("0")
        assert "О" in result

    def test_removes_dots_and_commas(self):
        result = fix_russian_handwriting("Привет.")
        assert "." not in result

    def test_mixed_input(self):
        result = fix_russian_handwriting("AВ")
        assert "А" in result

    def test_empty_string(self):
        assert fix_russian_handwriting("") == ""

    def test_calls_clean_text_after(self):
        # result should be stripped and free of forbidden chars
        result = fix_russian_handwriting("  A  ")
        assert result == result.strip()


class TestScoreText:
    def test_empty_returns_zero(self):
        assert score_text("") == 0.0

    def test_short_text_returns_zero(self):
        assert score_text("аб") == 0.0

    def test_pure_cyrillic_scores_high(self):
        text = "Привет мир хорошая погода сегодня отличная"
        score = score_text(text)
        assert score > 0.5

    def test_junk_text_scores_low(self):
        score = score_text("!!! @@@ ### $$$")
        assert score < 0.3

    def test_score_in_range(self):
        for text in ["", "abc", "Привет мир", "###", "Текст с ошибками и словами"]:
            s = score_text(text)
            assert 0.0 <= s <= 1.0

    def test_yo_normalized(self):
        # ё and е should be treated the same
        s1 = score_text("ёлка ёжик ёмкость")
        s2 = score_text("елка ежик емкость")
        assert abs(s1 - s2) < 0.01
