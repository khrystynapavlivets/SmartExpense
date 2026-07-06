import pytest

from app.models.expense import Expense


@pytest.fixture
def other_users_expense(db, other_user):
    expense = Expense(
        vendor="Other Shop",
        total=99.0,
        document_type="receipt",
        image_path="private.jpg",
        user_id=other_user.id,
    )
    db.add(expense)
    db.flush()
    return expense


# ---------------------------------------------------------------------------
# Isolation: current user (test_user) must not see other_user's data
# ---------------------------------------------------------------------------


def test_list_expenses_excludes_other_users_expenses(
    client, other_users_expense, created_expense
):
    response = client.get("/api/v1/expenses/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["vendor"] == "Test Shop"


def test_get_expense_404s_for_other_users_expense(client, other_users_expense):
    response = client.get(f"/api/v1/expenses/{other_users_expense.id}")
    assert response.status_code == 404


def test_update_expense_404s_for_other_users_expense(client, other_users_expense):
    response = client.put(
        f"/api/v1/expenses/{other_users_expense.id}", json={"vendor": "Hacked"}
    )
    assert response.status_code == 404


def test_delete_expense_404s_for_other_users_expense(client, other_users_expense):
    response = client.delete(f"/api/v1/expenses/{other_users_expense.id}")
    assert response.status_code == 404


def test_image_404s_for_other_users_expense(client, other_users_expense):
    response = client.get(f"/api/v1/expenses/{other_users_expense.id}/image")
    assert response.status_code == 404


def test_summary_excludes_other_users_expenses(
    client, other_users_expense, created_expense
):
    response = client.get("/api/v1/expenses/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 1
    assert data["total_amount"] == 25.50


def test_delete_own_expense_does_not_touch_other_users_expense(
    client, created_expense, other_users_expense, db
):
    client.delete(f"/api/v1/expenses/{created_expense['id']}")
    remaining = db.query(Expense).filter(Expense.id == other_users_expense.id).first()
    assert remaining is not None
