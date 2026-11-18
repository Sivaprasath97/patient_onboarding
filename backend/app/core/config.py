from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings, read from environment variables or backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    mongodb_uri: str  # required: MongoDB Atlas connection string
    mongodb_db: str = "patient_onboarding"

    jwt_secret: str  # required
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    max_failed_logins: int = 5
    lock_minutes: int = 15
    reset_token_minutes: int = 30
    expose_reset_link: bool = True  # dev only: return the reset link because no email service exists yet

    cors_origins: List[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]


settings = Settings()
