import os
# pyrefly: ignore[missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Support PostgreSQL by default or SQLite fallback if DATABASE_URL is not set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./stockflow.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "stockflow-dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
