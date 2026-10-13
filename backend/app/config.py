from pathlib import Path
from functools import lru_cache

from pydantic import Field, SecretStr, field_validator
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

    # Google OAuth
    google_client_id: str
    google_client_secret: SecretStr

    # Application URLs
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    environment: str = "development"

    # RESEND OTP setup
    RESEND_API_KEY: SecretStr
    EMAIL_FROM: str

    # Security
    secret_key: SecretStr = Field(..., min_length=32)
    algorithm: str = "HS256"

    access_token_expire_minutes: int = 10
    refresh_token_expire_days: int = 7

    cookie_secure: bool = False
    csrf_header_name: str = "X-CSRF-Token"

    # OAuth session middleware
    session_secret: SecretStr = Field(..., min_length=32)

    # Authentication security
    login_lockout_attempts: int = 5
    login_lockout_minutes: int = 1
    login_rate_limit_per_minute: int = 10
    register_rate_limit_per_minute: int = 5

    # API
    api_title: str = "URL Shortener API"
    api_version: str = "1.0.0"

    # URL Expiration
    default_url_expiration_days: int = 30

    @field_validator("access_token_expire_minutes", "refresh_token_expire_days")
    @classmethod
    def validate_positive_lifetimes(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Token expiration values must be positive")
        return value

    @field_validator("frontend_url", "backend_url")
    @classmethod
    def normalize_urls(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
