import requests
from app.core.config import settings
from app.utils.logger import get_logger


logger = get_logger(__name__)


def generate_with_gemini(prompt: str) -> str:
    if settings.ai_provider != "gemini":
        logger.info("Gemini skipped because AI_PROVIDER is not gemini")
        return ""

    if not settings.gemini_api_key:
        logger.warning("Gemini API key missing; using local fallback")
        return ""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": settings.llm_temperature,
        },
    }

    try:
        response = requests.post(
            url,
            params={"key": settings.gemini_api_key},
            json=payload,
            timeout=settings.llm_timeout_seconds,
        )
        response.raise_for_status()
    except requests.RequestException as error:
        status_code = getattr(error.response, "status_code", "unknown")
        logger.warning("Gemini request failed with status %s; using local fallback", status_code)
        return ""

    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return ""

    parts = candidates[0].get("content", {}).get("parts", [])
    return "\n".join(part.get("text", "") for part in parts).strip()
