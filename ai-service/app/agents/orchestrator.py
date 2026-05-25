from app.agents.context_agent import prepare_context
from app.agents.jd_writer_agent import write_job_description
from app.agents.query_agent import prepare_query
from app.agents.retrieval_agent import retrieve_supporting_context
from app.agents.review_agent import review_job_description
from app.schemas.jd_schema import GenerateJDRequest, GenerateJDResponse


def generate_job_description_workflow(payload: GenerateJDRequest) -> GenerateJDResponse:
    query = prepare_query(payload)
    context_items = retrieve_supporting_context(payload)
    context_text = prepare_context(context_items)
    draft = write_job_description(payload.jobDetails, context_text)
    reviewed_draft = review_job_description(draft)

    return GenerateJDResponse(
        jobDescription=reviewed_draft,
        agentSteps=[
            "Query agent converted job inputs into a retrieval query",
            f"Retrieval query: {query}",
            "Retrieval agent received Knowledge Base chunks from the backend RAG layer",
            "Context agent assembled company context for the prompt",
            "JD writer agent called the configured LLM provider or local fallback",
            "Review agent checked required JD sections before returning the draft",
        ],
    )
