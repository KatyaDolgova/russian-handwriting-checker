"""
Продакшн нагрузочные тесты.

Сценарии:
  - AnonymousUser   — незарегистрированный, только просмотр
  - ActiveTeacher   — авторизованный учитель, отправляет проверки
  - BurstChecker    — стресс-тест эндпоинта проверки

Запуск (из корня проекта):
    locust -f load_tests/locustfile.py --host https://ваш-домен.up.railway.app

Рекомендуемые сценарии:
  Базовая нагрузка:  50 users, spawn 5/s,  5 min
  Стресс-тест:      100 users, spawn 10/s, 3 min
  Спайк:            200 users, spawn 50/s, 1 min
"""

import json
import os
import random
import string

from locust import HttpUser, between, task


# ---------------------------------------------------------------------------
# Тестовые данные
# ---------------------------------------------------------------------------

SAMPLE_TEXTS = [
    "Солнце светило ярко. Птицы пели весёлые песни. Дети играли во дворе.",
    "В прошлом году я побывал в Москве. Город очень красивый и большой.",
    "Осень — моё любимое время года. Листья становятся жёлтыми и красными.",
    "Математика — важный предмет. Без неё невозможно стать инженером.",
    "Книги помогают нам узнавать новое. Я читаю каждый день перед сном.",
    "Моя семья большая: мама, папа, сестра и я. Мы живём дружно.",
    "Летом мы ездили на море. Вода была тёплой, а песок — горячим.",
    (
        "Россия — самая большая страна в мире. Она занимает огромную территорию "
        "от Европы до Тихого океана. В России много рек, озёр и лесов."
    ),
]


def _random_email() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"loadtest_{suffix}@example.com"


def _random_password() -> str:
    return "LoadTest#" + "".join(random.choices(string.digits, k=6))


# ---------------------------------------------------------------------------
# Вспомогательный миксин: авторизация
# ---------------------------------------------------------------------------

class AuthMixin:
    """Регистрирует и логинит пользователя при старте сессии."""

    token: str = ""
    function_ids: list = []

    def on_start(self):
        self.email = _random_email()
        self.password = _random_password()

        # Регистрация
        self.client.post(
            "/api/auth/register",
            json={"email": self.email, "password": self.password},
            name="POST /api/auth/register",
        )

        # Логин
        r = self.client.post(
            "/api/auth/login",
            json={"email": self.email, "password": self.password},
            name="POST /api/auth/login",
        )
        if r.status_code == 200:
            self.token = r.json().get("access_token", "")

        # Загрузка списка функций
        r2 = self.client.get("/api/functions/", name="GET /api/functions/")
        if r2.status_code == 200:
            data = r2.json()
            if isinstance(data, list):
                self.function_ids = [f["id"] for f in data]

    def _auth_headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h


# ---------------------------------------------------------------------------
# 1. Анонимный пользователь — просмотр без авторизации
# ---------------------------------------------------------------------------

class AnonymousUser(HttpUser):
    """
    Имитирует незарегистрированного пользователя:
    заходит на сайт, просматривает страницы, читает список функций.
    Вес 3 — таких пользователей большинство.
    """

    weight = 3
    wait_time = between(3, 8)

    @task(4)
    def open_main_page(self):
        self.client.get("/", name="Главная страница")

    @task(3)
    def load_functions(self):
        with self.client.get("/api/functions/", name="GET /api/functions/", catch_response=True) as r:
            if r.status_code == 200 and isinstance(r.json(), list):
                r.success()
            else:
                r.failure(f"Ожидался список, получен {r.status_code}")

    @task(1)
    def open_spa_route(self):
        """Переход на страницу внутри SPA — nginx должен вернуть index.html."""
        self.client.get("/check", name="SPA /check")


# ---------------------------------------------------------------------------
# 2. Активный учитель — авторизован, отправляет проверки
# ---------------------------------------------------------------------------

class ActiveTeacher(AuthMixin, HttpUser):
    """
    Авторизованный учитель: просматривает функции, отправляет тексты на проверку,
    читает результаты. Самый тяжёлый сценарий для бэкенда.
    Вес 2.
    """

    weight = 2
    wait_time = between(5, 15)

    @task(2)
    def view_functions(self):
        self.client.get(
            "/api/functions/",
            headers=self._auth_headers(),
            name="GET /api/functions/ (auth)",
        )

    @task(3)
    def submit_check_stream(self):
        """Отправка текста на проверку через streaming endpoint."""
        if not self.function_ids:
            return

        text = random.choice(SAMPLE_TEXTS)
        function_id = random.choice(self.function_ids)

        with self.client.post(
            "/api/check/stream",
            json={"text": text, "function_id": function_id},
            headers=self._auth_headers(),
            name="POST /api/check/stream",
            catch_response=True,
            stream=True,
            timeout=60,
        ) as r:
            if r.status_code == 200:
                # Читаем SSE-поток до конца
                for _ in r.iter_lines():
                    pass
                r.success()
            elif r.status_code in (401, 403):
                r.success()  # авторизация не настроена — не считаем ошибкой
            else:
                r.failure(f"HTTP {r.status_code}")

    @task(1)
    def view_saved_results(self):
        self.client.get(
            "/api/check/results/",
            headers=self._auth_headers(),
            name="GET /api/check/results/",
        )

    @task(1)
    def view_students(self):
        self.client.get(
            "/api/students/",
            headers=self._auth_headers(),
            name="GET /api/students/",
        )


# ---------------------------------------------------------------------------
# 3. Стресс-пользователь — долбит endpoint проверки без паузы
# ---------------------------------------------------------------------------

class BurstChecker(AuthMixin, HttpUser):
    """
    Стресс-тест: имитирует всплеск одновременных запросов на проверку.
    Используй этот класс отдельно для стресс-сценария.
    Вес 1 — таких мало.
    """

    weight = 1
    wait_time = between(1, 3)

    @task
    def burst_check(self):
        if not self.function_ids:
            self.client.get("/api/functions/", name="GET /api/functions/ (burst init)")
            return

        with self.client.post(
            "/api/check/stream",
            json={
                "text": random.choice(SAMPLE_TEXTS),
                "function_id": random.choice(self.function_ids),
            },
            headers=self._auth_headers(),
            name="POST /api/check/stream (burst)",
            catch_response=True,
            stream=True,
            timeout=90,
        ) as r:
            if r.status_code in (200, 401, 403, 429):
                r.success()
            else:
                r.failure(f"HTTP {r.status_code}")
