from fastapi import APIRouter
from app.db.vector_store import _load_fallback_items
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
        fallback_count = len(_load_fallback_items())
        if fallback_count:
            return {
                "status": "ok",
                "chroma": f"fallback: {error}",
                "vector_store": "fallback_json",
                "fallbackCount": fallback_count,
            }
        return {"status": "error", "chroma": f"unavailable: {error}", "vector_store": "none"}
