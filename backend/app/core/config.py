from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    GEMINI_API_KEY: str = ""
    DATABASE_PATH: str = "./data/sample.db"
    CONVERSATION_DB_PATH: str = "./data/conversations.db"
    MODEL_NAME: str = "gemini-3.1-flash-lite"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


def get_settings() -> Settings:
    """Create settings instance, handling missing .env gracefully."""
    try:
        return Settings()
    except Exception:
        # If .env is missing or has issues, fall back to env vars / defaults
        return Settings(_env_file=None)


settings = get_settings()
