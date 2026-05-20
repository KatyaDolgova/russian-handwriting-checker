"""
Интеграционные тесты для /api/check API.
LLM не вызывается — тестируем только сохранение, историю, обновление, удаление.
"""
import pytest
from tests.conftest import USER_2, as_user


SAVE_PAYLOAD = {
    "filename": "test.jpg",
    "title": "Тестовая работа",
    "original_text": "Привет мир",
    "corrected_text": "Привет, мир!",
    "errors": [{"original": "мир", "correction": "мир!"}],
    "score": 80.0,
    "score_max": 100.0,
    "comment": "Хорошо",
    "pupil_name": "Иван Иванов",
    "function_id": "test-function-id",
    "folder_id": None,
    "work_date": None,
}

SAVE_GENERATION = {
    **SAVE_PAYLOAD,
    "score": None,
    "score_max": None,
    "pupil_name": None,
    "title": "Генерация",
}


async def save_check(client, payload=None):
    payload = payload or SAVE_PAYLOAD
    r = await client.post("/api/check/save", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


class TestCheckSave:
    async def test_save_returns_id(self, client):
        result = await save_check(client)
        assert "id" in result
        assert result["success"] is True

    async def test_save_appears_in_history(self, client):
        saved = await save_check(client)
        r = await client.get("/api/check/history")
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert saved["id"] in ids

    async def test_save_null_score(self, client):
        saved = await save_check(client, SAVE_GENERATION)
        r = await client.get("/api/check/history")
        check = next(c for c in r.json() if c["id"] == saved["id"])
        assert check["score"] is None
        assert check["score_max"] is None

    async def test_save_auto_creates_pupil(self, client):
        await save_check(client, {**SAVE_PAYLOAD, "pupil_name": "НовыйУченик"})
        r = await client.get("/api/pupils/")
        names = [p["name"] for p in r.json()]
        assert "НовыйУченик" in names

    async def test_save_same_pupil_once(self, client):
        await save_check(client, {**SAVE_PAYLOAD, "pupil_name": "Дубль"})
        await save_check(client, {**SAVE_PAYLOAD, "pupil_name": "Дубль"})
        r = await client.get("/api/pupils/")
        names = [p["name"] for p in r.json()]
        assert names.count("Дубль") == 1


class TestCheckHistory:
    async def test_history_empty_initially(self, client):
        r = await client.get("/api/check/history")
        assert r.status_code == 200
        assert r.json() == []

    async def test_history_contains_saved_fields(self, client):
        saved = await save_check(client)
        r = await client.get("/api/check/history")
        check = next(c for c in r.json() if c["id"] == saved["id"])
        assert check["title"] == SAVE_PAYLOAD["title"]
        assert check["score"] == SAVE_PAYLOAD["score"]
        assert check["original_text"] == SAVE_PAYLOAD["original_text"]

    async def test_history_only_own_records(self, client):
        await save_check(client)
        with as_user(USER_2):
            r = await client.get("/api/check/history")
        assert r.json() == []


class TestCheckUpdate:
    async def test_update_score(self, client):
        saved = await save_check(client)
        r = await client.put(f"/api/check/{saved['id']}", json={"score": 90.0})
        assert r.status_code == 200
        assert r.json()["score"] == 90.0

    async def test_update_comment(self, client):
        saved = await save_check(client)
        r = await client.put(f"/api/check/{saved['id']}", json={"comment": "Исправлено"})
        assert r.status_code == 200
        assert r.json()["comment"] == "Исправлено"

    async def test_update_nonexistent_returns_404(self, client):
        r = await client.put("/api/check/no-such-id", json={"score": 50})
        assert r.status_code == 404

    async def test_cannot_update_other_users_check(self, client):
        saved = await save_check(client)
        with as_user(USER_2):
            r = await client.put(f"/api/check/{saved['id']}", json={"score": 10})
        assert r.status_code == 403


class TestCheckDelete:
    async def test_delete_own_check(self, client):
        saved = await save_check(client)
        r = await client.delete(f"/api/check/{saved['id']}")
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_deleted_not_in_history(self, client):
        saved = await save_check(client)
        await client.delete(f"/api/check/{saved['id']}")
        r = await client.get("/api/check/history")
        ids = [c["id"] for c in r.json()]
        assert saved["id"] not in ids

    async def test_delete_nonexistent_returns_404(self, client):
        r = await client.delete("/api/check/no-such-id")
        assert r.status_code == 404

    async def test_cannot_delete_other_users_check(self, client):
        saved = await save_check(client)
        with as_user(USER_2):
            r = await client.delete(f"/api/check/{saved['id']}")
        assert r.status_code == 403
