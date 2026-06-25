from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


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


class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime
    items: List[ExpenseItemSchema] = []

    model_config = {"from_attributes": True}

