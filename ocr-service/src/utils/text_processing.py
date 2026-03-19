import re
def clean_text(text: str) -> str:
    """
    Очищает текст, оставляя:
      - кириллицу (А-Я, а-я, Ёё)
      - латиницу (A-Z, a-z) — для совместимости с опечатками
      - цифры 0-9
      - пробелы и основную пунктуацию
    """
    allowed = r'А-Яа-яЁёA-Za-z0-9\s\.\,\!\?\;\:\"\'\-–—'
    return re.sub(rf'[^{allowed}]', '', text).strip()


def fix_russian_handwriting(text: str) -> str:
    """
    Коррекция типичных ошибок распознавания рукописного текста
    """
    replacements = [
        ('0', 'О'), ('1', 'И'), ('2', 'З'), ('3', 'Э'), ('4', 'Ч'),
        ('5', 'П'), ('6', 'Б'), ('7', 'Г'), ('8', 'В'), ('9', 'Д'),
        ('A', 'А'), ('B', 'В'), ('C', 'С'), ('E', 'Е'), ('F', 'Ф'),
        ('G', 'Г'), ('H', 'Н'), ('I', 'И'), ('K', 'К'), ('L', 'Л'),
        ('M', 'М'), ('N', 'Н'), ('O', 'О'), ('P', 'Р'), ('Q', 'Я'),
        ('R', 'Р'), ('S', 'С'), ('T', 'Т'), ('U', 'У'), ('V', 'В'),
        ('W', 'В'), ('X', 'Х'), ('Y', 'У'), ('Z', 'З'),
        ('$', 'Р'), ('@', 'А'), ('?', 'Р'), ('!', 'И'), ('.', ''), (',', ''),
        ('"', ''), ("'", ''), ('(', ''), (')', ''), ('-', ''), ('_', ''),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return clean_text(text)


def score_text(text: str) -> float:
    """
    Оценивает качество текста
    """
    if not text or len(text) < 5:
        return 0.0

    # Процент кириллических символов
    cyr_chars = len(re.findall(r'[А-Яа-яЁё]', text))
    cyr_ratio = cyr_chars / len(text)

    # Количество "читаемых" слов (минимум 2 символа, только кириллица)
    words = re.findall(r'[А-Яа-яЁё]{2,}', text)
    valid_words = [w for w in words if len(w) >= 2]

    # Плотность слов в тексте
    word_density = len(valid_words) / max(len(text.split()), 1)

    # Длина осмысленного текста
    meaningful_length = sum(len(w) for w in valid_words)
    length_ratio = min(meaningful_length / 100, 1.0)  # Нормализация
    # Итоговая оценка с весами
    score = (
            0.4 * cyr_ratio +  # Важность кириллицы
            0.4 * word_density +  # Важность читаемых слов
            0.2 * length_ratio  # Важность длины
    )

    # Штраф за подозрительные символы
    suspicious_chars = len(re.findall(r'[^\sА-Яа-яЁёA-Za-z0-9.,!?;:\-\"\'()]+', text))
    penalty = min(suspicious_chars / max(len(text), 1), 0.3)

    return max(0.0, min(1.0, score - penalty))