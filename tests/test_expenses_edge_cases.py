import io

import pytest

from app.core.config import settings
from app.schemas.expense import ExpenseCreate


# ---------------------------------------------------------------------------
# GET /api/v1/expenses/summary
# ---------------------------------------------------------------------------

def test_summary_empty(client):
    response = client.get("/api/v1/expenses/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 0
    assert data["total_amount"] == 0.0
    assert data["by_category"] == []


def test_summary_aggregates_by_category(client, sample_expense_payload):
    client.post("/api/v1/expenses/", json=sample_expense_payload)
    client.post("/api/v1/expenses/", json={**sample_expense_payload, "total": 10.0, "document_type": "taxi"})
    client.post("/api/v1/expenses/", json={**sample_expense_payload, "total": 5.0, "document_type": "taxi"})

    response = client.get("/api/v1/expenses/summary")
    data = response.json()
    assert data["total_count"] == 3
    assert data["total_amount"] == pytest.approx(40.50)

    by_type = {c["document_type"]: c for c in data["by_category"]}
    assert by_type["receipt"]["count"] == 1
    assert by_type["taxi"]["count"] == 2
    assert by_type["taxi"]["total"] == pytest.approx(15.0)


# ---------------------------------------------------------------------------
# PUT /api/v1/expenses/{id}
# ---------------------------------------------------------------------------

def test_update_expense_partial_fields(client, created_expense):
    response = client.put(
        f"/api/v1/expenses/{created_expense['id']}", json={"vendor": "Updated Vendor"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["vendor"] == "Updated Vendor"
    assert data["total"] == created_expense["total"]


def test_update_expense_not_found(client):
    response = client.put("/api/v1/expenses/999", json={"vendor": "X"})
    assert response.status_code == 404


def test_update_expense_replaces_items(client, sample_expense_payload):
    payload = {**sample_expense_payload, "items": [{"name": "Milk", "quantity": 1, "price": 2.0, "amount": 2.0}]}
    created = client.post("/api/v1/expenses/", json=payload).json()
    assert len(created["items"]) == 1

    update_response = client.put(
        f"/api/v1/expenses/{created['id']}",
        json={"items": [
            {"name": "Bread", "quantity": 2, "price": 1.5, "amount": 3.0},
            {"name": "Eggs", "quantity": 1, "price": 4.0, "amount": 4.0},
        ]},
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert len(data["items"]) == 2
    names = {item["name"] for item in data["items"]}
    assert names == {"Bread", "Eggs"}


def test_update_expense_omits_items_key_keeps_existing_items(client, sample_expense_payload):
    payload = {**sample_expense_payload, "items": [{"name": "Milk", "quantity": 1, "price": 2.0, "amount": 2.0}]}
    created = client.post("/api/v1/expenses/", json=payload).json()

    response = client.put(f"/api/v1/expenses/{created['id']}", json={"vendor": "New Name"})
    assert response.status_code == 200
    assert len(response.json()["items"]) == 1


# ---------------------------------------------------------------------------
# GET /api/v1/expenses/{id}/image
# ---------------------------------------------------------------------------

def test_get_expense_image_success(client, sample_expense_payload):
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    image_file = settings.UPLOAD_DIR / "receipt123.jpg"
    image_file.write_bytes(b"\xff\xd8\xff\xd9")

    payload = {**sample_expense_payload, "image_path": "receipt123.jpg"}
    created = client.post("/api/v1/expenses/", json=payload).json()

    response = client.get(f"/api/v1/expenses/{created['id']}/image")
    assert response.status_code == 200


def test_get_expense_image_missing_file_returns_404(client, sample_expense_payload):
    payload = {**sample_expense_payload, "image_path": "does-not-exist.jpg"}
    created = client.post("/api/v1/expenses/", json=payload).json()

    response = client.get(f"/api/v1/expenses/{created['id']}/image")
    assert response.status_code == 404


def test_get_expense_image_no_image_path_returns_404(client, created_expense):
    """created_expense fixture uses an image_path that was never written to disk."""
    response = client.get(f"/api/v1/expenses/{created_expense['id']}/image")
    assert response.status_code == 404


def test_get_expense_image_rejects_path_traversal(client, sample_expense_payload):
    outside_file = settings.UPLOAD_DIR.parent / "secret.txt"
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    outside_file.write_text("top secret")

    payload = {**sample_expense_payload, "image_path": "../secret.txt"}
    created = client.post("/api/v1/expenses/", json=payload).json()

    response = client.get(f"/api/v1/expenses/{created['id']}/image")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/v1/expenses/ filters
# ---------------------------------------------------------------------------

def test_list_expenses_filters_by_vendor(client, sample_expense_payload):
    client.post("/api/v1/expenses/", json=sample_expense_payload)
    client.post("/api/v1/expenses/", json={**sample_expense_payload, "vendor": "Other Shop"})

    response = client.get("/api/v1/expenses/", params={"vendor": "test"})
    data = response.json()
    assert len(data) == 1
    assert data[0]["vendor"] == "Test Shop"


def test_list_expenses_filters_by_document_type(client, sample_expense_payload):
    client.post("/api/v1/expenses/", json=sample_expense_payload)
    client.post("/api/v1/expenses/", json={**sample_expense_payload, "document_type": "taxi"})

    response = client.get("/api/v1/expenses/", params={"document_type": "taxi"})
    data = response.json()
    assert len(data) == 1
    assert data[0]["document_type"] == "taxi"


def test_list_expenses_filters_by_total_range(client, sample_expense_payload):
    client.post("/api/v1/expenses/", json={**sample_expense_payload, "total": 5.0})
    client.post("/api/v1/expenses/", json={**sample_expense_payload, "total": 50.0})
    client.post("/api/v1/expenses/", json={**sample_expense_payload, "total": 500.0})

    response = client.get("/api/v1/expenses/", params={"min_total": 10, "max_total": 100})
    data = response.json()
    assert len(data) == 1
    assert data[0]["total"] == 50.0


# ---------------------------------------------------------------------------
# POST /api/v1/expenses/upload validation
# ---------------------------------------------------------------------------

def test_upload_rejects_unsupported_content_type(client, fake_image_file):
    response = client.post(
        "/api/v1/expenses/upload",
        files={"file": ("receipt.txt", fake_image_file, "text/plain")},
    )
    assert response.status_code == 415


def test_upload_rejects_oversized_file(client):
    big_content = io.BytesIO(b"0" * (10 * 1024 * 1024 + 1))
    response = client.post(
        "/api/v1/expenses/upload",
        files={"file": ("receipt.jpg", big_content, "image/jpeg")},
    )
    assert response.status_code == 413


def test_upload_returns_502_and_cleans_up_file_on_extraction_failure(client, mocker, fake_image_file):
    mocker.patch(
        "app.api.v1.routes.expenses.extract_with_vision",
        side_effect=RuntimeError("vision API down"),
    )

    response = client.post(
        "/api/v1/expenses/upload",
        files={"file": ("receipt.jpg", fake_image_file, "image/jpeg")},
    )
    assert response.status_code == 502

    saved_files = list(settings.UPLOAD_DIR.iterdir())
    assert saved_files == []
