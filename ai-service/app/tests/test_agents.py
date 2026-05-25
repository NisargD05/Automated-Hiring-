from app.agents.context_agent import prepare_context
from app.schemas.jd_schema import KnowledgeContextItem


def test_prepare_context():
    context = prepare_context([KnowledgeContextItem(sourceFileName="guide.pdf", chunkText="Hiring guide")])
    assert "guide.pdf" in context
