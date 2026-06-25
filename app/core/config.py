from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/smartexpense"
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
