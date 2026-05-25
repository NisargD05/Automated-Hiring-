from app.rag.query_builder import build_retrieval_query
from app.schemas.jd_schema import JobDetails


def test_build_retrieval_query():
    query = build_retrieval_query(JobDetails(roleName="Engineer", skills="Python"))
    assert "Engineer" in query
    assert "Python" in query
