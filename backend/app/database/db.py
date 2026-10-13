from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import inspect, text
from typing import Generator
from app.config import settings


from pathlib import Path



def get_engine():
    """Create database engine based on configured database URL"""
    db_url = settings.database_url
    if db_url.startswith("sqlite:///./"):
        backend_dir = Path(__file__).resolve().parents[2]
        db_path = backend_dir / db_url.removeprefix("sqlite:///./")
        db_url = f"sqlite:///{db_path}"

    # SQLite requires special handling for threading
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    
    return create_engine(
        db_url,
        connect_args=connect_args,
        echo=False  # Set to True for SQL debugging
    )


engine = get_engine()



def create_db_and_tables():
    """Create tables and apply a small schema compatibility update."""
    SQLModel.metadata.create_all(engine)

    inspector = inspect(engine)

    if not inspector.has_table("user"):
        return

    user_columns = {
        column["name"]
        for column in inspector.get_columns("user")
    }

    if "image_url" not in user_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE user ADD COLUMN image_url VARCHAR")
            )

    if "email_verified" not in user_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE user ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE")
            )



def get_session() -> Generator[Session, None, None]:
    """Dependency for getting database session in routes"""
    with Session(engine) as session:
        yield session