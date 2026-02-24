from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
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

    new_user = User(email=user_data.email, password_hash=hashed_pwd)
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