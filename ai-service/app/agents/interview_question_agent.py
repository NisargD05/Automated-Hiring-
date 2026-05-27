from app.llm.gemini_client import generate_with_gemini
from app.prompts.interview_prompt_builder import (
    build_interview_question_prompt,
    build_interview_question_retry_prompt,
)
from app.parsers.interview_output_parser import parse_interview_packet
from app.schemas.interview_schema import InterviewGenerationState
from app.utils.logger import get_logger


logger = get_logger(__name__)


def generate_interview_intelligence(state: InterviewGenerationState):
    prompt = build_interview_question_prompt(state)
    logger.info(
        "[InterviewQuestionAgent] generation started candidate=%s role=%s promptLength=%s",
        state.candidate.get("name"),
        state.job.get("roleName"),
        len(prompt),
    )
    raw_output = generate_with_gemini(
        prompt,
        temperature=0.2,
        max_output_tokens=4096,
        response_mime_type="application/json",
        raise_on_error=True,
        log_prefix="[InterviewQuestionAgent]",
    )

    try:
        packet = parse_interview_packet(raw_output)
    except Exception as error:
        logger.warning("[InterviewQuestionAgent] parser retry required: %s", error)
        retry_prompt = build_interview_question_retry_prompt(state, raw_output, str(error))
        retry_output = generate_with_gemini(
            retry_prompt,
            temperature=0,
            max_output_tokens=4096,
            response_mime_type="application/json",
            raise_on_error=True,
            log_prefix="[InterviewQuestionAgent Retry]",
        )
        packet = parse_interview_packet(retry_output)

    logger.info(
        "[InterviewQuestionAgent] generation completed focusAreas=%s technicalQuestions=%s",
        len(packet.get("focusAreas", [])),
        len(packet.get("technicalQuestions", [])),
    )
    return packet
