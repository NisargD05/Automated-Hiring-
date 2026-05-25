from fastapi import APIRouter, HTTPException
from app.schemas.ranking_schema import CandidateRankingRequest, CandidateRankingResponse
from app.services.ranking_service import rank_candidate_against_job
from app.utils.logger import get_logger


router = APIRouter(prefix="/ranking", tags=["Candidate Ranking"])
logger = get_logger(__name__)


@router.post("/candidate", response_model=CandidateRankingResponse)
def rank_candidate(payload: CandidateRankingRequest):
    try:
        return rank_candidate_against_job(payload)
    except Exception as error:
        logger.exception("Candidate ranking failed")
        raise HTTPException(status_code=500, detail=str(error))
