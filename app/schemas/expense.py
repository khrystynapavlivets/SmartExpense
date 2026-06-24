from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ExpenseBase(BaseModel):
    vendor: Optional[str] = None
    total: Optional[float] = None
    date: Optional[str] = None
    address: Optional[str] = None
    raw_text: Optional[str] = None
    image_path: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
