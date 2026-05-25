from app.db.vector_store import search_chunks
from app.rag.embedding_service import embed_text
from app.schemas.retrieval_schema import RetrievalRequest, RetrievalResponse, RetrievalResult
from app.utils.logger import get_logger


logger = get_logger(__name__)


def retrieve_chunks(payload: RetrievalRequest) -> RetrievalResponse:
    query = (payload.query or "").strip()
    if not query:
        return RetrievalResponse(query="", results=[])

    logger.info("[Retriever] Query built: %s", query[:500])
    try:
        embedding = embed_text(query)
        raw = search_chunks(query, embedding, limit=payload.limit or 6)
    except Exception as error:
        logger.exception("[Retriever] Retrieval failed for query '%s'", query[:120])
        raise RuntimeError(f"Knowledge retrieval failed: {error}") from error

    documents = raw.get("documents", [[]])[0] if raw else []
    metadatas = raw.get("metadatas", [[]])[0] if raw else []
    distances = raw.get("distances", [[]])[0] if raw else []

    results = []
    for index, document in enumerate(documents):
        metadata = metadatas[index] if index < len(metadatas) else {}
        distance = distances[index] if index < len(distances) else 1
        results.append(
            RetrievalResult(
                sourceFileName=metadata.get("sourceFileName", "Knowledge base"),
                chunkText=document or "",
                score=max(0, 1 - float(distance)),
            )
        )

    logger.info("[Retriever] Retrieved chunks: %s", len(results))
    for index, result in enumerate(results[:3], start=1):
        logger.info("[Retriever] Chunk %s preview: %s", index, result.chunkText[:220])

    return RetrievalResponse(query=query, results=results)
