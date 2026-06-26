from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi import UploadFile, File
from app.core.database import get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseRead
from app.core.config import settings
from app.services.ocr import extract_with_vision
from app.services.classifier import classify_document
from pathlib import Path
import uuid
import os

router = APIRouter()


@router.get("/", response_model=List[ExpenseRead])
def list_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.created_at.desc()).all()


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
        )
    return expense


@router.post("/", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.post("/upload", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def upload_expense_receipt(
    file: UploadFile = File(...), db: Session = Depends(get_db)
):
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename).suffix
    saved_path = settings.UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"

    contents = await file.read()
    with open(saved_path, "wb") as f:
        f.write(contents)

    expense_data = extract_with_vision(str(saved_path))

    doc_type = classify_document(expense_data.raw_text)

    if doc_type != "receipt":
        os.remove(saved_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded document classified as '{doc_type}'. Only receipts are accepted.",
        )

    expense_data.document_type = doc_type

    expense = Expense(**expense_data.model_dump(exclude={"items"}))
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
        )
    db.delete(expense)
    db.commit()
