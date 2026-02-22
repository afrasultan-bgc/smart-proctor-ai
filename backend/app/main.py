from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router # 

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Yapay Zeka Destekli Online Sınav Gözetim Sistemi API", # [cite: 3]
    version="1.0.0"
)

# CORS Ayarları: Frontend ile güvenli el sıkışma 
# settings.BACKEND_CORS_ORIGINS listesini config.py içinde tanımladıysan onu da kullanabilirsin.
origins = [
    "http://localhost:5173",  # Vite React Varsayılan 
    "http://127.0.0.1:5173", # Bazı tarayıcılar IP bazlı erişim isteyebilir
    "http://localhost:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Tüm metodlara izin (GET, POST, PUT, DELETE) 
    allow_headers=["*"], # Tüm başlıklara izin (Authorization, Content-Type) 
)

# API Rotaları (V1 sürümü altında toplanır) 
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health Check"]) # Tags eklemek Swagger dökümanını gruplandırır
def root():
    """Sistemin ayakta olup olmadığını kontrol eden ana dizin."""
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "message": "Smart Proctor AI Backend Çalışıyor 🚀"
    }