from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Veritabanı motorunu oluşturuyoruz
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

# Her istek geldiğinde yeni bir oturum açacak fabrika
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tüm tablolarımızın türeyeceği temel sınıf
Base = declarative_base()

# Dependency (Bağımlılık): İşi biten veritabanı bağlantısını kapatır
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()