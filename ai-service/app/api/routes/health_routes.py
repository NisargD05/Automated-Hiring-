from fastapi import APIRouter
from app.db.chroma_db import get_chroma_collection


router = APIRouter(tags=["Health"])


@router.get("/")
def root_health_check():
    return {"message": "AI Hiring JD Service is running"}


@router.get("/health")
def health_check():
    try:
        get_chroma_collection()
        return {"status": "ok", "chroma": "connected", "vector_store": "chromadb"}
    except Exception as error:
        return {"status": "error", "chroma": f"unavailable: {error}", "vector_store": "none"}
