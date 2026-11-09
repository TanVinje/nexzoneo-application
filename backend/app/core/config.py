from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./nexzoneo.db"
    secret_key: str = "nexzoneo-dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 5

    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_currency: str = "usd"
    payment_return_url: str = "nexzoneo://payment"

    class Config:
        env_file = ".env"


settings = Settings()

# Railway / Heroku style URLs use postgres:// — SQLAlchemy needs postgresql://
if settings.database_url.startswith("postgres://"):
    settings.database_url = settings.database_url.replace("postgres://", "postgresql://", 1)
