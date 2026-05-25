def parse_document_text(text: str):
    return {
        "text": text,
        "length": len(text or ""),
    }
