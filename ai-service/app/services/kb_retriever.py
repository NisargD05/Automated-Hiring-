from app.rag.query_builder import build_candidate_kb_query
from app.rag.retriever import retrieve_chunks
from app.schemas.retrieval_schema import RetrievalRequest


def retrieve_company_context(job, limit=5):
    query = build_candidate_kb_query(job)
    return retrieve_chunks(RetrievalRequest(query=query, limit=limit)).results
