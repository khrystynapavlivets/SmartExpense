from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ExpenseItemSchema(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    amount: Optional[float] = None

    model_config = {"from_attributes": True}


class ExpenseBase(BaseModel):
    vendor: Optional[str] = None
    total: Optional[float] = None
    date: Optional[str] = None
    address: Optional[str] = None
    raw_text: Optional[str] = None
    image_path: Optional[str] = None
    document_type: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    items: List[ExpenseItemSchema] = []


class ExpenseUpdate(BaseModel):
    vendor: Optional[str] = None
    total: Optional[float] = None
    date: Optional[str] = None
    address: Optional[str] = None
    raw_text: Optional[str] = None
    document_type: Optional[str] = None
    items: Optional[List[ExpenseItemSchema]] = None


class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime
    items: List[ExpenseItemSchema] = []

    model_config = {"from_attributes": True}


class CategorySummary(BaseModel):
    document_type: Optional[str] = None
    count: int
    total: float = Field(default=0.0)


class ExpenseSummary(BaseModel):
    total_count: int
    total_amount: float = Field(default=0.0)
    by_category: List[CategorySummary]

