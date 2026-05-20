"""
Интеграционные тесты для /api/students API.
"""

import pytest
from tests.conftest import USER_2, as_user


async def create_student(client, name="Иван Иванов"):
    r = await client.post("/api/students/", json={"name": name})
    assert r.status_code == 200, r.text
    return r.json()


class TeststudentsCRUD:
    async def test_create_student(self, client):
        r = await client.post("/api/students/", json={"name": "Петя"})
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Петя"
        assert "id" in data

    async def test_list_students(self, client):
        student = await create_student(client)
        r = await client.get("/api/students/")
        assert r.status_code == 200
        names = [p["name"] for p in r.json()]
        assert student["name"] in names

    async def test_list_empty_initially(self, client):
        r = await client.get("/api/students/")
        assert r.status_code == 200
        assert r.json() == []

    async def test_delete_student(self, client):
        student = await create_student(client)
        r = await client.delete(f"/api/students/{student['id']}")
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_deleted_not_in_list(self, client):
        student = await create_student(client)
        await client.delete(f"/api/students/{student['id']}")
        r = await client.get("/api/students/")
        ids = [p["id"] for p in r.json()]
        assert student["id"] not in ids

    async def test_delete_nonexistent_returns_404(self, client):
        r = await client.delete("/api/students/no-such-id")
        assert r.status_code == 404


class TeststudentsDuplicate:
    async def test_create_duplicate_returns_existing(self, client):
        first = await create_student(client, "Дубль")
        second = await create_student(client, "Дубль")
        assert first["id"] == second["id"]

    async def test_only_one_in_list(self, client):
        await create_student(client, "Один")
        await create_student(client, "Один")
        r = await client.get("/api/students/")
        names = [p["name"] for p in r.json()]
        assert names.count("Один") == 1

    async def test_empty_name_returns_422(self, client):
        r = await client.post("/api/students/", json={"name": "  "})
        assert r.status_code == 422

    async def test_strips_whitespace(self, client):
        r = await client.post("/api/students/", json={"name": "  Пробелы  "})
        assert r.status_code == 200
        assert r.json()["name"] == "Пробелы"


class TeststudentsOwnership:
    async def test_list_only_own_students(self, client):
        await create_student(client)
        with as_user(USER_2):
            r = await client.get("/api/students/")
        assert r.json() == []

    async def test_cannot_delete_other_users_student(self, client):
        student = await create_student(client)
        with as_user(USER_2):
            r = await client.delete(f"/api/students/{student['id']}")
        assert r.status_code == 404
