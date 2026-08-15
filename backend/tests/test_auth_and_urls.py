import uuid

from sqlmodel import Session, select

from app import database as db_module
from app.auth.security import get_password_hash, verify_password
from app.models.models import ShortenedURL


def _random_user(prefix: str = "user") -> tuple[str, str, str]:
    tag = uuid.uuid4().hex[:8]
    username = f"{prefix}_{tag}"
    email = f"{username}@example.com"
    password = "StrongPass123!"
    return username, email, password


def test_password_hash_and_verify():
    password = "StrongPass123!"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-pass", hashed) is False


def test_register_login_and_create_owned_url(client):
    username, email, password = _random_user("alice")

    reg = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert reg.status_code == 201, reg.text

    login = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    access_token = login.json()["access_token"]
    assert access_token

    create = client.post(
        "/api/v1/shorten",
        json={"original_url": "https://example.com", "description": "owned url"},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert create.status_code == 201, create.text

    body = create.json()
    assert body["original_url"] == "https://example.com"
    assert body["short_code"]

    stats = client.get(
        f"/api/v1/stats/{body['short_code']}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert stats.status_code == 200, stats.text
    assert stats.json()["short_code"] == body["short_code"]


def test_anonymous_create_allowed_but_owner_is_null(client):
    create = client.post(
        "/api/v1/shorten",
        json={"original_url": "https://example.com", "description": "anonymous"},
    )
    assert create.status_code == 201, create.text
    short_code = create.json()["short_code"]

    with Session(db_module.db.engine) as session:
        row = session.exec(
            select(ShortenedURL).where(ShortenedURL.short_code == short_code)
        ).first()

    assert row is not None
    assert row.owner_id is None


def test_list_all_requires_auth(client):
    username, email, password = _random_user("bob")

    reg = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert reg.status_code == 201, reg.text

    login = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    access_token = login.json()["access_token"]

    create = client.post(
        "/api/v1/shorten",
        json={"original_url": "https://example.org", "description": "list test"},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert create.status_code == 201, create.text

    unauth = client.get("/api/v1/list/all")
    assert unauth.status_code in (401, 403), unauth.text

    auth = client.get(
        "/api/v1/list/all",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert auth.status_code == 200, auth.text
    payload = auth.json()
    assert isinstance(payload, list)
    assert any(item["original_url"] == "https://example.org" for item in payload)


def test_other_user_cannot_update_or_delete_owned_url(client):
    alice_user = _random_user("alice")
    bob_user = _random_user("bob")

    alice_reg = client.post(
        "/api/v1/auth/register",
        json={"username": alice_user[0], "email": alice_user[1], "password": alice_user[2]},
    )
    assert alice_reg.status_code == 201, alice_reg.text

    bob_reg = client.post(
        "/api/v1/auth/register",
        json={"username": bob_user[0], "email": bob_user[1], "password": bob_user[2]},
    )
    assert bob_reg.status_code == 201, bob_reg.text

    alice_login = client.post(
        "/api/v1/auth/login",
        data={"username": alice_user[0], "password": alice_user[2]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert alice_login.status_code == 200, alice_login.text
    alice_token = alice_login.json()["access_token"]

    bob_login = client.post(
        "/api/v1/auth/login",
        data={"username": bob_user[0], "password": bob_user[2]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert bob_login.status_code == 200, bob_login.text
    bob_token = bob_login.json()["access_token"]

    created = client.post(
        "/api/v1/shorten",
        json={"original_url": "https://example.com/owner-test", "description": "owner only"},
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert created.status_code == 201, created.text
    short_code = created.json()["short_code"]

    forbidden_stats = client.get(
        f"/api/v1/stats/{short_code}",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert forbidden_stats.status_code == 403, forbidden_stats.text

    forbidden_update = client.patch(
        f"/api/v1/stats/{short_code}",
        json={"description": "hacked"},
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert forbidden_update.status_code == 403, forbidden_update.text

    forbidden_delete = client.delete(
        f"/api/v1/stats/{short_code}",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert forbidden_delete.status_code == 403, forbidden_delete.text
