def build_retrieval_query(job_details) -> str:
    return " ".join(
        value
        for value in [
            job_details.roleName,
            job_details.department,
            job_details.skills,
            job_details.seniorityLevel,
            job_details.mandatoryRequirements,
        ]
        if value
    )


def build_candidate_kb_query(job) -> str:
    values = [
        getattr(job, "roleName", ""),
        getattr(job, "requiredSkills", ""),
        getattr(job, "mandatoryRequirements", ""),
        getattr(job, "seniorityLevel", ""),
        getattr(job, "experienceRequired", ""),
    ]
    return " ".join(value for value in values if value).strip()
