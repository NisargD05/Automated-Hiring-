from typing import Optional
from pydantic import BaseModel


class KnowledgeDocument(BaseModel):
    sourceFileName: str
    status: Optional[str] = "uploaded"
