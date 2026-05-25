import json
import math
import os
from app.core.config import settings
from app.db.chroma_db import get_chroma_collection
from app.utils.logger import get_logger


logger = get_logger(__name__)


def _fallback_store_path():
    return os.path.join(settings.chroma_persist_directory, "fallback_vector_store.json")


def _load_fallback_items():
    path = _fallback_store_path()
    if not os.path.exists(path):
        return []

    try:
        with open(path, "r", encoding="utf-8-sig") as handle:
            return json.load(handle)
    except Exception as error:
        logger.warning("Failed to read fallback vector store: %s", error)
        return []


def _write_fallback_items(items):
    os.makedirs(settings.chroma_persist_directory, exist_ok=True)
    with open(_fallback_store_path(), "w", encoding="utf-8") as handle:
        json.dump(items, handle, ensure_ascii=True, indent=2)


def _cosine_similarity(left, right):
    if not left or not right:
        return 0.0

    size = min(len(left), len(right))
    dot = sum(float(left[index]) * float(right[index]) for index in range(size))
    left_norm = math.sqrt(sum(float(value) * float(value) for value in left[:size]))
    right_norm = math.sqrt(sum(float(value) * float(value) for value in right[:size]))
    if not left_norm or not right_norm:
        return 0.0

    return dot / (left_norm * right_norm)


def upsert_chunks(ids, documents, embeddings, metadatas):
    try:
        collection = get_chroma_collection()
        logger.info("Writing %s chunks to ChromaDB", len(ids))
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return {"inserted": len(ids), "collectionName": collection.name, "fallback": False}
    except Exception as error:
        logger.warning("ChromaDB insertion failed, writing fallback vector store: %s", error)
        existing = {item.get("id"): item for item in _load_fallback_items()}
        for index, chunk_id in enumerate(ids):
            existing[chunk_id] = {
                "id": chunk_id,
                "document": documents[index],
                "embedding": embeddings[index],
                "metadata": metadatas[index],
            }
        _write_fallback_items(list(existing.values()))
        return {
            "inserted": len(ids),
            "collectionName": settings.chroma_collection_name,
            "fallback": True,
        }


def search_chunks(query: str, query_embedding, limit: int = 6):
    try:
        collection = get_chroma_collection()
        return collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as error:
        logger.warning("ChromaDB search failed, using fallback vector store: %s", error)
        scored = []
        seen_documents = set()
        for item in _load_fallback_items():
            document = item.get("document", "")
            if document in seen_documents:
                continue
            seen_documents.add(document)
            similarity = _cosine_similarity(query_embedding, item.get("embedding", []))
            scored.append((similarity, item))

        scored.sort(key=lambda entry: entry[0], reverse=True)
        top = scored[:limit]

        return {
            "documents": [[item.get("document", "") for _, item in top]],
            "metadatas": [[item.get("metadata", {}) for _, item in top]],
            "distances": [[1 - score for score, _ in top]],
        }
