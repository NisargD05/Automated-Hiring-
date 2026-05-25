def review_job_description(job_description: str) -> str:
    required_sections = [
        "Role Summary",
        "Responsibilities",
        "Required Qualifications",
        "Preferred Qualifications",
        "Job Details",
        "Mandatory Requirements",
    ]

    missing_sections = [
        section for section in required_sections if section.lower() not in job_description.lower()
    ]

    if not missing_sections:
        return job_description

    missing_text = "\n".join(f"## {section}\n- To be refined by recruiter." for section in missing_sections)
    return f"{job_description.rstrip()}\n\n{missing_text}\n"
