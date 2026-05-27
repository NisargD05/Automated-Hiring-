from app.schemas.interview_schema import InterviewGenerationRequest


def build_candidate_context(payload: InterviewGenerationRequest):
    resume_sections = payload.resume.parsedSections or {}
    resume_text = (payload.resume.resumeText or "").strip()

    return {
        "candidate": payload.candidate.model_dump(by_alias=True),
        "resume": {
            "resumeText": resume_text[:1600],
            "skills": resume_sections.get("skills", []),
            "experience": resume_sections.get("experience", []),
            "projects": resume_sections.get("projects", []),
            "education": resume_sections.get("education", ""),
            "certifications": resume_sections.get("certifications", []),
        },
    }
