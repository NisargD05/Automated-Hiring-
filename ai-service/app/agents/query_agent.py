from app.rag.query_builder import build_retrieval_query
from app.schemas.jd_schema import GenerateJDRequest


def prepare_query(payload: GenerateJDRequest) -> str:
    return build_retrieval_query(payload.jobDetails)
