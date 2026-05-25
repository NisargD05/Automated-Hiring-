from app.schemas.jd_schema import GenerateJDRequest


def retrieve_supporting_context(payload: GenerateJDRequest):
    # The Node backend currently performs PDF retrieval and sends the selected chunks.
    # This agent keeps the boundary explicit and can later call Chroma directly.
    return payload.knowledgeContext
