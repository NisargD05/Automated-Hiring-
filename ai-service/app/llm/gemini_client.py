import requests
from app.core.config import settings
from app.utils.logger import get_logger


logger = get_logger(__name__)


class GeminiRequestError(RuntimeError):
    pass


def generate_with_gemini(
    prompt: str,
    *,
    temperature=None,
    max_output_tokens=None,
    response_mime_type=None,
    raise_on_error: bool = False,
    log_prefix: str = "[Gemini]",
) -> str:
    if settings.ai_provider != "gemini":
        message = "Gemini skipped because AI_PROVIDER is not gemini"
        logger.info("%s %s", log_prefix, message)
        if raise_on_error:
            raise GeminiRequestError(message)
        return ""

    if not settings.gemini_api_key:
        message = "Gemini API key missing"
        logger.warning("%s %s", log_prefix, message)
        if raise_on_error:
            raise GeminiRequestError(message)
        return ""

    model_names = []
    for model_name in [settings.gemini_model, *settings.gemini_fallback_models]:
        if model_name and model_name not in model_names:
            model_names.append(model_name)

    generation_config = {
        "temperature": settings.llm_temperature if temperature is None else temperature,
    }
    if max_output_tokens:
        generation_config["maxOutputTokens"] = max_output_tokens
    if response_mime_type:
        generation_config["responseMimeType"] = response_mime_type

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
        "generationConfig": generation_config,
    }

    last_error = None
    data = None
    active_model = None
    for model_name in model_names:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_name}:generateContent"
        )
        logger.info("%s Sending request model=%s promptLength=%s", log_prefix, model_name, len(prompt or ""))
        try:
            response = requests.post(
                url,
                params={"key": settings.gemini_api_key},
                json=payload,
                timeout=settings.llm_timeout_seconds,
            )
            response.raise_for_status()
            data = response.json()
            active_model = model_name
            break
        except requests.RequestException as error:
            status_code = getattr(error.response, "status_code", "unknown")
            response_text = getattr(error.response, "text", "") if error.response is not None else repr(error)
            last_error = f"Gemini request failed for {model_name} with status {status_code}: {response_text[:700]}"
            logger.warning("%s %s", log_prefix, last_error)

    if data is None:
        message = last_error or "Gemini request failed before receiving a response"
        if raise_on_error:
            raise GeminiRequestError(message)
        return ""

    candidates = data.get("candidates", [])
    if not candidates:
        message = "Gemini response contained no candidates"
        logger.warning("%s %s", log_prefix, message)
        if raise_on_error:
            raise GeminiRequestError(message)
        return ""

    parts = candidates[0].get("content", {}).get("parts", [])
    text = "\n".join(part.get("text", "") for part in parts).strip()
    if not text:
        message = "Gemini response text was empty"
        logger.warning("%s %s", log_prefix, message)
        if raise_on_error:
            raise GeminiRequestError(message)
        return ""

    logger.info("%s Response received model=%s length=%s", log_prefix, active_model, len(text))
    return text
