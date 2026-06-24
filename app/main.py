from fastapi import FastAPI

from app.api.v1.routes import expenses
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartExpense",
    description="Receipt processing and expense tracking API",
    version="0.1.0",
)

app.include_router(expenses.router, prefix="/api/v1/expenses", tags=["expenses"])


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
