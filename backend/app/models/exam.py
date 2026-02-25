from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base # Kendi veritabanı Base yoluna göre ayarlarsın

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)       # Sınavın Adı
    duration = Column(Integer, nullable=False)               # Süre (Dakika cinsinden)
    start_time = Column(DateTime, nullable=False)            # Başlangıç Zamanı
    created_at = Column(DateTime, default=datetime.utcnow)   # Ne zaman oluşturuldu

    # Bu sınavı HANGİ EĞİTMEN oluşturdu? (User tablosuna bağlıyoruz)
    instructor_id = Column(Integer, ForeignKey("users.id"))

    # İlişkiyi tanımlıyoruz (SQLAlchemy'nin gücü)
    instructor = relationship("User", back_populates="exams")