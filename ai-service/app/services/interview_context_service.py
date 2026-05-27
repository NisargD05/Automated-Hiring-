from app.retrievers.candidate_retriever import build_candidate_context
from app.retrievers.jd_retriever import build_jd_context
from app.retrievers.kb_retriever import retrieve_kb_context
from app.retrievers.ranking_retriever import build_ranking_context
from app.schemas.interview_schema import InterviewGenerationRequest, InterviewGenerationState
from app.utils.logger import get_logger


logger = get_logger(__name__)


def build_interview_generation_state(payload: InterviewGenerationRequest) -> InterviewGenerationState:
    candidate_context = build_candidate_context(payload)
    jd_context = build_jd_context(payload)
    ranking_context = build_ranking_context(payload)
    kb_chunks = retrieve_kb_context(jd_context, ranking_context, limit=5)

    logger.info(
        "[InterviewQuestionAgent] context built candidate=%s job=%s kbChunks=%s",
        payload.candidate.name,
        payload.job.roleName,
        len(kb_chunks),
    )

    return InterviewGenerationState(
        candidate=candidate_context["candidate"],
        resume=candidate_context["resume"],
        ranking=ranking_context["ranking"],
        job=jd_context["job"],
        interview=jd_context["interview"],
        kbChunks=kb_chunks,
        focusAreas=ranking_context["focusAreas"],
        generatedQuestions={},
    )
