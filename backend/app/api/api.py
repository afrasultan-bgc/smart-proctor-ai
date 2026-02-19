from fastapi import APIRouter
from app.api.endpoints import general

api_router = APIRouter()

# General (Genel) rotaları sisteme dahil et
api_router.include_router(general.router, prefix="/general", tags=["General"])