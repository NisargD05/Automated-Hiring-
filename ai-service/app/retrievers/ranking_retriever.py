from app.schemas.interview_schema import InterviewGenerationRequest


def build_ranking_context(payload: InterviewGenerationRequest):
    ranking = payload.ranking.model_dump()
    focus_areas = []
    for value in ranking.get("weaknesses", []) + ranking.get("missingWithJD", []) + ranking.get("missingLinks", []):
        if value and value not in focus_areas:
            focus_areas.append(value)

    return {
        "ranking": ranking,
        "focusAreas": focus_areas[:6],
    }
