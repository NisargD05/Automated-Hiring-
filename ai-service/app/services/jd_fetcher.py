def summarize_job_for_candidate_ranking(job):
    return {
        "roleName": job.roleName,
        "requiredSkills": job.requiredSkills,
        "mandatoryRequirements": job.mandatoryRequirements,
        "seniorityLevel": job.seniorityLevel,
        "experienceRequired": job.experienceRequired,
        "fullJDText": job.fullJDText,
    }
