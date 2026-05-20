from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM
    ollama_model: str = "qwen2.5:7b"
    ollama_base_url: str = "http://localhost:11434/v1"
    openai_api_key: str = (
        "ollama"  # для Ollama не нужен; для Groq/OpenAI - реальный ключ
    )

    database_url: str = "sqlite+aiosqlite:///./app.db"

    # Supabase Auth
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""

    # OCR — облачные провайдеры (опционально)
    yandex_vision_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
