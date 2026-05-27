from app.schemas.interview_schema import InterviewGenerationRequest


def build_jd_context(payload: InterviewGenerationRequest):
    job = payload.job
    return {
        "job": {
            "_id": job.id,
            "roleName": job.roleName,
            "department": job.department or "",
            "skills": job.skills or "",
            "mandatoryRequirements": job.mandatoryRequirements or "",
            "seniorityLevel": job.seniorityLevel or "",
            "experienceRequired": job.experienceRequired or "",
            "approvedJD": (job.approvedJD or "")[:2200],
        },
        "interview": payload.interview or {},
    }
