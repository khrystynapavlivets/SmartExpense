from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/smartexpense"
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    GROQ_VISION_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    GROQ_CLASSIFIER_MODEL: str = "llama-3.1-8b-instant"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
