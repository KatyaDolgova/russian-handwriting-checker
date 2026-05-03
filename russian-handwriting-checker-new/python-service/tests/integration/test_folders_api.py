"""
Интеграционные тесты для /api/folders API.
"""
import pytest
from tests.conftest import USER_2, as_user


FOLDER_PAYLOAD = {"name": "Тестовая папка", "description": "Описание"}


async def create_folder(client, payload=None):
    payload = payload or FOLDER_PAYLOAD
    r = await client.post("/api/folders/", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


class TestFoldersCRUD:
    async def test_create_folder(self, client):
        r = await client.post("/api/folders/", json=FOLDER_PAYLOAD)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == FOLDER_PAYLOAD["name"]

    async def test_list_folders(self, client):
        folder = await create_folder(client)
        r = await client.get("/api/folders/")
        assert r.status_code == 200
        ids = [f["id"] for f in r.json()]
        assert folder["id"] in ids

    async def test_update_folder(self, client):
        folder = await create_folder(client)
        r = await client.put(f"/api/folders/{folder['id']}", json={"name": "Новое имя", "description": ""})
        assert r.status_code == 200
        assert r.json()["name"] == "Новое имя"

    async def test_delete_folder(self, client):
        folder = await create_folder(client)
        r = await client.delete(f"/api/folders/{folder['id']}")
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_deleted_not_in_list(self, client):
        folder = await create_folder(client)
        await client.delete(f"/api/folders/{folder['id']}")
        r = await client.get("/api/folders/")
        ids = [f["id"] for f in r.json()]
        assert folder["id"] not in ids

    async def test_list_empty_initially(self, client):
        r = await client.get("/api/folders/")
        assert r.status_code == 200
        assert r.json() == []


class TestFoldersOwnership:
    async def test_list_only_own_folders(self, client):
        await create_folder(client)
        with as_user(USER_2):
            r = await client.get("/api/folders/")
        assert r.json() == []

    async def test_cannot_update_other_users_folder(self, client):
        folder = await create_folder(client)
        with as_user(USER_2):
            r = await client.put(
                f"/api/folders/{folder['id']}", json={"name": "Взлом", "description": ""}
            )
        assert r.status_code == 404

    async def test_cannot_delete_other_users_folder(self, client):
        folder = await create_folder(client)
        with as_user(USER_2):
            r = await client.delete(f"/api/folders/{folder['id']}")
        assert r.status_code == 404

    async def test_update_nonexistent_returns_404(self, client):
        r = await client.put("/api/folders/bad-id", json=FOLDER_PAYLOAD)
        assert r.status_code == 404

    async def test_delete_nonexistent_returns_404(self, client):
        r = await client.delete("/api/folders/bad-id")
        assert r.status_code == 404
