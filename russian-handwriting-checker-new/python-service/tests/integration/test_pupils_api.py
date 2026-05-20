"""
Интеграционные тесты для /api/pupils API.
"""
import pytest
from tests.conftest import USER_2, as_user


async def create_pupil(client, name="Иван Иванов"):
    r = await client.post("/api/pupils/", json={"name": name})
    assert r.status_code == 200, r.text
    return r.json()


class TestPupilsCRUD:
    async def test_create_pupil(self, client):
        r = await client.post("/api/pupils/", json={"name": "Петя"})
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Петя"
        assert "id" in data

    async def test_list_pupils(self, client):
        pupil = await create_pupil(client)
        r = await client.get("/api/pupils/")
        assert r.status_code == 200
        names = [p["name"] for p in r.json()]
        assert pupil["name"] in names

    async def test_list_empty_initially(self, client):
        r = await client.get("/api/pupils/")
        assert r.status_code == 200
        assert r.json() == []

    async def test_delete_pupil(self, client):
        pupil = await create_pupil(client)
        r = await client.delete(f"/api/pupils/{pupil['id']}")
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_deleted_not_in_list(self, client):
        pupil = await create_pupil(client)
        await client.delete(f"/api/pupils/{pupil['id']}")
        r = await client.get("/api/pupils/")
        ids = [p["id"] for p in r.json()]
        assert pupil["id"] not in ids

    async def test_delete_nonexistent_returns_404(self, client):
        r = await client.delete("/api/pupils/no-such-id")
        assert r.status_code == 404


class TestPupilsDuplicate:
    async def test_create_duplicate_returns_existing(self, client):
        first = await create_pupil(client, "Дубль")
        second = await create_pupil(client, "Дубль")
        assert first["id"] == second["id"]

    async def test_only_one_in_list(self, client):
        await create_pupil(client, "Один")
        await create_pupil(client, "Один")
        r = await client.get("/api/pupils/")
        names = [p["name"] for p in r.json()]
        assert names.count("Один") == 1

    async def test_empty_name_returns_422(self, client):
        r = await client.post("/api/pupils/", json={"name": "  "})
        assert r.status_code == 422

    async def test_strips_whitespace(self, client):
        r = await client.post("/api/pupils/", json={"name": "  Пробелы  "})
        assert r.status_code == 200
        assert r.json()["name"] == "Пробелы"


class TestPupilsOwnership:
    async def test_list_only_own_pupils(self, client):
        await create_pupil(client)
        with as_user(USER_2):
            r = await client.get("/api/pupils/")
        assert r.json() == []

    async def test_cannot_delete_other_users_pupil(self, client):
        pupil = await create_pupil(client)
        with as_user(USER_2):
            r = await client.delete(f"/api/pupils/{pupil['id']}")
        assert r.status_code == 404
