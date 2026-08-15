from typing import Optional
from datetime import datetime, timezone

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """Database model for a user."""
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, min_length=3, max_length=50)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(SQLModel):
    """Schema for registering a new user."""
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(SQLModel):
    """Schema for login request payload."""
    username: str
    password: str


class UserRead(SQLModel):
    """Schema for returning user information."""
    id: int
    username: str
    email: EmailStr
    created_at: datetime


class ShortenedURL(SQLModel, table=True):
    """Database model for shortened URLs."""
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int | None = Field(default=None, foreign_key="user.id")
    original_url: str = Field(index=True)
    short_code: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    click_count: int = Field(default=0)
    description: Optional[str] = None


class URLCreate(SQLModel):
    """Schema for creating a shortened URL."""
    original_url: str
    description: str | None = None
    expires_at: Optional[datetime] = None


class URLResponse(SQLModel):
    """Schema for URL response."""
    short_code: str
    original_url: str
    click_count: int
    created_at: datetime
    description: Optional[str] = None


class URLUpdate(SQLModel):
    """Schema for updating a URL."""
    description: Optional[str] = None
    expires_at: Optional[datetime] = None


class ClickLog(SQLModel, table=True):
    """Database model for click tracking."""
    id: int | None = Field(default=None, primary_key=True)
    short_code: str = Field(foreign_key="shortenedurl.short_code")
    clicked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: str | None = None
    user_agent: str | None = None


class Token(SQLModel):
    """JWT response payload."""
    access_token: str
    token_type: str = "bearer"
    

class TokenData(SQLModel):
    """Token metadata."""
    user_id: int | None = None

class RefreshToken(SQLModel, table=True):
    """Stored refresh tokens for rotation and revocation."""
    id: int | None = Field(default=None, primary_key=True)
    jti: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
