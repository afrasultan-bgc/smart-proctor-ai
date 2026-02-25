from fastapi import APIRouter

router = APIRouter()

@router.get("/health-check")
def health_check():
    """
    Sistemin ayakta olup olmadığını kontrol eder.
    """
    return {"status": "active", "system": "Smart Proctor AI", "version": "1.0.0"}