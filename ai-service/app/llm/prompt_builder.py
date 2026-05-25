def build_jd_prompt(job_details, context_text: str) -> str:
    return f"""
You are an expert hiring strategist and job description writer.

Write a professional, company-aware job description using the recruiter's inputs and
the Knowledge Base context below. Use the context as supporting evidence only.
Do not invent company facts that are not supported by the context.
Avoid generic wording where specific role details are available.

The JD must include:
- Role Summary
- Responsibilities
- Required Qualifications
- Preferred Qualifications
- Job Details
- Mandatory Requirements
- Company-Specific Context Used

Recruiter job inputs:
- Role name: {job_details.roleName}
- Department: {job_details.department or "Not provided"}
- Location: {job_details.location or "Not provided"}
- Experience required: {job_details.experienceRequired or "Not provided"}
- Salary range: {job_details.salaryRange or "Not provided"}
- Skills: {job_details.skills or "Not provided"}
- Education: {job_details.education or "Not provided"}
- Job type: {job_details.jobType or "Not provided"}
- Number of openings: {job_details.numberOfOpenings or 1}
- Seniority level: {job_details.seniorityLevel or "Not provided"}
- Mandatory requirements: {job_details.mandatoryRequirements or "Not provided"}

Knowledge Base context:
{context_text}
""".strip()
