from app.schemas.retrieval_schema import RetrievalRequest, RetrievalResponse


def retrieve_chunks(payload: RetrievalRequest) -> RetrievalResponse:
    # Direct vector retrieval will be wired here when the AI service owns ingestion.
    return RetrievalResponse(query=payload.query, results=[])
