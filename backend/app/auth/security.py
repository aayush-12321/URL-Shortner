from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select
from uuid import uuid4

from app.config import settings
from app.database.db import get_session
from app.models.models import User, RefreshToken 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)


def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)

    to_encode = {"sub": str(subject), "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    """Create a JWT refresh token."""
    if expires_delta is None:
        expires_delta = timedelta(days=settings.refresh_token_expire_days)

    # include a unique token id (jti) for rotation/revocation
    jti = str(uuid4())
    to_encode = {"sub": str(subject), "type": "refresh", "jti": jti, "exp": datetime.now(timezone.utc) + expires_delta}
    token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return token


def create_refresh_token_record(session: Session, jti: str, user_id: int, expires_at: Optional[datetime] = None) -> RefreshToken:
    """Persist a refresh token record to allow rotation and revocation."""
    rt = RefreshToken(jti=jti, user_id=user_id, revoked=False, expires_at=expires_at)
    session.add(rt)
    session.commit()
    session.refresh(rt)
    return rt


def revoke_refresh_token(session: Session, jti: str) -> None:
    """Mark a refresh token as revoked."""
    rt = session.exec(select(RefreshToken).where(RefreshToken.jti == jti)).first()
    if rt:
        rt.revoked = True
        session.add(rt)
        session.commit()


def validate_refresh_token_record(session: Session, jti: str) -> bool:
    """Return True if the refresh token record exists and is not revoked and not expired."""
    rt = session.exec(select(RefreshToken).where(RefreshToken.jti == jti)).first()
    if not rt:
        return False
    if rt.revoked:
        return False
    if rt.expires_at and datetime.now(timezone.utc) > rt.expires_at:
        return False
    return True


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_user_by_username(session: Session, username: str) -> User | None:
    """Fetch a user by username."""
    return session.exec(select(User).where(User.username == username)).first()


def get_user_by_id(session: Session, user_id: int) -> User | None:
    """Fetch a user by id."""
    return session.get(User, user_id)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    """Dependency to get the authenticated user from a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type = payload.get("type")

        if user_id is None or token_type == "refresh":
            raise credentials_exception

        user = get_user_by_id(session, int(user_id))
        if user is None:
            raise credentials_exception

        return user
    except Exception as exc:
        raise credentials_exception from exc


async def get_current_user_optional(
    # request: "fastapi.Request",
    request: Request,
    session: Session = Depends(get_session),
) -> User | None:
    """Optional current user dependency. Returns User if valid Bearer token exists, otherwise None."""

    auth: str | None = request.headers.get("Authorization")
    if not auth:
        return None

    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type = payload.get("type")
        if user_id is None or token_type == "refresh":
            return None
        user = get_user_by_id(session, int(user_id))
        return user
    except Exception:
        return None
