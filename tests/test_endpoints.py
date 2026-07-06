import pytest
from app.schemas.expense import ExpenseCreate

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# GET /api/v1/expenses/
# ---------------------------------------------------------------------------


def test_list_expenses_empty(client):
    response = client.get("/api/v1/expenses/")
    assert response.status_code == 200
    assert response.json() == []


def test_list_expenses_returns_created(client, created_expense):
    response = client.get("/api/v1/expenses/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["vendor"] == "Test Shop"


# ---------------------------------------------------------------------------
# GET /api/v1/expenses/{id}
# ---------------------------------------------------------------------------


def test_get_expense_found(client, created_expense):
    expense_id = created_expense["id"]
    response = client.get(f"/api/v1/expenses/{expense_id}")
    assert response.status_code == 200
    assert response.json()["vendor"] == "Test Shop"
    assert response.json()["document_type"] == "receipt"


def test_get_expense_not_found(client):
    response = client.get("/api/v1/expenses/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"


# ---------------------------------------------------------------------------
# POST /api/v1/expenses/
# ---------------------------------------------------------------------------


def test_create_expense(client, sample_expense_payload):
    response = client.post("/api/v1/expenses/", json=sample_expense_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["vendor"] == "Test Shop"
    assert data["total"] == 25.50
    assert data["document_type"] == "receipt"
    assert "id" in data
    assert "created_at" in data


def test_create_expense_minimal(client):
    """All fields are optional — empty payload should succeed."""
    response = client.post("/api/v1/expenses/", json={})
    assert response.status_code == 201
    data = response.json()
    assert data["vendor"] is None
    assert data["total"] is None


def test_create_multiple_expenses(client, sample_expense_payload):
    client.post("/api/v1/expenses/", json=sample_expense_payload)
    client.post(
        "/api/v1/expenses/", json={**sample_expense_payload, "vendor": "Other Shop"}
    )
    response = client.get("/api/v1/expenses/")
    assert len(response.json()) == 2


# ---------------------------------------------------------------------------
# DELETE /api/v1/expenses/{id}
# ---------------------------------------------------------------------------


def test_delete_expense(client, created_expense):
    expense_id = created_expense["id"]
    response = client.delete(f"/api/v1/expenses/{expense_id}")
    assert response.status_code == 204

    response = client.get(f"/api/v1/expenses/{expense_id}")
    assert response.status_code == 404


def test_delete_expense_not_found(client):
    response = client.delete("/api/v1/expenses/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"


# ---------------------------------------------------------------------------
# POST /api/v1/expenses/upload
# ---------------------------------------------------------------------------


def test_upload_receipt_success(client, mocker, fake_image_file):
    mock_expense = ExpenseCreate(
        vendor="Supermarket ABC",
        total=42.0,
        date="2024-03-10",
        address="456 Shop Ave",
        raw_text="Supermarket ABC\nTotal: 42.00",
        document_type=None,
    )
    mocker.patch(
        "app.api.v1.routes.expenses.extract_with_vision", return_value=mock_expense
    )
    mocker.patch("app.api.v1.routes.expenses.classify_document", return_value="receipt")
    mocker.patch("os.remove")  # prevent actual file deletion attempts

    response = client.post(
        "/api/v1/expenses/upload",
        files={"file": ("receipt.jpg", fake_image_file, "image/jpeg")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["vendor"] == "Supermarket ABC"
    assert data["document_type"] == "receipt"
    assert data["total"] == 42.0


def test_upload_accepts_non_receipt_documents(client, mocker, fake_image_file):
    mock_expense = ExpenseCreate(
        vendor="Kyivenergo",
        total=300.0,
        raw_text="Kyivenergo\nElectricity bill",
    )
    mocker.patch(
        "app.api.v1.routes.expenses.extract_with_vision", return_value=mock_expense
    )
    mocker.patch(
        "app.api.v1.routes.expenses.classify_document", return_value="utility_bill"
    )

    response = client.post(
        "/api/v1/expenses/upload",
        files={"file": ("bill.jpg", fake_image_file, "image/jpeg")},
    )
    assert response.status_code == 201
    assert response.json()["document_type"] == "utility_bill"


def test_upload_requires_file(client):
    response = client.post("/api/v1/expenses/upload")
    assert response.status_code == 422
