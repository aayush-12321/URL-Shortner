import uuid
from datetime import datetime, timedelta, timezone

import app.auth.router as auth_router
from app.config import settings
from sqlmodel import Session, select

from app import database as db_module
from app.auth.security import get_password_hash, verify_password
from app.models.models import ClickLog, EmailVerification, RefreshToken, ShortenedURL, User

_send_verification_email = auth_router.send_verification_email


def _random_user(prefix: str = "user") -> tuple[str, str, str]:
    tag = uuid.uuid4().hex[:8]
    username = f"{prefix}_{tag}"
    email = f"{username}@example.com"
    password = "StrongPass123!"
    return username, email, password


def _register_and_verify(client, user: tuple[str, str, str], sent_codes: dict[str, str]) -> None:
    username, email, password = user
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )
    assert response.status_code == 201, response.text
    verified = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": sent_codes[email]},
    )
    assert verified.status_code == 200, verified.text


def test_password_hash_and_verify():
    password = "StrongPass123!"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-pass", hashed) is False


def test_delete_account_removes_user_owned_data(client, mock_verification_email):
    username, email, password = _random_user("account-delete")
    _register_and_verify(client, (username, email, password), mock_verification_email)

    login = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    owned_response = client.post(
        "/api/v1/shorten",
        json={"original_url": "https://owned.example.com"},
        headers=headers,
    )
    anonymous_response = client.post(
        "/api/v1/shorten",
        json={"original_url": "https://anonymous.example.com"},
    )
    assert owned_response.status_code == 201, owned_response.text
    assert anonymous_response.status_code == 201, anonymous_response.text

    with Session(db_module.db.engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        user_id = user.id
        session.add(ClickLog(short_code=owned_response.json()["short_code"]))
        session.add(
            EmailVerification(
                user_id=user_id,
                otp_hash="test-hash",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
                last_sent_at=datetime.now(timezone.utc),
            )
        )
        session.commit()

    invalid_confirmation = client.request(
        "DELETE", "/api/v1/auth/me", json={"confirmation": "DELETE ME"}, headers=headers
    )
    assert invalid_confirmation.status_code == 400

    deleted = client.request("DELETE", "/api/v1/auth/me", json={"confirmation": "DELETE"}, headers=headers)
    assert deleted.status_code == 204, deleted.text

    with Session(db_module.db.engine) as session:
        assert session.exec(select(User).where(User.id == user_id)).first() is None
        assert session.exec(
            select(ShortenedURL).where(ShortenedURL.short_code == owned_response.json()["short_code"])
        ).first() is None
        assert session.exec(
            select(ClickLog).where(ClickLog.short_code == owned_response.json()["short_code"])
        ).first() is None
        assert session.exec(
            select(ShortenedURL).where(ShortenedURL.short_code == anonymous_response.json()["short_code"])
        ).first() is not None
        assert session.exec(select(EmailVerification).where(EmailVerification.user_id == user_id)).first() is None
        assert session.exec(select(RefreshToken).where(RefreshToken.user_id == user_id)).first() is None

    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401


def test_google_auth_creates_user_with_google_profile_name(client, monkeypatch):
    monkeypatch.setattr(
        auth_router.google_id_token,
        "verify_oauth2_token",
        lambda *_args, **_kwargs: {
            "email": "google.user@example.com",
            "email_verified": True,
            "name": "Google Profile Name",
            "picture": "https://example.com/google-user.jpg",
        },
    )

    response = client.post("/api/v1/auth/google/authenticate", json={"credential": "verified-google-credential"})

    assert response.status_code == 200, response.text
    assert response.json()["access_token"]
    assert response.cookies.get("refresh_token")

    profile = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {response.json()['access_token']}"},
    )
    assert profile.status_code == 200, profile.text
    assert profile.json()["username"] == "Google Profile Name"
    assert profile.json()["email"] == "google.user@example.com"
    assert profile.json()["image_url"] == "https://example.com/google-user.jpg"
    assert profile.json()["auth_provider"] == "google"


def test_google_auth_rejects_invalid_credential(client, monkeypatch):
    def reject_credential(*_args, **_kwargs):
        raise ValueError("Invalid token")

    monkeypatch.setattr(auth_router.google_id_token, "verify_oauth2_token", reject_credential)

    response = client.post("/api/v1/auth/google/authenticate", json={"credential": "invalid"})

    assert response.status_code == 401


def test_google_auth_rejects_unconfirmed_email_claim(client, monkeypatch):
    monkeypatch.setattr(
        auth_router.google_id_token,
        "verify_oauth2_token",
        lambda *_args, **_kwargs: {
            "email": "not.verified@example.com",
            "email_verified": "true",
        },
    )

    response = client.post("/api/v1/auth/google/authenticate", json={"credential": "credential"})

    assert response.status_code == 401


def test_register_rejects_mismatched_password_confirmation(client):
    username, email, password = _random_user("mismatch")

    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "confirm_password": "DifferentPass123!",
        },
    )

    assert response.status_code == 422, response.text


def test_register_requires_verification_before_login_and_create_owned_url(client, mock_verification_email):
    username, email, password = _random_user("alice")

    reg = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )
    assert reg.status_code == 201, reg.text
    assert "access_token" not in reg.json()

    login = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 403, login.text

    verified = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": mock_verification_email[email]},
    )
    assert verified.status_code == 200, verified.text

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


def test_register_retry_replaces_pending_otp_and_resets_verification(client, mock_verification_email, monkeypatch):
    codes = iter(("111111", "222222"))
    monkeypatch.setattr(auth_router, "create_verification_code", lambda: next(codes))
    username, email, password = _random_user("register-retry")
    first = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert first.status_code == 201, first.text
    first_code = mock_verification_email[email]

    with Session(db_module.db.engine) as session:
        pending = session.exec(select(EmailVerification)).first()
        pending.attempts = 2
        pending.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        session.add(pending)
        session.commit()

    retried = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert retried.status_code == 201, retried.text
    second_code = mock_verification_email[email]
    assert second_code == "222222"
    assert second_code != first_code

    with Session(db_module.db.engine) as session:
        pending = session.exec(select(EmailVerification)).first()
        account = session.exec(select(User).where(User.username == username)).first()
        assert pending.attempts == 0
        assert pending.expires_at > datetime.now(timezone.utc).replace(tzinfo=None)
        assert account.email_verified is False

    old_code = client.post("/api/v1/auth/verify-email", json={"email": email, "code": first_code})
    assert old_code.status_code == 400
    new_code = client.post("/api/v1/auth/verify-email", json={"email": email, "code": second_code})
    assert new_code.status_code == 200


def test_verification_rejects_invalid_and_used_codes(client, mock_verification_email):
    username, email, password = _random_user("otp-invalid")
    registered = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert registered.status_code == 201, registered.text

    invalid = client.post("/api/v1/auth/verify-email", json={"email": email, "code": "000000"})
    assert invalid.status_code == 400

    code = mock_verification_email[email]
    verified = client.post("/api/v1/auth/verify-email", json={"email": email, "code": code})
    assert verified.status_code == 200, verified.text
    repeated = client.post("/api/v1/auth/verify-email", json={"email": email, "code": code})
    assert repeated.status_code == 409


def test_expired_code_is_rejected(client, mock_verification_email):
    username, email, password = _random_user("otp-expired")
    response = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert response.status_code == 201, response.text

    with Session(db_module.db.engine) as session:
        verification = session.exec(select(EmailVerification)).first()
        verification.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        session.add(verification)
        session.commit()

    expired = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": mock_verification_email[email]},
    )
    assert expired.status_code == 410


def test_incorrect_code_attempt_limit(client, mock_verification_email):
    username, email, password = _random_user("otp-attempts")
    response = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert response.status_code == 201, response.text

    statuses = [
        client.post("/api/v1/auth/verify-email", json={"email": email, "code": "000000"}).status_code
        for _ in range(auth_router.OTP_MAX_ATTEMPTS)
    ]
    assert statuses[:-1] == [400] * (auth_router.OTP_MAX_ATTEMPTS - 1)
    assert statuses[-1] == 429
    locked = client.post("/api/v1/auth/verify-email", json={"email": email, "code": mock_verification_email[email]})
    assert locked.status_code == 429


def test_resend_replaces_previous_code_and_enforces_cooldown(client, mock_verification_email, monkeypatch):
    monkeypatch.setattr(auth_router, "create_verification_code", lambda: "123456")
    username, email, password = _random_user("otp-resend")
    response = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert response.status_code == 201, response.text
    old_code = mock_verification_email[email]

    too_soon = client.post("/api/v1/auth/resend-verification", json={"email": email})
    assert too_soon.status_code == 429

    with Session(db_module.db.engine) as session:
        verification = session.exec(select(EmailVerification)).first()
        verification.last_sent_at = datetime.now(timezone.utc) - timedelta(seconds=61)
        session.add(verification)
        session.commit()

    monkeypatch.setattr(auth_router, "create_verification_code", lambda: "654321")
    resent = client.post("/api/v1/auth/resend-verification", json={"email": email})
    assert resent.status_code == 200, resent.text
    assert resent.json()["expires_in_seconds"] == auth_router.OTP_EXPIRY_MINUTES * 60

    old_code_result = client.post("/api/v1/auth/verify-email", json={"email": email, "code": old_code})
    assert old_code_result.status_code == 400
    new_code_result = client.post("/api/v1/auth/verify-email", json={"email": email, "code": "654321"})
    assert new_code_result.status_code == 200


def test_change_pending_email_requires_password_and_replaces_otp(client, mock_verification_email, monkeypatch):
    monkeypatch.setattr(auth_router, "create_verification_code", lambda: "123456")
    username, email, password = _random_user("otp-change")
    registered = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert registered.status_code == 201, registered.text

    rejected = client.post(
        "/api/v1/auth/change-pending-email",
        json={"email": email, "new_email": "updated@example.com", "password": "WrongPass123!"},
    )
    assert rejected.status_code == 401
    assert "updated@example.com" not in mock_verification_email

    monkeypatch.setattr(auth_router, "create_verification_code", lambda: "654321")
    changed = client.post(
        "/api/v1/auth/change-pending-email",
        json={"email": email, "new_email": "updated@example.com", "password": password},
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["email"] == "updated@example.com"
    assert changed.json()["resend_after_seconds"] == auth_router.OTP_RESEND_COOLDOWN_SECONDS

    original_code = client.post(
        "/api/v1/auth/verify-email",
        json={"email": "updated@example.com", "code": "123456"},
    )
    assert original_code.status_code == 400
    replacement_code = client.post(
        "/api/v1/auth/verify-email",
        json={"email": "updated@example.com", "code": "654321"},
    )
    assert replacement_code.status_code == 200


def test_change_pending_email_rejects_registered_destination(client, mock_verification_email):
    pending = _random_user("otp-pending")
    taken = _random_user("otp-taken")
    for username, email, password in (pending, taken):
        response = client.post(
            "/api/v1/auth/register",
            json={"username": username, "email": email, "password": password, "confirm_password": password},
        )
        assert response.status_code == 201, response.text

    response = client.post(
        "/api/v1/auth/change-pending-email",
        json={"email": pending[1], "new_email": taken[1], "password": pending[2]},
    )
    assert response.status_code == 400


def test_registration_delivery_failure_does_not_create_account(client, monkeypatch):
    monkeypatch.setattr(auth_router, "send_verification_email", lambda *_args: (_ for _ in ()).throw(RuntimeError()))
    username, email, password = _random_user("otp-delivery")
    response = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert response.status_code == 502
    with Session(db_module.db.engine) as session:
        assert session.exec(select(User).where(User.email == email)).first() is None


def test_verification_email_uses_resend_settings(monkeypatch):
    sent_payloads = []
    monkeypatch.setattr(auth_router.resend.Emails, "send", lambda payload: sent_payloads.append(payload))

    _send_verification_email("reader@example.com", "123456")

    import hmac

    assert hmac.compare_digest(
        auth_router.resend.api_key or "",
        settings.RESEND_API_KEY.get_secret_value(),
    )
    assert sent_payloads[0]["from"] == settings.EMAIL_FROM
    assert sent_payloads[0]["to"] == ["reader@example.com"]
    assert "123456" in sent_payloads[0]["text"]
    assert "10 minutes" in sent_payloads[0]["text"]


def test_register_rejects_duplicate_email_case_insensitively(client, mock_verification_email):
    username, email, password = _random_user("otp-duplicate")
    first = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password, "confirm_password": password},
    )
    assert first.status_code == 201
    verified = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": mock_verification_email[email]},
    )
    assert verified.status_code == 200
    duplicate = client.post(
        "/api/v1/auth/register",
        json={"username": f"{username}_two", "email": email.upper(), "password": password, "confirm_password": password},
    )
    assert duplicate.status_code == 400


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


def test_list_all_requires_auth(client, mock_verification_email):
    username, email, password = _random_user("bob")

    _register_and_verify(client, (username, email, password), mock_verification_email)

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


def test_other_user_cannot_update_or_delete_owned_url(client, mock_verification_email):
    alice_user = _random_user("alice")
    bob_user = _random_user("bob")

    _register_and_verify(client, alice_user, mock_verification_email)
    _register_and_verify(client, bob_user, mock_verification_email)

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


def test_password_change_requires_current_password_and_updates_credentials(client, mock_verification_email):
    user = _random_user("password-change")
    _register_and_verify(client, user, mock_verification_email)
    login = client.post("/api/v1/auth/login", data={"username": user[0], "password": user[2]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    incorrect = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "WrongPass123!", "new_password": "AnotherPass123!", "confirm_password": "AnotherPass123!"},
    )
    assert incorrect.status_code == 401

    changed = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": user[2], "new_password": "AnotherPass123!", "confirm_password": "AnotherPass123!"},
    )
    assert changed.status_code == 200, changed.text
    assert client.post("/api/v1/auth/login", data={"username": user[0], "password": "AnotherPass123!"}).status_code == 200
    assert client.post("/api/v1/auth/login", data={"username": user[0], "password": user[2]}).status_code == 401


def test_forgot_password_otp_resets_password_and_is_single_use(client, mock_verification_email, monkeypatch):
    user = _random_user("password-reset")
    _register_and_verify(client, user, mock_verification_email)
    reset_codes = {}
    monkeypatch.setattr(auth_router, "send_password_reset_email", lambda email, code: reset_codes.__setitem__(email, code))

    requested = client.post("/api/v1/auth/forgot-password", json={"email": user[1]})
    assert requested.status_code == 200, requested.text
    assert reset_codes[user[1]]

    reset = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": user[1],
            "code": reset_codes[user[1]],
            "new_password": "ResetPass123!",
            "confirm_password": "ResetPass123!",
        },
    )
    assert reset.status_code == 200, reset.text
    assert client.post("/api/v1/auth/login", data={"username": user[0], "password": "ResetPass123!"}).status_code == 200

    reused = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": user[1],
            "code": reset_codes[user[1]],
            "new_password": "AgainPass123!",
            "confirm_password": "AgainPass123!",
        },
    )
    assert reused.status_code == 400


def test_google_accounts_cannot_change_or_reset_shortlink_password(client, monkeypatch):
    monkeypatch.setattr(
        auth_router.google_id_token,
        "verify_oauth2_token",
        lambda *_args, **_kwargs: {
            "email": "google.only@example.com",
            "email_verified": True,
            "name": "Google Only",
        },
    )
    reset_emails = []
    monkeypatch.setattr(auth_router, "send_password_reset_email", lambda email, code: reset_emails.append(email))
    signed_in = client.post("/api/v1/auth/google/authenticate", json={"credential": "google-credential"})
    token = signed_in.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    changed = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "anything", "new_password": "NewPassword123!", "confirm_password": "NewPassword123!"},
    )
    assert changed.status_code == 400
    reset_requested = client.post("/api/v1/auth/forgot-password", json={"email": "google.only@example.com"})
    assert reset_requested.status_code == 200
    assert reset_emails == []
