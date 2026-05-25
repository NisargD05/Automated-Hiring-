import json


SYSTEM_PROMPT = """You are a senior technical recruiter and enterprise hiring evaluator.
Compare the candidate resume against the approved job description and company hiring standards.
Scoring weights: JD skill match 40%, experience match 25%, project relevance 15%, company KB alignment 10%, mandatory requirement fit 10%.
Reward strong relevant evidence and penalize missing mandatory requirements.
Return strict valid JSON only. Do not include markdown, prose, comments, or code fences.
Use at most 3 strings in each array. Keep each string under 80 characters.
Keep rankingReason under 160 characters.
Every array must contain specific evidence-based strings. If a candidate lacks evidence, put that gap in missingWithJD or missingLinks.
Do not return generic fallback language."""


def build_candidate_ranking_prompt(context):
    resume = context["resumeSummary"]
    jd = context["jdSummary"]
    kb_chunks = context["companyContext"]

    user_payload = {
        "resumeSkills": resume.get("skills", []),
        "resumeExperience": resume.get("experience", []),
        "resumeProjects": resume.get("projects", []),
        "resumeEducation": resume.get("education", ""),
        "resumeCertifications": resume.get("certifications", []),
        "resumeEvidenceText": resume.get("resumeText", ""),
        "jobRole": jd.get("roleName", ""),
        "requiredSkills": jd.get("requiredSkills", ""),
        "mandatoryRequirements": jd.get("mandatoryRequirements", ""),
        "experienceRequired": jd.get("experienceRequired", ""),
        "approvedJobDescription": jd.get("fullJDText", ""),
        "companyHiringStandards": [chunk.get("chunkText", "") for chunk in kb_chunks],
        "requiredOutputSchema": {
            "score": "integer 0-100",
            "matchesWithJD": ["max 3 short evidence strings"],
            "missingWithJD": ["max 3 short gap strings"],
            "missingLinks": ["max 3 short uncertainty strings"],
            "strengths": ["max 3 short strings"],
            "weaknesses": ["max 3 short strings"],
            "recommendation": "Shortlist | Review | Reject",
            "rankingReason": "string",
        },
    }

    return f"{SYSTEM_PROMPT}\n\nEvaluate this candidate:\n{json.dumps(user_payload, ensure_ascii=True, separators=(',', ':'))}"


def build_json_repair_prompt(raw_output: str, validation_error: str):
    repair_payload = {
        "invalidModelOutput": raw_output,
        "validationError": validation_error,
        "requiredOutputSchema": {
            "score": "integer 0-100",
            "matchesWithJD": ["string"],
            "missingWithJD": ["string"],
            "missingLinks": ["string"],
            "strengths": ["string"],
            "weaknesses": ["string"],
            "recommendation": "Shortlist | Review | Reject",
            "rankingReason": "string",
        },
    }
    return (
        "Convert the following model output into strict valid JSON only. "
        "No markdown, no code fences, no surrounding prose.\n"
        f"{json.dumps(repair_payload, ensure_ascii=True)}"
    )


def build_candidate_ranking_retry_prompt(context, raw_output: str, validation_error: str):
    return (
        build_candidate_ranking_prompt(context)
        + "\n\nThe previous response was invalid JSON or failed schema validation. "
        + "Return a complete, minified JSON object only. Do not truncate. "
        + f"Validation error: {validation_error}. "
        + f"Previous invalid output preview: {raw_output[:700]}"
    )
