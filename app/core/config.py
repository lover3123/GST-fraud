from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    PROJECT_NAME: str = "GST E-Invoice Guardian"

    DATABASE_URL: str = "sqlite:///./gst_guardian.db"
    REDIS_URL: str = "redis://localhost:6379/0"


settings = Settings()
