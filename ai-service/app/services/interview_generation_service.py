from app.agents.interview_question_agent import generate_interview_intelligence
from app.schemas.interview_schema import InterviewGenerationState


def generate_interview_packet(state: InterviewGenerationState):
    packet = generate_interview_intelligence(state)
    state.generatedQuestions = packet
    state.focusAreas = packet.get("focusAreas") or state.focusAreas
    return packet, state
