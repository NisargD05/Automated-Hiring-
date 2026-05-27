import json
from app.schemas.interview_schema import InterviewGenerationState


SYSTEM_PROMPT = """You are InterviewQuestionAgent, a senior technical interviewer copilot.
Generate contextual interview question packets using resume evidence, ranking gaps, approved JD expectations, and company hiring knowledge.
Do not generate generic trivia. Every question must be tied to the candidate, role, gap, project, or hiring standard.
Return strict valid JSON only. No markdown, prose, comments, or code fences."""


def build_interview_question_prompt(state: InterviewGenerationState) -> str:
    payload = {
        "candidate": state.candidate,
        "resume": state.resume,
        "ranking": state.ranking,
        "job": state.job,
        "interview": state.interview,
        "companyHiringContext": state.kbChunks,
        "initialFocusAreas": state.focusAreas,
        "requiredOutputSchema": {
            "focusAreas": ["5 concise focus areas"],
            "technicalQuestions": [{"question": "string", "whyAsk": "string", "strongSignal": "string"}],
            "followUpQuestions": [{"question": "string", "whyAsk": "string", "strongSignal": "string"}],
            "weaknessProbes": [{"question": "string", "whyAsk": "string", "strongSignal": "string"}],
            "behavioralQuestions": [{"question": "string", "whyAsk": "string", "strongSignal": "string"}],
            "systemDesignQuestions": [{"question": "string", "whyAsk": "string", "strongSignal": "string"}],
            "evaluationChecklist": ["8 concrete checklist items"],
            "interviewerNotes": ["5 short practical notes"],
        },
        "constraints": [
            "Use 4 technical questions.",
            "Use 3 follow-up questions.",
            "Use 3 weakness probes.",
            "Use 3 behavioral questions.",
            "Use 2 system design questions.",
            "Keep each question under 180 characters.",
            "Mention specific weak areas where useful.",
        ],
    }
    return f"{SYSTEM_PROMPT}\n\nGenerate the interview packet:\n{json.dumps(payload, ensure_ascii=True, separators=(',', ':'))}"


def build_interview_question_retry_prompt(state: InterviewGenerationState, raw_output: str, validation_error: str) -> str:
    return (
        build_interview_question_prompt(state)
        + "\n\nThe previous response was invalid or incomplete. "
        + "Return a complete strict JSON object only. "
        + f"Validation error: {validation_error}. "
        + f"Invalid output preview: {(raw_output or '')[:900]}"
    )
