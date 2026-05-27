from app.rag.retriever import retrieve_chunks
from app.schemas.retrieval_schema import RetrievalRequest


def build_interview_kb_query(job_context, ranking_context):
    job = job_context.get("job", {})
    ranking = ranking_context.get("ranking", {})
    weak_areas = ", ".join(ranking.get("weaknesses", []) + ranking.get("missingWithJD", []))
    return (
        f"Interview standards and evaluation guidance for {job.get('roleName', '')}. "
        f"Required skills: {job.get('skills', '')}. "
        f"Mandatory requirements: {job.get('mandatoryRequirements', '')}. "
        f"Candidate weak areas: {weak_areas}."
    ).strip()


def retrieve_kb_context(job_context, ranking_context, limit=5):
    query = build_interview_kb_query(job_context, ranking_context)
    results = retrieve_chunks(RetrievalRequest(query=query, limit=limit)).results
    return [
        {
            "sourceFileName": result.sourceFileName,
            "chunkText": (result.chunkText or "")[:350],
            "score": result.score,
        }
        for result in results
    ]
