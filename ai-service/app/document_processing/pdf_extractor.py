from pypdf import PdfReader
from app.utils.logger import get_logger


logger = get_logger(__name__)


def _extract_with_pdfplumber(file_path: str) -> str:
    import pdfplumber

    text_parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts)


def _extract_with_pypdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_pdf_text(file_path: str) -> str:
    logger.info("Starting PDF extraction for %s", file_path)

    try:
        text = _extract_with_pdfplumber(file_path)
        if text.strip():
            logger.info("PDF extraction completed with pdfplumber")
            return text
    except Exception as error:
        logger.warning("pdfplumber extraction failed: %s", error)

    try:
        text = _extract_with_pypdf(file_path)
        if text.strip():
            logger.info("PDF extraction completed with pypdf")
            return text
    except Exception as error:
        logger.error("pypdf extraction failed: %s", error)
        raise

    raise ValueError("No extractable text found in PDF")
