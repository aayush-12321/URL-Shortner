from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone


class ShortenedURL(SQLModel, table=True):
    """Database model for shortened URLs"""
    id: int | None = Field(default=None, primary_key=True)
    original_url: str = Field(index=True)
    short_code: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    click_count: int = Field(default=0)
    description: Optional[str] = None


class URLCreate(SQLModel):
    """Schema for creating a shortened URL"""
    original_url: str
    description: str | None = None
    expires_at: Optional[datetime] = None


class URLResponse(SQLModel):
    """Schema for URL response"""
    short_code: str
    original_url: str
    click_count: int
    created_at: datetime
    description: Optional[str] = None


class URLUpdate(SQLModel):
    """Schema for updating a URL"""
    description: Optional[str] = None
    expires_at: Optional[datetime] = None


class ClickLog(SQLModel, table=True):
    """Database model for click tracking"""
    id: int | None = Field(default=None, primary_key=True)
    short_code: str = Field(foreign_key="shortenedurl.short_code")
    clicked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: str | None = None
    user_agent: str | None = None