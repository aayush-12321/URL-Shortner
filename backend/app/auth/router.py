from fastapi import APIRouter, Body, Depends, HTTPException, status, Request, Response
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordRequestForm
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
import hashlib
import hmac
import secrets
from sqlmodel import Session, select
from sqlalchemy import func
import time
from uuid import uuid4
import resend

from app.database.db import get_session
from app.models.models import (
    EmailResendRequest,
    EmailChangeRequest,
    EmailVerification,
    EmailVerificationRequest,
    EmailVerificationResponse,
    Token,
    User,
    UserCreate,
    UserRead,
)
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
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


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


def create_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_verification_code(code: str) -> str:
    key = settings.secret_key.get_secret_value().encode("utf-8")
    return hmac.new(key, code.encode("utf-8"), hashlib.sha256).hexdigest()


def send_verification_email(email: str, code: str) -> None:
    resend.api_key = settings.RESEND_API_KEY.get_secret_value()
    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Verify your email address | ShortLink URL Shortener",
            "text": (
                f"Welcome to ShortLink URL Shortener!\n\n"
                f"Use the verification code below to complete your registration:\n\n"
                f"{code}\n\n"
                f"This code expires in {OTP_EXPIRY_MINUTES} minutes.\n\n"
                "If you did not try to create a URL Shortener account, "
                "you can safely ignore this email.\n\n"
                "The URL Shortener Team"
            ),
            "html": f"""
            <!DOCTYPE html>
            <html lang="en">
            <body style="margin:0;padding:0;background-color:#f4f6f8;
                        font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                <div style="max-width:520px;margin:40px auto;padding:0 16px;">
                    <div style="background:#ffffff;border:1px solid #e5e7eb;
                                border-radius:12px;overflow:hidden;">

                        <div style="background:#0B0D0E;padding:24px 28px;">
                            <h1 style="margin:0;color:#ffffff;font-size:22px;
                                    font-weight:600;">
                                URL Shortener
                            </h1>
                        </div>

                        <div style="padding:32px 28px;">
                            <h2 style="margin:0 0 16px;font-size:22px;
                                    color:#111827;">
                                Verify your email address
                            </h2>

                            <p style="font-size:15px;line-height:1.7;
                                    color:#4b5563;">
                                Welcome! Enter the verification code below
                                to complete your registration.
                            </p>

                            <div style="margin:28px 0;padding:22px 12px;
                                        background:#f9fafb;border:1px solid #e5e7eb;
                                        border-radius:8px;text-align:center;">
                                <p style="margin:0 0 10px;font-size:12px;
                                        color:#6b7280;text-transform:uppercase;
                                        letter-spacing:1.5px;">
                                    Your verification code
                                </p>
                                <div style="font-size:32px;font-weight:700;
                                            letter-spacing:8px;color:#111827;">
                                    {code}
                                </div>
                            </div>

                            <p style="font-size:14px;line-height:1.6;
                                    color:#4b5563;">
                                This code expires in
                                <strong>{OTP_EXPIRY_MINUTES} minutes</strong>.
                                For your security, do not share it with anyone.
                            </p>

                            <hr style="border:none;border-top:1px solid #e5e7eb;
                                    margin:28px 0;">

                            <p style="font-size:13px;line-height:1.6;
                                    color:#6b7280;">
                                Didn't request an account? You can safely
                                ignore this email.
                            </p>

                            <p style="margin:24px 0 0;font-size:14px;
                                    color:#374151;">
                                Thanks,<br>
                                <strong>The ShortLink URL Shortener Team</strong>
                            </p>
                        </div>
                    </div>

                    <p style="margin:18px 0;text-align:center;font-size:12px;
                            color:#9ca3af;">
                        Automated message from URL Shortener. Please do not
                        reply to this email.
                    </p>
                </div>
            </body>
            </html>
            """,
        }

    )


def utc_datetime(value: datetime) -> datetime:
    """Normalize SQLite's naive datetimes and aware database values to UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

router = APIRouter()

@router.get("/google/client-id")
def get_google_client_id():
    return {"client_id": settings.google_client_id}


@router.post("/google/authenticate", response_model=Token)
def google_authenticate(
    response: Response,
    credential: str = Body(embed=True),
    session: Session = Depends(get_session),
):
    try:
        user_info = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credential") from exc

    email = user_info.get("email", "").lower()
    image_url = user_info.get("picture")
    if not email or user_info.get("email_verified") is not True:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account email is not verified")

    user = session.exec(select(User).where(func.lower(User.email) == email)).first()
    if not user:
        username = str(user_info.get("name") or user_info.get("given_name") or email.split("@", 1)[0]).strip()[:50]
        if session.exec(select(User).where(User.username == username)).first():
            username = f"{username[:38]}_{uuid4().hex[:10]}"
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(uuid4().hex),
            image_url=image_url,
            email_verified=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        updated = False
        if not user.email_verified:
            user.email_verified = True
            pending = session.exec(
                select(EmailVerification).where(EmailVerification.user_id == user.id)
            ).first()
            if pending:
                session.delete(pending)
            updated = True
        if image_url and user.image_url != image_url:
            user.image_url = image_url
            updated = True
        if updated:
            session.add(user)
            session.commit()
            session.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    payload = decode_token(refresh_token)
    expires_at = datetime.fromtimestamp(int(payload["exp"]), timezone.utc)
    create_refresh_token_record(session, payload["jti"], user.id, expires_at=expires_at)

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


@router.post("/register", response_model=EmailVerificationResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, session: Session = Depends(get_session), request: Request = None):
    """Register a new user."""
    # rate limit registration
    limiter = rate_limiter("register", settings.register_rate_limit_per_minute)
    limiter(request)

    email = str(user.email).lower()
    if len(user.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be 72 bytes or fewer for bcrypt compatibility.",
        )

    existing_username = session.exec(
        select(User).where(User.username == user.username)
    ).first()
    existing_email = session.exec(
        select(User).where(func.lower(User.email) == email)
    ).first()

    pending_user = None
    verification = None
    if existing_username or existing_email:
        if (
            existing_username is not None
            and existing_email is not None
            and existing_username.id == existing_email.id
            and not existing_username.email_verified
        ):
            pending_user = existing_username
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered",
            )

    if pending_user:
        verification = session.exec(
            select(EmailVerification).where(EmailVerification.user_id == pending_user.id)
        ).first()
        if verification and verification.attempts >= OTP_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect codes. Please wait before restarting verification.",
            )
        new_user = pending_user
    else:
        new_user = User(
            username=user.username,
            email=email,
            hashed_password=get_password_hash(user.password),
            email_verified=False,
        )
        session.add(new_user)
        session.flush()

    now = datetime.now(timezone.utc)
    code = create_verification_code()
    code_hash = hash_verification_code(code)
    while pending_user and verification and hmac.compare_digest(verification.otp_hash, code_hash):
        code = create_verification_code()
        code_hash = hash_verification_code(code)

    try:
        send_verification_email(email, code)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send verification email. Please try again.",
        ) from exc

    new_user.hashed_password = get_password_hash(user.password)
    if verification:
        verification.otp_hash = code_hash
        verification.expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
        verification.attempts = 0
        verification.last_sent_at = now
        session.add(verification)
    else:
        session.add(
            EmailVerification(
                user_id=new_user.id,
                otp_hash=code_hash,
                expires_at=now + timedelta(minutes=OTP_EXPIRY_MINUTES),
                attempts=0,
                last_sent_at=now,
            )
        )
    session.add(new_user)
    session.commit()

    return EmailVerificationResponse(
        message="Verification code sent. Verify your email before logging in.",
        email=email,
        expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
        resend_after_seconds=OTP_RESEND_COOLDOWN_SECONDS,
    )


@router.post("/verify-email")
def verify_email(
    payload: EmailVerificationRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    rate_limiter("verify-email", 10)(request)
    email = str(payload.email).lower()
    user = session.exec(select(User).where(func.lower(User.email) == email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification request not found")
    if user.email_verified:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already verified")

    verification = session.exec(
        select(EmailVerification).where(EmailVerification.user_id == user.id)
    ).first()
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification code not found")
    if verification.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many incorrect codes. Request a new code.")
    if datetime.now(timezone.utc) >= utc_datetime(verification.expires_at):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Verification code has expired")

    if not hmac.compare_digest(verification.otp_hash, hash_verification_code(payload.code)):
        verification.attempts += 1
        session.add(verification)
        session.commit()
        if verification.attempts >= OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many incorrect codes. Request a new code.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    user.email_verified = True
    session.add(user)
    session.delete(verification)
    session.commit()
    return {"message": "Email verified successfully."}


@router.post("/resend-verification", response_model=EmailVerificationResponse)
def resend_verification_email(
    payload: EmailResendRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    rate_limiter("resend-verification", 5)(request)
    email = str(payload.email).lower()
    user = session.exec(select(User).where(func.lower(User.email) == email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.email_verified:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already verified")

    verification = session.exec(
        select(EmailVerification).where(EmailVerification.user_id == user.id)
    ).first()
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification request not found")

    now = datetime.now(timezone.utc)
    elapsed = (now - utc_datetime(verification.last_sent_at)).total_seconds()
    if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting another verification code.",
        )

    code = create_verification_code()
    new_code_hash = hash_verification_code(code)
    while hmac.compare_digest(verification.otp_hash, new_code_hash):
        code = create_verification_code()
        new_code_hash = hash_verification_code(code)
    try:
        send_verification_email(email, code)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send verification email. Please try again.",
        ) from exc

    verification.otp_hash = new_code_hash
    verification.expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    verification.attempts = 0
    verification.last_sent_at = now
    session.add(verification)
    session.commit()
    return EmailVerificationResponse(
        message="A new verification code has been sent.",
        email=email,
        expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
        resend_after_seconds=OTP_RESEND_COOLDOWN_SECONDS,
    )


@router.post("/change-pending-email", response_model=EmailVerificationResponse)
def change_pending_email(
    payload: EmailChangeRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    rate_limiter("change-pending-email", 5)(request)
    current_email = str(payload.email).lower()
    new_email = str(payload.new_email).lower()
    user = session.exec(select(User).where(func.lower(User.email) == current_email)).first()
    if not user or user.email_verified:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending verification account not found")
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    if new_email == current_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New email must be different")

    existing_user = session.exec(select(User).where(func.lower(User.email) == new_email)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    verification = session.exec(
        select(EmailVerification).where(EmailVerification.user_id == user.id)
    ).first()
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification code not found")

    code = create_verification_code()
    new_code_hash = hash_verification_code(code)
    while hmac.compare_digest(verification.otp_hash, new_code_hash):
        code = create_verification_code()
        new_code_hash = hash_verification_code(code)
    try:
        send_verification_email(new_email, code)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send verification email. Please try again.",
        ) from exc

    now = datetime.now(timezone.utc)
    user.email = new_email
    verification.otp_hash = new_code_hash
    verification.expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    verification.attempts = 0
    verification.last_sent_at = now
    session.add(user)
    session.add(verification)
    session.commit()
    return EmailVerificationResponse(
        message="Email updated. A new verification code has been sent.",
        email=new_email,
        expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
        resend_after_seconds=OTP_RESEND_COOLDOWN_SECONDS,
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

    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before logging in.")

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
        image_url=current_user.image_url,
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
