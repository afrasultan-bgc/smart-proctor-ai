from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db # Kendi veritabanı bağlantı fonksiyonun
from app.models.exam import Exam
from app.models.user import User
from app.schemas.exam import ExamCreate, ExamResponse
from app.routers.auth import get_current_instructor, get_current_user # Eğitmen kontrolü
from typing import List
from datetime import datetime

router = APIRouter(prefix="/exams", tags=["Sınav İşlemleri"])

@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_in: ExamCreate, 
    db: Session = Depends(get_db), 
    current_instructor: User = Depends(get_current_instructor) # Sadece eğitmen girebilir!
):
    """
    Sisteme yeni bir sınav ekler. 
    Bu işlemi sadece rolü 'instructor' olan kullanıcılar yapabilir.
    """
    new_exam = Exam(
        title=exam_in.title,
        duration=exam_in.duration,
        start_time=exam_in.start_time,
        instructor_id=current_instructor.id # Sınavı oluşturan hocanın ID'sini Token'dan alıp basıyoruz
    )
    
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    
    return new_exam
@router.get("/", response_model=List[ExamResponse])
def get_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Sisteme giriş yapmış HERKES görebilir
):
    """
    Sistemdeki tüm sınavları listeler.
    Sadece giriş yapmış kullanıcılar (öğrenci veya hoca fark etmez) görebilir.
    """
    exams = db.query(Exam).all() # Veritabanındaki Exam tablosundaki tüm kayıtları getir
    return exams
# --- 3. Aktif (Gelecek) Sınavlar Kapısı ---
@router.get("/active", response_model=List[ExamResponse])
def get_active_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sadece henüz başlamamış veya şu an aktif olan sınavları getirir."""
    now = datetime.now()
    # start_time'ı şu anki zamandan BÜYÜK veya EŞİT olanları filtrele
    active_exams = db.query(Exam).filter(Exam.start_time >= now).all()
    return active_exams

# --- 4. Geçmiş Sınavlar Kapısı ---
@router.get("/past", response_model=List[ExamResponse])
def get_past_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Süresi geçmiş (tamamlanmış) sınavları getirir."""
    now = datetime.now()
    # start_time'ı şu anki zamandan KÜÇÜK olanları filtrele
    past_exams = db.query(Exam).filter(Exam.start_time < now).all()
    return past_exams