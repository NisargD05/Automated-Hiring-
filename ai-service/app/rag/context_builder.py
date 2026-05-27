from app.rag.query_builder import build_candidate_kb_query
from app.rag.retriever import retrieve_chunks
from app.schemas.retrieval_schema import RetrievalRequest
from app.utils.logger import get_logger


logger = get_logger(__name__)


def build_context(context_items):
    return "\n\n".join(
        item.get("chunkText", item.get("text", str(item))) if isinstance(item, dict) else str(item)
        for item in (context_items or [])
        if item
    )


def build_candidate_context(payload):
    resume_sections = payload.resume.parsedSections or {}
    query = build_candidate_kb_query(payload.job)
    retrieved = retrieve_chunks(RetrievalRequest(query=query, limit=5))
    kb_chunks = [result.model_dump() for result in retrieved.results[:5]]

    resume_text = (payload.resume.resumeText or "").strip()
    jd_text = (payload.job.fullJDText or "").strip()
    required_skills = (payload.job.requiredSkills or "").strip()

    logger.info("[Ranking] Resume text extracted length=%s", len(resume_text))
    logger.info("[Context Builder] Resume Skills: %s", resume_sections.get("skills", [])[:12])
    logger.info("[Context Builder] JD Role: %s", payload.job.roleName)
    logger.info("[Context Builder] JD Skills: %s", required_skills)
    logger.info("[Ranking] KB chunks retrieved count=%s", len(kb_chunks))

    if not resume_text:
        raise ValueError("Candidate resume text is empty; cannot rank without resume evidence")
    if not payload.job.roleName:
        raise ValueError("Job role name is empty; cannot rank without an approved JD")
    if not jd_text and not required_skills and not payload.job.mandatoryRequirements:
        raise ValueError("Approved JD payload is empty; cannot rank without JD requirements")
    if not kb_chunks:
        raise ValueError("Company knowledge retrieval returned no chunks; cannot run tri-source RAG ranking")

    return {
        "resumeSummary": {
            "skills": resume_sections.get("skills", []),
            "experience": resume_sections.get("experience", []),
            "projects": resume_sections.get("projects", []),
            "education": resume_sections.get("education", ""),
            "certifications": resume_sections.get("certifications", []),
            "resumeText": resume_text[:800],
        },
        "jdSummary": {
            "roleName": payload.job.roleName,
            "requiredSkills": payload.job.requiredSkills,
            "mandatoryRequirements": payload.job.mandatoryRequirements,
            "seniorityLevel": payload.job.seniorityLevel,
            "experienceRequired": payload.job.experienceRequired,
            "fullJDText": jd_text[:1000],
        },
        "companyContext": [
            {
                **chunk,
                "chunkText": (chunk.get("chunkText") or "")[:250],
            }
            for chunk in kb_chunks
        ],
        "retrievalQuery": query,
    }
