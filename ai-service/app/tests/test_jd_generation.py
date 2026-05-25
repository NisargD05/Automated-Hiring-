from app.services.jd_generation_service import build_fallback_job_description
from app.schemas.jd_schema import JobDetails


def test_fallback_jd_generation():
    jd = build_fallback_job_description(JobDetails(roleName="Designer"), "Company context")
    assert "Designer" in jd
