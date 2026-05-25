def build_fallback_job_description(job, context: str) -> str:
    role_line = f"{job.seniorityLevel} {job.roleName}".strip()

    responsibilities = [
        f"Own high-quality delivery for the {job.roleName} role.",
        "Collaborate with hiring, product, and technical stakeholders.",
        "Use company knowledge and hiring guidelines to make consistent decisions.",
    ]

    if job.skills:
        responsibilities.append(f"Apply practical expertise with {job.skills}.")

    required = []
    if job.experienceRequired:
        required.append(f"{job.experienceRequired} of relevant experience.")
    if job.education:
        required.append(job.education)
    if job.skills:
        required.append(f"Strong working knowledge of {job.skills}.")
    if job.mandatoryRequirements:
        required.append(job.mandatoryRequirements)
    if not required:
        required.append("Relevant experience in a comparable role.")

    return f"""# {role_line}

## Role Summary
We are hiring for the {job.roleName} role{f" in the {job.department} department" if job.department else ""}. This JD is grounded in the recruiter's inputs and the available company Knowledge Base context.

## Responsibilities
{chr(10).join(f"- {item}" for item in responsibilities)}

## Required Qualifications
{chr(10).join(f"- {item}" for item in required)}

## Preferred Qualifications
- Experience in structured hiring or operationally mature teams.
- Clear communication with cross-functional stakeholders.
- Ability to adapt company guidance into practical execution.

## Job Details
- Job type: {job.jobType or "To be confirmed"}
- Location: {job.location or "To be confirmed"}
- Experience expectations: {job.experienceRequired or "To be confirmed"}
- Salary range: {job.salaryRange or "To be confirmed"}
- Number of openings: {job.numberOfOpenings or 1}

## Mandatory Requirements
{job.mandatoryRequirements or "No mandatory requirements were provided beyond the qualifications above."}

## Company-Specific Context Used
{context}
"""
