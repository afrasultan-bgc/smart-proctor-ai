from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile 
import os
import shutil
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, PasswordChange
from app.core.security import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Kimlik Dogrulama"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik dogrulanamadi veya suresi doldu",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Token'ın mührünü açıyoruz
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = str(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # ID'sini bulduğumuz kişiyi veritabanından getiriyoruz
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullaniliyor.")
    
    hashed_pwd = get_password_hash(user_data.password)

    new_user = User(email=user_data.email, password_hash=hashed_pwd,role=user_data.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.username).first()

    if not user:
        raise HTTPException(status_code=403, detail="Gecersiz kullanici adi veya sifre")
        
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=403, detail="Gecersiz kullanici adi veya sifre")
        
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/vip-oda")
def vip_oda_test(current_user: User = Depends(get_current_user)):
    return {
        "mesaj": f"Sisteme hos geldin, {current_user.email}!",
        "gizli_bilgi": "Bu mesaji sadece giris yapmis olanlar gorebilir.",
        "senin_kullanici_id_numaran": current_user.id

    }
@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Frontend'in "Ben kimim?" sorusuna cevap veren kapı.
    Giriş yapan kullanıcının bilgilerini (şifresi hariç) geri döner.
    """
    return current_user
# app/routers/auth.py dosyasının içine ekliyoruz:

def get_current_instructor(current_user: User = Depends(get_current_user)):
    """
    Kullanıcının rolü 'instructor' (Eğitmen) mu diye bakar.
    Eğitmen değilse 403 (Yasak) hatası fırlatır.
    """
    # Eğer veritabanındaki modelinde rol sütununun adı farklıysa (örneğin 'role_id' ise) burayı ona göre uyarla.
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlemi yapmak için Eğitmen (Instructor) yetkisine sahip olmalısınız."
        )
    return current_user
    def get_current_proctor(current_user: User = Depends(get_current_user)):
     """Giriş yapan kullanıcının Gözetmen (Proctor) olup olmadığını kontrol eder."""
    if current_user.role != "proctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Erişim reddedildi! Bu işlem için Gözetmen (Proctor) yetkisi gereklidir."
        )
    return current_user
  
@router.put("/change-password", tags=["Profil Yönetimi"])
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Sadece giriş yapanlar şifre değiştirebilir
):
    """Kullanıcının mevcut şifresini güvenli bir şekilde günceller."""
    
    # 1. Eski şifre doğru mu diye kontrol et
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Eski şifrenizi yanlış girdiniz!"
        )
        
    # 2. Yeni şifreyi hashle (kriptola)
    hashed_new_password = get_password_hash(password_data.new_password)
    
    # 3. Veritabanındaki şifreyi güncelle ve kaydet
    current_user.password_hash = hashed_new_password
    db.commit()
    
    return {"mesaj": "Şifreniz başarıyla güncellendi! 🔒"} 
# --- Profil Fotoğrafı Yükleme Kapısı ---

# Fotoğrafların kaydedileceği ana klasörün adını belirliyoruz
UPLOAD_DIR = "uploads" 

# Eğer projemizin içinde "uploads" adında bir klasör yoksa, Python bunu bizim için otomatik oluşturacak
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload-avatar", tags=["Profil Yönetimi"])
def upload_profile_picture(
    file: UploadFile = File(...), # Kullanıcıdan bir dosya bekliyoruz
    current_user: User = Depends(get_current_user) # Sadece giriş yapmış kullanıcılar resim yükleyebilir
):
    """Kullanıcının profil fotoğrafını sunucuya yükler ve kaydeder."""
    
    # 1. Gelen dosya gerçekten bir resim mi? (Güvenlik kontrolü)
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Lütfen sadece resim dosyası (JPG, PNG) yükleyin!"
        )

    # 2. Dosyaya isim veriyoruz (Örn: user_5_avatar.png)
    file_extension = file.filename.split(".")[-1] # Yüklenen dosyanın uzantısını bul (png, jpg vs.)
    new_file_name = f"user_{current_user.id}_avatar.{file_extension}"
    
    # 3. Dosyanın tam olarak nereye kaydedileceğini birleştiriyoruz (uploads/user_5_avatar.png)
    file_path = os.path.join(UPLOAD_DIR, new_file_name) 

    # 4. Gelen resmi al ve fiziksel olarak bizim uploads/ klasörümüze kopyala
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "mesaj": "Profil fotoğrafınız başarıyla yüklendi! 📸", 
        "dosya_yolu": file_path,
        "dosya_adi": new_file_name
    }
