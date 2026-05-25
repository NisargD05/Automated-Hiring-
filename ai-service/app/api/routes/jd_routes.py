from fastapi import APIRouter, HTTPException
from app.agents.orchestrator import generate_job_description_workflow
from app.schemas.jd_schema import GenerateJDRequest, GenerateJDResponse
from app.utils.logger import get_logger


router = APIRouter(tags=["Job Description"])
logger = get_logger(__name__)


@router.post("/generate-jd", response_model=GenerateJDResponse)
def generate_jd(payload: GenerateJDRequest):
    try:
        logger.info(
            "JD generation request received: roleName=%s knowledgeContextCount=%s",
            payload.jobDetails.roleName,
            len(payload.knowledgeContext),
        )
        return generate_job_description_workflow(payload)
    except Exception as error:
        logger.exception("JD generation failed")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": str(error),
                "roleName": payload.jobDetails.roleName,
            },
        )


@router.post("/api/jd/generate", response_model=GenerateJDResponse)
def generate_jd_api(payload: GenerateJDRequest):
    return generate_jd(payload)
