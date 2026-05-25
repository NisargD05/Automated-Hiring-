from fastapi import FastAPI
from app.api.routes import health_routes, jd_routes, knowledge_routes, rag_routes
from app.core.config import settings
from app.routes import candidate_routes, ranking_routes


app = FastAPI(title=settings.app_name)

app.include_router(health_routes.router)
app.include_router(jd_routes.router)
app.include_router(knowledge_routes.router)
app.include_router(rag_routes.router)
app.include_router(candidate_routes.router)
app.include_router(ranking_routes.router)
