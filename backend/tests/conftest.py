import os
import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine

from app.database import db as db_module
from app.main import app


@pytest.fixture
def test_db_engine() -> Generator:
    db_name = f"test_{uuid.uuid4().hex}.db"
    db_path = os.path.join("/tmp", db_name)
    db_url = f"sqlite:///{db_path}"

    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    db_module.engine = engine

    from app.config import settings

    settings.database_url = db_url

    SQLModel.metadata.create_all(engine)
    try:
        yield engine
    finally:
        engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)


@pytest.fixture
def client(test_db_engine) -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client
