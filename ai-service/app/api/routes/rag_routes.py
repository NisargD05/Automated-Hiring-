from fastapi import APIRouter
from app.schemas.retrieval_schema import RetrievalRequest, RetrievalResponse
from app.services.retrieval_service import retrieve_context


router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post("/retrieve", response_model=RetrievalResponse)
def retrieve(payload: RetrievalRequest):
    return retrieve_context(payload)
