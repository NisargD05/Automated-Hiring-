import json
import re
from pydantic import ValidationError
from app.llm.gemini_client import generate_with_gemini
from app.rag.context_builder import build_candidate_context
from app.rag.prompt_builder import build_candidate_ranking_prompt, build_candidate_ranking_retry_prompt
from app.schemas.candidate_schema import CandidateRankingResponse
from app.utils.logger import get_logger


logger = get_logger(__name__)


def _as_list(value):
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _extract_json(raw_text: str):
    text = (raw_text or "").strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)
    return json.loads(text)


def normalize_ranking_result(result):
    score = int(float(result.get("score", 0) or 0))
    recommendation = result.get("recommendation", "Review")
    if recommendation not in ["Shortlist", "Review", "Reject"]:
        recommendation = "Review"

    return {
        "score": max(0, min(100, score)),
        "matchesWithJD": _as_list(result.get("matchesWithJD")),
        "missingWithJD": _as_list(result.get("missingWithJD")),
        "missingLinks": _as_list(result.get("missingLinks")),
        "strengths": _as_list(result.get("strengths")),
        "weaknesses": _as_list(result.get("weaknesses")),
        "recommendation": recommendation,
        "rankingReason": str(result.get("rankingReason", "")),
    }


def parse_and_validate_ranking(raw_output: str):
    parsed = _extract_json(raw_output)
    normalized = normalize_ranking_result(parsed)
    validated = CandidateRankingResponse(**normalized)
    return validated.model_dump(exclude_none=True)


def rank_candidate(payload):
    context = build_candidate_context(payload)
    prompt = build_candidate_ranking_prompt(context)
    logger.info(
        "[Candidate Ranker] Ranking candidate=%s job=%s promptLength=%s",
        payload.candidate.name,
        payload.job.roleName,
        len(prompt),
    )
    raw_output = generate_with_gemini(
        prompt,
        temperature=0.1,
        max_output_tokens=4096,
        response_mime_type="application/json",
        raise_on_error=True,
        log_prefix="[Gemini Ranking]",
    )
    try:
        parsed = parse_and_validate_ranking(raw_output)
        logger.info("[Gemini Ranking] Parsed JSON successfully score=%s", parsed.get("score"))
    except (json.JSONDecodeError, ValidationError, ValueError, TypeError) as error:
        logger.warning("[Gemini Ranking] JSON parsing/validation failed: %s", error)
        retry_prompt = build_candidate_ranking_retry_prompt(context, raw_output, str(error))
        retry_output = generate_with_gemini(
            retry_prompt,
            temperature=0,
            max_output_tokens=4096,
            response_mime_type="application/json",
            raise_on_error=True,
            log_prefix="[Gemini Ranking Retry]",
        )
        parsed = parse_and_validate_ranking(retry_output)
        logger.info("[Gemini Ranking Retry] Parsed JSON successfully score=%s", parsed.get("score"))

    parsed["companyContext"] = context["companyContext"]
    parsed["rawModelOutput"] = {
        "modelOutput": raw_output[:2000],
        "retrievalQuery": context["retrievalQuery"],
    }
    return parsed
