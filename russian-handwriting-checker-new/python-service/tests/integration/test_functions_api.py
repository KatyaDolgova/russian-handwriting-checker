"""
Интеграционные тесты для /api/functions API.
Используют SQLite in-memory через фикстуру client из conftest.
"""
import pytest
from tests.conftest import FUNCTION_PAYLOAD, USER_2, as_user


async def create_fn(client, payload=None):
    payload = payload or FUNCTION_PAYLOAD
    r = await client.post("/api/functions/", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


class TestFunctionsCRUD:
    async def test_create_function(self, client):
        r = await client.post("/api/functions/", json=FUNCTION_PAYLOAD)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == FUNCTION_PAYLOAD["name"]
        assert data["user_id"] is not None

    async def test_list_includes_created(self, client):
        fn = await create_fn(client)
        r = await client.get("/api/functions/")
        assert r.status_code == 200
        ids = [f["id"] for f in r.json()]
        assert fn["id"] in ids

    async def test_update_own_function(self, client):
        fn = await create_fn(client)
        r = await client.put(f"/api/functions/{fn['id']}", json={**FUNCTION_PAYLOAD, "name": "Обновлено"})
        assert r.status_code == 200
        assert r.json()["name"] == "Обновлено"

    async def test_delete_own_function(self, client):
        fn = await create_fn(client)
        r = await client.delete(f"/api/functions/{fn['id']}")
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_update_nonexistent_returns_404(self, client):
        r = await client.put("/api/functions/no-such-id", json=FUNCTION_PAYLOAD)
        assert r.status_code == 404

    async def test_delete_nonexistent_returns_404(self, client):
        r = await client.delete("/api/functions/no-such-id")
        assert r.status_code == 404


class TestFunctionsOwnership:
    async def test_cannot_update_other_users_function(self, client):
        fn = await create_fn(client)
        with as_user(USER_2):
            r = await client.put(f"/api/functions/{fn['id']}", json=FUNCTION_PAYLOAD)
        assert r.status_code == 403

    async def test_cannot_delete_other_users_function(self, client):
        fn = await create_fn(client)
        with as_user(USER_2):
            r = await client.delete(f"/api/functions/{fn['id']}")
        assert r.status_code == 403

    async def test_cannot_publish_other_users_function(self, client):
        fn = await create_fn(client)
        with as_user(USER_2):
            r = await client.post(f"/api/functions/{fn['id']}/publish")
        assert r.status_code == 403

    async def test_cannot_view_versions_of_other_users_function(self, client):
        fn = await create_fn(client)
        with as_user(USER_2):
            r = await client.get(f"/api/functions/{fn['id']}/versions")
        assert r.status_code == 403


class TestFunctionsPublish:
    async def test_publish_toggles_is_published(self, client):
        fn = await create_fn(client)
        r = await client.post(f"/api/functions/{fn['id']}/publish")
        assert r.status_code == 200
        assert r.json()["is_published"] is True

    async def test_publish_creates_version(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        r = await client.get(f"/api/functions/{fn['id']}/versions")
        assert r.status_code == 200
        versions = r.json()
        assert len(versions) >= 1
        assert versions[0]["version_number"] == 1

    async def test_update_published_creates_new_version(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        await client.put(f"/api/functions/{fn['id']}", json={**FUNCTION_PAYLOAD, "name": "v2"})
        r = await client.get(f"/api/functions/{fn['id']}/versions")
        versions = r.json()
        assert len(versions) == 2

    async def test_unpublish_toggles_back(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        r = await client.post(f"/api/functions/{fn['id']}/publish")
        assert r.json()["is_published"] is False

    async def test_cannot_publish_nonexistent(self, client):
        r = await client.post("/api/functions/nonexistent/publish")
        assert r.status_code == 404


class TestFunctionsGallery:
    async def test_gallery_empty_initially(self, client):
        r = await client.get("/api/functions/gallery")
        assert r.status_code == 200
        assert r.json() == []

    async def test_published_function_appears_for_other_user(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        with as_user(USER_2):
            r = await client.get("/api/functions/gallery")
        ids = [f["id"] for f in r.json()]
        assert fn["id"] in ids

    async def test_own_published_function_not_in_gallery(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        r = await client.get("/api/functions/gallery")
        ids = [f["id"] for f in r.json()]
        assert fn["id"] not in ids

    async def test_gallery_search_by_name(self, client):
        fn = await create_fn(client, {**FUNCTION_PAYLOAD, "name": "УникальноеИмя"})
        await client.post(f"/api/functions/{fn['id']}/publish")
        with as_user(USER_2):
            r = await client.get("/api/functions/gallery?search=УникальноеИмя")
        assert any(f["id"] == fn["id"] for f in r.json())

    async def test_gallery_search_no_match(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        with as_user(USER_2):
            r = await client.get("/api/functions/gallery?search=ТакогоНет123")
        assert r.json() == []


class TestFunctionsCopy:
    async def test_copy_published_function(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        with as_user(USER_2):
            r = await client.post(f"/api/functions/{fn['id']}/copy")
        assert r.status_code == 200
        copy = r.json()
        assert copy["id"] != fn["id"]
        assert copy["name"] == fn["name"]

    async def test_copy_appears_in_user2_list(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        with as_user(USER_2):
            copy = (await client.post(f"/api/functions/{fn['id']}/copy")).json()
            r = await client.get("/api/functions/")
        ids = [f["id"] for f in r.json()]
        assert copy["id"] in ids

    async def test_cannot_copy_unpublished_function(self, client):
        fn = await create_fn(client)
        with as_user(USER_2):
            r = await client.post(f"/api/functions/{fn['id']}/copy")
        assert r.status_code == 403

    async def test_copy_sets_original_function_id(self, client):
        fn = await create_fn(client)
        await client.post(f"/api/functions/{fn['id']}/publish")
        with as_user(USER_2):
            copy = (await client.post(f"/api/functions/{fn['id']}/copy")).json()
        assert copy.get("original_function_id") == fn["id"]
