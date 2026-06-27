from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pathlib import Path
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.expense import Expense
from app.models.expense_item import ExpenseItem
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseRead, ExpenseUpdate, ExpenseSummary, CategorySummary
from app.core.config import settings
from app.services.ocr import extract_with_vision
from app.services.classifier import classify_document

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.get("/", response_model=List[ExpenseRead])
def list_expenses(
    skip: int = 0,
    limit: int = 20,
    vendor: Optional[str] = None,
    document_type: Optional[str] = None,
    min_total: Optional[float] = None,
    max_total: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if vendor:
        query = query.filter(Expense.vendor.ilike(f"%{vendor}%"))
    if document_type:
        query = query.filter(Expense.document_type == document_type)
    if min_total is not None:
        query = query.filter(Expense.total >= min_total)
    if max_total is not None:
        query = query.filter(Expense.total <= max_total)
    return query.order_by(Expense.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/summary", response_model=ExpenseSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_count, total_amount = db.query(
        func.count(Expense.id),
        func.coalesce(func.sum(Expense.total), 0.0),
    ).filter(Expense.user_id == current_user.id).one()

    rows = (
        db.query(
            Expense.document_type,
            func.count(Expense.id).label("count"),
            func.coalesce(func.sum(Expense.total), 0.0).label("total"),
        )
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.document_type)
        .all()
    )

    return ExpenseSummary(
        total_count=total_count,
        total_amount=total_amount,
        by_category=[
            CategorySummary(document_type=r.document_type, count=r.count, total=r.total)
            for r in rows
        ],
    )


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    for field, value in payload.model_dump(exclude={"items"}, exclude_unset=True).items():
        setattr(expense, field, value)

    if payload.items is not None:
        for item in expense.items:
            db.delete(item)
        db.flush()
        for item in payload.items:
            db.add(ExpenseItem(expense_id=expense.id, **item.model_dump()))

    db.commit()
    db.refresh(expense)
    return expense


@router.post("/", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = Expense(**payload.model_dump(exclude={"items"}), user_id=current_user.id)
    db.add(expense)
    db.flush()

    for item in payload.items:
        db.add(ExpenseItem(expense_id=expense.id, **item.model_dump()))

    db.commit()
    db.refresh(expense)
    return expense


@router.post("/upload", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def upload_expense_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: jpeg, png, webp, pdf.",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 10 MB limit.",
        )

    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename).suffix
    saved_path = settings.UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"

    with open(saved_path, "wb") as f:
        f.write(contents)

    expense_data = extract_with_vision(str(saved_path))

    doc_type = classify_document(expense_data.raw_text)
    expense_data.document_type = doc_type

    expense = Expense(**expense_data.model_dump(exclude={"items"}), user_id=current_user.id)
    db.add(expense)
    db.flush()

    for item in expense_data.items:
        db.add(ExpenseItem(expense_id=expense.id, **item.model_dump()))

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    db.delete(expense)
    db.commit()
