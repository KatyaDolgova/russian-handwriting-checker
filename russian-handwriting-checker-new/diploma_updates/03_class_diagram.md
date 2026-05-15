# Диаграмма классов — обновлённая версия
# Изменения помечены [ОБНОВЛЕНО] и [НОВОЕ]
# Структура: 4 группы классов (цвет в диаграмме на твоё усмотрение)

================================================================================
ГРУППА 1: ДОМЕННЫЕ МОДЕЛИ (таблицы БД)
================================================================================

┌─────────────────────────────────────────────────────┐
│                      Check                          │  [ОБНОВЛЕНО]
├─────────────────────────────────────────────────────┤
│ + id: str                                           │
│ + user_id: str                                      │
│ + pupil_id: str | None                              │
│ + function_id: str                                  │
│ + folder_id: str | None                             │
│ + filename: str                                     │
│ + title: str | None                                 │
│ + source_text: str | None        ← для исходного    │
│ + original_text: str             ← текст ученика    │
│ + corrected_text: str                               │
│ + errors: JSON | None            ← массив ошибок    │
│ + criteria: JSONB | None         ← [НОВОЕ] баллы    │
│ + pass_fail: str | None          ← [НОВОЕ] зачёт    │
│ + score: float | None                               │
│ + score_max: float | None                           │
│ + comment: str                                      │
│ + work_date: datetime | None                        │
│ + created_at: datetime                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    Function                         │  [ОБНОВЛЕНО]
├─────────────────────────────────────────────────────┤
│ + id: str                                           │
│ + user_id: str | None                               │
│ + name: str                                         │
│ + description: str                                  │
│ + system_prompt: str                                │
│ + user_template: str                                │
│ + score_max: int | None          ← [НОВОЕ]          │
│ + min_words: int | None          ← [НОВОЕ]          │
│ + is_default: bool                                  │
│ + is_published: bool                                │
│ + original_function_id: str | None                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  FunctionVersion                    │
├─────────────────────────────────────────────────────┤
│ + id: str                                           │
│ + function_id: str                                  │
│ + version_number: int                               │
│ + name: str                                         │
│ + description: str                                  │
│ + system_prompt: str                                │
│ + user_template: str                                │
│ + change_note: str | None                           │
│ + created_at: datetime                              │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│            Pupil                 │
├──────────────────────────────────┤
│ + id: str                        │
│ + user_id: str                   │
│ + name: str                      │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│            Group                 │
├──────────────────────────────────┤
│ + id: str                        │
│ + user_id: str                   │
│ + name: str                      │
│ + description: str | None        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│           PupilGroup             │
├──────────────────────────────────┤
│ + pupil_id: str (FK → Pupil)     │
│ + group_id: str (FK → Group)     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│            Folder                │
├──────────────────────────────────┤
│ + id: str                        │
│ + user_id: str                   │
│ + name: str                      │
│ + description: str | None        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│          UserProfile             │
├──────────────────────────────────┤
│ + user_id: str (PK)              │
│ + display_name: str | None       │
│ + bio: str | None                │
└──────────────────────────────────┘


================================================================================
ГРУППА 2: СЕРВИСЫ (бизнес-логика)
================================================================================

┌──────────────────────────────────────────────────────────────────┐
│                        CheckService                              │  [ОБНОВЛЕНО]
├──────────────────────────────────────────────────────────────────┤
│ - llm: LLMService                                                │
│ - function_repo: FunctionRepository                              │
├──────────────────────────────────────────────────────────────────┤
│ + run_check(text, function_id) → dict                            │
│ + stream_check(text, function_id) → AsyncIterator[dict]          │
│ - _build_messages(text, function_id) → (messages, Function)      │
│ - _build_result(original_text, data, raw, fn_score_max,          │
│                 fn_min_words) → dict                             │
│   Возвращает: corrected_text, errors, score, score_max,          │
│              pass_fail, criteria, min_words, score_label,        │
│              html_highlighted, comment, is_generation            │
│ - _parse(raw: str) → dict   [ОБНОВЛЕНО: очистка ```json```]      │
│ - _highlight(text, errors) → str                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                    LLMService                        │
├──────────────────────────────────────────────────────┤
│ - client: AsyncOpenAI                                │
├──────────────────────────────────────────────────────┤
│ + generate(messages, timeout) → str                  │
│   max_tokens = 8000                                  │
│ + stream(messages, timeout) → AsyncIterator[str]     │
│   max_tokens = 8000                                  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  DocumentConverter                   │
├──────────────────────────────────────────────────────┤
│ - ocr: HybridOCR                                     │
├──────────────────────────────────────────────────────┤
│ + process_file(path, task_id) → None                 │
│ - _is_image(path) → bool                             │
│ - _convert_document(path) → str                      │
└──────────────────────────────────────────────────────┘


================================================================================
ГРУППА 3: СТРАТЕГИИ OCR (паттерн Strategy)
================================================================================

┌──────────────────────────────────────────────────────┐
│             <<interface>> OCRStrategy                │
├──────────────────────────────────────────────────────┤
│ + recognize(image_path: str) → OcrResult             │
│ + get_name() → str                                   │
└──────────────────────────────────────────────────────┘
            △                     △
            │ implements           │ implements
┌───────────┴──────────┐  ┌───────┴─────────────────┐
│   PaddleOCRStrategy  │  │   TesseractStrategy      │
├──────────────────────┤  ├─────────────────────────┤
│ + recognize(...)     │  │ + recognize(...)         │
│ + get_name()→«Paddle»│  │ + get_name()→«Tesseract» │
└──────────────────────┘  └─────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          HybridOCR                               │
├──────────────────────────────────────────────────────────────────┤
│ - strategies: list[OCRStrategy]  ◆ (композиция)                  │
├──────────────────────────────────────────────────────────────────┤
│ + recognize(image_path) → OcrResult                              │
│   score = 0.7 × confidence + 0.3 × text_quality                  │
│   выбирает стратегию с наибольшим score                          │
└──────────────────────────────────────────────────────────────────┘

Вспомогательные функции (image_processing.py):
  _imread_unicode(path) → ndarray   — чтение через np.fromfile(),
                                      поддержка кириллических имён на Windows
  enhance_for_paddle(path) → ndarray
  enhance_for_tesseract(path) → ndarray


================================================================================
ГРУППА 4: РЕПОЗИТОРИИ (паттерн Repository)
================================================================================

┌──────────────────────────────────────────────────────┐
│               CheckRepository                        │
├──────────────────────────────────────────────────────┤
│ + create(data: dict) → Check                         │
│ + get(check_id) → Check | None                       │
│ + get_by_user(user_id) → list[dict]                  │
│ + update(check_id, data) → Check | None              │
│ + delete(check_id) → None                            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              FunctionRepository                      │  [ОБНОВЛЕНО]
├──────────────────────────────────────────────────────┤
│ + list(user_id) → list[Function]                     │
│ + get(function_id) → Function | None                 │
│ + create(data, user_id) → Function                   │
│ + update(function_id, data) → Function               │
│ + delete(function_id) → None                         │
│ + list_gallery(user_id, search) → list[dict]         │
│ + publish(function_id, change_note) → Function       │
│ + republish(function_id, change_note) → Function     │
│ + copy(function_id, user_id) → Function              │
│ + get_versions(function_id) → list[FunctionVersion]  │
│ + create_version(function_id, change_note)           │  ← [НОВОЕ]
│     → FunctionVersion                                │
│ + delete_version(version_id) → None                  │  ← [НОВОЕ]
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│               PupilRepository                        │
├──────────────────────────────────────────────────────┤
│ + list(user_id) → list[Pupil]                        │
│ + create(data, user_id) → Pupil                      │
│ + update(pupil_id, data) → Pupil                     │
│ + delete(pupil_id) → None                            │
│ + get_with_stats(user_id) → list[dict]               │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│               GroupRepository                        │
├──────────────────────────────────────────────────────┤
│ + list(user_id) → list[Group]                        │
│ + create(data, user_id) → Group                      │
│ + update(group_id, data) → Group                     │
│ + delete(group_id) → None                            │
│ + add_pupil(group_id, pupil_id) → None               │
│ + remove_pupil(group_id, pupil_id) → None            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│               FolderRepository                       │
├──────────────────────────────────────────────────────┤
│ + list(user_id) → list[Folder]                       │
│ + create(data, user_id) → Folder                     │
│ + update(folder_id, data) → Folder                   │
│ + delete(folder_id) → None                           │
└──────────────────────────────────────────────────────┘


================================================================================
СВЯЗИ МЕЖДУ КЛАССАМИ
================================================================================

CheckService     ──→  LLMService              (зависимость, создаётся через DI)
CheckService     ──→  FunctionRepository      (зависимость)
DocumentConverter ◆─→ HybridOCR              (композиция)
HybridOCR        ◆─→ OCRStrategy[]           (композиция, список стратегий)
PaddleOCRStrategy ─△─ OCRStrategy            (реализация интерфейса)
TesseractStrategy ─△─ OCRStrategy            (реализация интерфейса)

Check            ──→  Function               (function_id FK)
Check            ──→  Pupil                  (pupil_id FK, nullable)
Check            ──→  Folder                 (folder_id FK, nullable)
FunctionVersion  ──→  Function               (function_id FK)
PupilGroup       ──→  Pupil                  (pupil_id FK)
PupilGroup       ──→  Group                  (group_id FK)
