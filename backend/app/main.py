from fastapi import FastAPI
from contextlib import asynccontextmanager

# Import models to register them with SQLModel
from app.models.models import ShortenedURL, ClickLog  # noqa: F401

# Import database setup
from app.database.db import create_db_and_tables

# Import settings
from app.config import settings


# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    create_db_and_tables()
    print("Database initialized")
    yield
    # Shutdown
    print("Application shutting down")


# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description="Fast URL shortening service built with FastAPI",
    version=settings.api_version,
    lifespan=lifespan
)


@app.get("/")
def read_root():
    return {
        "message": "URL Shortener API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


