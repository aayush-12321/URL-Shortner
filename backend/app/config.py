from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database - MUST be set in .env or environment
    database_url: str
    
    # Security
    secret_key: str = "secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cookie_secure: bool = False
    csrf_header_name: str = "X-CSRF-Token"
    login_lockout_attempts: int = 5
    login_lockout_minutes: int = 1
    # Rate limiting (simple defaults; use Redis in production)
    login_rate_limit_per_minute: int = 10
    register_rate_limit_per_minute: int = 5
    
    # API
    api_title: str = "URL Shortener API"
    api_version: str = "1.0.0"
    
    # URL Expiration (in days)
    default_url_expiration_days: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
