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
