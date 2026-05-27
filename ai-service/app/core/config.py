import os
from pathlib import Path
from dotenv import load_dotenv
from app.utils.logger import get_logger


logger = get_logger(__name__)

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

logger.info("[Gemini] Loading environment variables", extra={"envPath": str(ENV_PATH)})
load_dotenv(dotenv_path=ENV_PATH)
load_dotenv()


class Settings:
    app_name = os.getenv("APP_NAME", "AI Hiring JD Service")
    ai_provider = os.getenv("AI_PROVIDER", "gemini").lower()
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    gemini_fallback_models = [
        model.strip()
        for model in os.getenv(
            "GEMINI_FALLBACK_MODELS",
            "gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash-lite",
        ).split(",")
        if model.strip()
    ]
    llm_temperature = float(os.getenv("LLM_TEMPERATURE", "0.4"))
    llm_timeout_seconds = int(os.getenv("LLM_TIMEOUT_SECONDS", "45"))
    chroma_persist_directory = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_data")
    chroma_collection_name = os.getenv("CHROMA_COLLECTION_NAME", "knowledge_base_documents")
    # When running ChromaDB as a Docker service, use the service host and port.
    # Support both new and legacy env names so containers with older envs still work.
    chroma_http_host = os.getenv("CHROMA_HTTP_HOST") or os.getenv("CHROMA_HOST", "")
    chroma_http_port = int(os.getenv("CHROMA_HTTP_PORT") or os.getenv("CHROMA_PORT", "8000"))
    embedding_model_name = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    embedding_provider = os.getenv("EMBEDDING_PROVIDER", "sentence-transformers")


settings = Settings()

logger.info(
    "[Gemini] API key %s",
    "found" if settings.gemini_api_key else "missing",
)
logger.info(
    "[Gemini] Config loaded provider=%s model=%s fallbackModels=%s",
    settings.ai_provider,
    settings.gemini_model,
    settings.gemini_fallback_models,
)
