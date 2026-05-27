from fastapi import APIRouter, HTTPException
from app.orchestrators.interview_packet_orchestrator import generate_interview_question_packet
from app.schemas.interview_schema import InterviewGenerationRequest, InterviewGenerationResponse
from app.utils.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/interview-agent", tags=["Interview Question Agent"])


@router.post("/generate", response_model=InterviewGenerationResponse)
def generate_packet(payload: InterviewGenerationRequest):
    try:
        return generate_interview_question_packet(payload)
    except Exception as error:
        logger.exception("Interview question packet generation failed")
        raise HTTPException(status_code=502, detail=str(error))
