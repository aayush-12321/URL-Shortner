from fastapi import FastAPI
from contextlib import asynccontextmanager

# Import models to register them with SQLModel
from app.models.models import ShortenedURL, ClickLog, User  # noqa: F401

# Import database setup
from app.database.db import create_db_and_tables

# Import routes
from app.routes.urls import router as urls_router
from app.auth.router import router as auth_router

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

# Include routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(urls_router)


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


