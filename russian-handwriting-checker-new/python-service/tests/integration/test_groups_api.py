"""
Интеграционные тесты для /api/groups API.
"""

import pytest
from tests.conftest import USER_2, as_user


GROUP_PAYLOAD = {"name": "7А", "description": "Седьмой класс"}


async def create_group(client, payload=None):
    payload = payload or GROUP_PAYLOAD
    r = await client.post("/api/groups/", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


async def create_student(client, name="Иван Иванов"):
    r = await client.post("/api/students/", json={"name": name})
    assert r.status_code == 200, r.text
    return r.json()


class TestGroupsCRUD:
    async def test_create_group(self, client):
        r = await client.post("/api/groups/", json=GROUP_PAYLOAD)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == GROUP_PAYLOAD["name"]
        assert "id" in data

    async def test_create_group_without_description(self, client):
        r = await client.post("/api/groups/", json={"name": "Без описания"})
        assert r.status_code == 200
        assert r.json()["name"] == "Без описания"

    async def test_list_groups(self, client):
        group = await create_group(client)
        r = await client.get("/api/groups/")
        assert r.status_code == 200
        ids = [g["id"] for g in r.json()]
        assert group["id"] in ids

    async def test_list_empty_initially(self, client):
        r = await client.get("/api/groups/")
        assert r.status_code == 200
        assert r.json() == []

    async def test_update_group(self, client):
        group = await create_group(client)
        r = await client.put(
            f"/api/groups/{group['id']}",
            json={"name": "8Б", "description": "Обновлено"},
        )
        assert r.status_code == 200
        assert r.json()["name"] == "8Б"

    async def test_delete_group(self, client):
        group = await create_group(client)
        r = await client.delete(f"/api/groups/{group['id']}")
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_deleted_not_in_list(self, client):
        group = await create_group(client)
        await client.delete(f"/api/groups/{group['id']}")
        r = await client.get("/api/groups/")
        ids = [g["id"] for g in r.json()]
        assert group["id"] not in ids


class TestGroupsOwnership:
    async def test_list_only_own_groups(self, client):
        await create_group(client)
        with as_user(USER_2):
            r = await client.get("/api/groups/")
        assert r.json() == []

    async def test_cannot_update_other_users_group(self, client):
        group = await create_group(client)
        with as_user(USER_2):
            r = await client.put(
                f"/api/groups/{group['id']}",
                json={"name": "Взлом"},
            )
        assert r.status_code == 404

    async def test_cannot_delete_other_users_group(self, client):
        group = await create_group(client)
        with as_user(USER_2):
            r = await client.delete(f"/api/groups/{group['id']}")
        assert r.status_code == 404

    async def test_update_nonexistent_returns_404(self, client):
        r = await client.put("/api/groups/bad-id", json={"name": "X"})
        assert r.status_code == 404

    async def test_delete_nonexistent_returns_404(self, client):
        r = await client.delete("/api/groups/bad-id")
        assert r.status_code == 404


class TestStudentGroupAssign:
    async def test_assign_student_to_group(self, client):
        student = await create_student(client)
        group = await create_group(client)
        r = await client.post(
            "/api/groups/students/assign",
            json={"student_id": student["id"], "group_id": group["id"]},
        )
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_assign_student_to_no_group(self, client):
        student = await create_student(client)
        r = await client.post(
            "/api/groups/students/assign",
            json={"student_id": student["id"], "group_id": None},
        )
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_get_student_groups(self, client):
        r = await client.get("/api/groups/students")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
