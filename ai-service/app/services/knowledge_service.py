from app.document_processing.ingestion_pipeline import ingest_text


def ingest_knowledge_text(text: str, source_file_name: str):
    return ingest_text(text, source_file_name)
