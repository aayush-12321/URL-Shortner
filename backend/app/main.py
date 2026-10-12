from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# Import models to register them with SQLModel
from app.models.models import ShortenedURL, ClickLog, User  # noqa: F401

# Import database setup
from app.database import db
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://url-shortner-ruby-theta.vercel.app", "https://url-shortener.parajuliaayush.com.np"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get(
    "/health",
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "A required dependency is unavailable"}},
)
def health_check() -> JSONResponse:
    """Report service readiness by checking the database connection."""
    try:
        with db.engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "checks": {"database": "unhealthy"}},
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "healthy", "checks": {"database": "healthy"}},
    )


