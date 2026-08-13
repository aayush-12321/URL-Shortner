from sqlmodel import create_engine, SQLModel, Session
from typing import Generator
from app.config import settings


def get_engine():
    """Create database engine based on configured database URL"""
    # SQLite requires special handling for threading
    connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}
    
    return create_engine(
        settings.database_url,
        connect_args=connect_args,
        echo=False  # Set to True for SQL debugging
    )


engine = get_engine()


def create_db_and_tables():
    """Create database tables on startup"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency for getting database session in routes"""
    with Session(engine) as session:
        yield session