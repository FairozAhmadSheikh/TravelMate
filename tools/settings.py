
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    GROQ_API_KEY: str
    TAVILY_API_KEY: str
    DATABASE_URL: str

    AVIATIONSTACK_API_KEY: str

    LANGSMITH_API_KEY: str
    LANGSMITH_TRACING: bool = False
    LANGSMITH_PROJECT: str
    LANGSMITH_ENDPOINT: str

    DEFAULT_ORIGIN_IATA: str


settings = Settings()
