from app.core.config import settings


def get_model_config():
    return {
        "provider": settings.ai_provider,
        "model": settings.gemini_model,
        "temperature": settings.llm_temperature,
    }
