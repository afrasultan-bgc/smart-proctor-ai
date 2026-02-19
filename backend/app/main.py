from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Ayarları: React (Frontend) uygulamamızın Backend ile konuşmasına izin veriyoruz.
origins = [
    "http://localhost:5173",  # Vite React Portu
    "http://localhost:3000",  # Alternatif React Portu
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tüm rotaları ana uygulamaya ekle
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Smart Proctor AI Backend Çalışıyor 🚀"}