from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from datetime import datetime, timezone
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
import time

from app.database.db import get_session
from app.models.models import Token, User, UserCreate, UserRead
from app.auth.security import (
    create_access_token,
    create_refresh_token,
    create_refresh_token_record,
    decode_token,
    get_current_user,
    get_password_hash,
    get_user_by_id,
    get_user_by_username,
    revoke_refresh_token,
    validate_refresh_token_record,
    verify_password,
)
from app.config import settings

# Simple in-memory store. Use Redis in production for multi-instance deployments.
RATE_LIMIT_STORE: dict[str, list[float]] = {}
LOGIN_LOCKOUT_STORE: dict[str, dict[str, float | int]] = {}


def rate_limiter(key: str, limit: int):
    def _limiter(request: Request):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60
        store_key = f"{key}:{ip}"
        timestamps = RATE_LIMIT_STORE.get(store_key, [])
        timestamps = [t for t in timestamps if now - t < window]
        if len(timestamps) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests")
        timestamps.append(now)
        RATE_LIMIT_STORE[store_key] = timestamps
    return _limiter


def get_login_lockout_key(request: Request, username: str) -> str:
    ip = request.client.host if request.client else "unknown"
    return f"login-lockout:{ip}:{username.lower()}"


def check_login_lockout(request: Request, username: str):
    key = get_login_lockout_key(request, username)
    now = time.time()
    window_seconds = settings.login_lockout_minutes * 60
    entry = LOGIN_LOCKOUT_STORE.get(key)
    if entry:
        attempts = int(entry["attempts"])
        first_seen = float(entry["first_seen"])
        if now - first_seen < window_seconds and attempts >= settings.login_lockout_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Please try again later.",
            )


def record_failed_login(request: Request, username: str):
    key = get_login_lockout_key(request, username)
    now = time.time()
    entry = LOGIN_LOCKOUT_STORE.get(key)
    if entry:
        attempts = int(entry["attempts"]) + 1
        first_seen = float(entry["first_seen"])
        if now - first_seen >= settings.login_lockout_minutes * 60:
            first_seen = now
            attempts = 1
        LOGIN_LOCKOUT_STORE[key] = {"attempts": attempts, "first_seen": first_seen}
    else:
        LOGIN_LOCKOUT_STORE[key] = {"attempts": 1, "first_seen": now}


def clear_login_lockout(request: Request, username: str):
    key = get_login_lockout_key(request, username)
    LOGIN_LOCKOUT_STORE.pop(key, None)

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, session: Session = Depends(get_session), request: Request = None):
    """Register a new user."""
    # rate limit registration
    limiter = rate_limiter("register", settings.register_rate_limit_per_minute)
    limiter(request)

    existing_user = session.exec(
        select(User).where((User.username == user.username) | (User.email == user.email))
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    if len(user.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be 72 bytes or fewer for bcrypt compatibility.",
        )

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return UserRead(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        created_at=new_user.created_at,
    )


@router.post("/login", response_model=Token)
def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
    request: Request = None,
):
    """Authenticate a user and return access/refresh tokens."""
    # rate limit login attempts
    limiter = rate_limiter("login", settings.login_rate_limit_per_minute)
    limiter(request)
    check_login_lockout(request, form_data.username)

    user = get_user_by_username(session, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        record_failed_login(request, form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clear_login_lockout(request, form_data.username)
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # persist refresh token record for rotation/revocation
    payload = decode_token(refresh_token)
    jti = payload.get("jti")
    exp_ts = payload.get("exp")
    expires_at = None
    if exp_ts:
        expires_at = datetime.fromtimestamp(int(exp_ts), timezone.utc)

    create_refresh_token_record(session, jti, user.id, expires_at=expires_at)

    # set HttpOnly secure cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=60 * 60 * 24 * settings.refresh_token_expire_days,
        path="/api/v1/auth/refresh",
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/refresh", response_model=Token)
def refresh_access_token(response: Response, request: Request, session: Session = Depends(get_session)):
    """Refresh an access token using a refresh token from cookie with rotation."""
    csrf_header = settings.csrf_header_name
    if not request.headers.get(csrf_header):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing CSRF header")

    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    jti = payload.get("jti")
    user_id = payload.get("sub")
    if not jti or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # validate against stored refresh token record
    if not validate_refresh_token_record(session, jti):
        # token reused or revoked
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked or invalid")

    user = get_user_by_id(session, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Revoke old refresh token and issue a new one (rotation)
    revoke_refresh_token(session, jti)

    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    new_payload = decode_token(new_refresh_token)
    new_jti = new_payload.get("jti")
    exp_ts = new_payload.get("exp")
    expires_at = None
    if exp_ts:
        expires_at = datetime.fromtimestamp(int(exp_ts), timezone.utc)

    create_refresh_token_record(session, new_jti, user.id, expires_at=expires_at)

    # set rotated refresh token in cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=60 * 60 * 24 * settings.refresh_token_expire_days,
        path="/api/v1/auth/refresh",
    )

    return Token(access_token=new_access_token, token_type="bearer")


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return UserRead(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, request: Request, session: Session = Depends(get_session)):
    """Logout by revoking the refresh token and clearing the cookie."""
    token = request.cookies.get("refresh_token")
    if token:
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if jti:
                revoke_refresh_token(session, jti)
        except Exception:
            # ignore errors during logout
            pass

    # clear cookie
    response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
    return None
