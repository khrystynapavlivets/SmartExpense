from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import expenses, auth
from app.core.config import settings

app = FastAPI(
    title="SmartExpense",
    description="Receipt processing and expense tracking API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(expenses.router, prefix="/api/v1/expenses", tags=["expenses"])

settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
