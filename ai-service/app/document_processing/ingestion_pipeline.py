from app.document_processing.cleaner import clean_text
from app.document_processing.pdf_extractor import extract_pdf_text
from app.rag.chunker import chunk_text
from app.rag.embedding_service import embed_texts
from app.db.vector_store import upsert_chunks
from app.core.config import settings
from app.utils.logger import get_logger


logger = get_logger(__name__)


def ingest_text(text: str, source_file_name: str):
    cleaned = clean_text(text)
    chunks = chunk_text(cleaned)
    return [
        {
            "sourceFileName": source_file_name,
            "chunkIndex": index,
            "chunkText": chunk,
        }
        for index, chunk in enumerate(chunks)
    ]


def ingest_pdf(file_path: str, document_id: str, source_file_name: str):
    logger.info("Ingestion started", {
        "documentId": document_id,
        "sourceFileName": source_file_name,
    })

    extracted_text = extract_pdf_text(file_path)
    cleaned = clean_text(extracted_text)
    if not cleaned:
        raise ValueError("PDF extraction produced empty text")

    chunks = chunk_text(cleaned)
    logger.info("Chunk generation completed", {
        "documentId": document_id,
        "chunkCount": len(chunks),
    })

    if not chunks:
        raise ValueError("No chunks generated from PDF")

    embeddings = embed_texts(chunks)
    if len(embeddings) != len(chunks):
        raise ValueError("Embedding count does not match chunk count")

    ids = [f"{document_id}:{index}" for index in range(len(chunks))]
    metadatas = [
        {
            "documentId": document_id,
            "sourceFileName": source_file_name,
            "chunkIndex": index,
        }
        for index in range(len(chunks))
    ]

    result = upsert_chunks(ids, chunks, embeddings, metadatas)
    logger.info("ChromaDB insertion completed", {
        "documentId": document_id,
        "chunkCount": len(chunks),
        "collectionName": result["collectionName"],
    })

    return {
        "documentId": document_id,
        "sourceFileName": source_file_name,
        "chunkCount": len(chunks),
        "collectionName": result.get("collectionName", settings.chroma_collection_name),
        "vectorStoreFallback": result.get("fallback", False),
        "chunks": [
            {
                "id": ids[index],
                "text": chunk,
                "chunkIndex": index,
                "metadata": metadatas[index],
            }
            for index, chunk in enumerate(chunks)
        ],
    }
