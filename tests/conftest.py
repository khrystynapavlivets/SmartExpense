import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# StaticPool forces all sessions to reuse a single in-memory connection,
# so tables created by create_all are visible to every session.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def setup_db():
    """Create all tables before each test, drop after."""
    import app.models  # noqa: F401 — register Expense + ExpenseItem
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(setup_db):
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """TestClient with DB overridden to SQLite."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_expense_payload():
    return {
        "vendor": "Test Shop",
        "total": 25.50,
        "date": "2024-01-15",
        "address": "123 Main St",
        "raw_text": "Test Shop\nTotal: 25.50",
        "image_path": "/uploads/test.jpg",
        "document_type": "receipt",
    }


@pytest.fixture
def created_expense(client, sample_expense_payload):
    response = client.post("/api/v1/expenses/", json=sample_expense_payload)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def fake_image_file():
    """Minimal valid JPEG bytes for upload tests."""
    jpeg_bytes = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00"
        b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
        b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xff\xd9"
    )
    return io.BytesIO(jpeg_bytes)
