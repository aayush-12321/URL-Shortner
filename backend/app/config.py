from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "sqlite:///./data/database.db"

    # Security
    secret_key: str = Field(..., min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cookie_secure: bool = False
    csrf_header_name: str = "X-CSRF-Token"
    login_lockout_attempts: int = 5
    login_lockout_minutes: int = 1
    login_rate_limit_per_minute: int = 10
    register_rate_limit_per_minute: int = 5

    # API
    api_title: str = "URL Shortener API"
    api_version: str = "1.0.0"

    # URL Expiration
    default_url_expiration_days: int = 30


settings = Settings()