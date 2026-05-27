from app.schemas.interview_schema import InterviewGenerationRequest, InterviewGenerationResponse
from app.services.interview_context_service import build_interview_generation_state
from app.services.interview_generation_service import generate_interview_packet


def generate_interview_question_packet(payload: InterviewGenerationRequest) -> InterviewGenerationResponse:
    state = build_interview_generation_state(payload)
    packet, final_state = generate_interview_packet(state)
    return InterviewGenerationResponse(
        success=True,
        packet=packet,
        state=final_state.model_dump(exclude_none=True),
    )
