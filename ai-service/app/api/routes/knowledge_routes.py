import os
import shutil
import tempfile
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from app.document_processing.ingestion_pipeline import ingest_pdf
from app.document_processing.pdf_extractor import extract_pdf_text
from app.utils.logger import get_logger


router = APIRouter(prefix="/knowledge", tags=["Knowledge"])
logger = get_logger(__name__)


@router.get("/status")
def knowledge_status():
    return {
        "status": "ready",
        "message": "Knowledge ingestion hooks are available for future direct AI-service uploads.",
    }


@router.post("/index-pdf")
async def index_pdf(
    file: UploadFile = File(...),
    documentId: str = Form(...),
    sourceFileName: str = Form(...),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    temp_path = ""
    try:
        logger.info(
            "AI service received PDF indexing request: documentId=%s sourceFileName=%s contentType=%s",
            documentId,
            sourceFileName,
            file.content_type,
        )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        result = ingest_pdf(temp_path, documentId, sourceFileName)
        return {
            "success": True,
            "message": "PDF indexed successfully",
            **result,
        }
    except Exception as error:
        logger.exception("PDF indexing failed for document %s", documentId)
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": str(error),
                "documentId": documentId,
            },
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/test-pdf")
async def test_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        text = extract_pdf_text(temp_path)
        return {
            "success": True,
            "characterCount": len(text),
            "preview": text[:500],
        }
    except Exception as error:
        logger.exception("PDF extraction test failed")
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
