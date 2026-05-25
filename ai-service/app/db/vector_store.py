from app.db.chroma_db import get_chroma_collection
from app.utils.logger import get_logger


logger = get_logger(__name__)


def upsert_chunks(ids, documents, embeddings, metadatas):
    collection = get_chroma_collection()
    logger.info("Writing %s chunks to ChromaDB", len(ids))
    try:
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return {"inserted": len(ids), "collectionName": collection.name, "fallback": False}
    except Exception as error:
        logger.exception("Failed to insert embeddings into ChromaDB: %s", error)
        raise RuntimeError("ChromaDB insertion failed") from error


def search_chunks(query: str, query_embedding, limit: int = 6):
    collection = get_chroma_collection()
    return collection.query(
        query_embeddings=[query_embedding],
        n_results=limit,
        include=["documents", "metadatas", "distances"],
    )
