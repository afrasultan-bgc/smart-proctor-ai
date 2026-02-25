from pydantic import BaseModel
from datetime import datetime

# Frontend'den gelecek ve backend'den çıkacak ORTAK veriler
class ExamBase(BaseModel):
    title: str
    duration: int
    start_time: datetime

# Eğitmen yeni sınav oluştururken Frontend'in göndereceği veri
class ExamCreate(ExamBase):
    pass

# Veritabanından çekip Frontend'e (Zeynep'e) göndereceğimiz veri formati
class ExamResponse(ExamBase):
    id: int
    instructor_id: int
    created_at: datetime

    class Config:
        from_attributes = True  # SQLAlchemy modelini JSON'a çevirmesi için gerekli sihir