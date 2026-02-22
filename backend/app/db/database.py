import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# .env dosyasındaki şifreleri yükle
load_dotenv()

# Veritabanı URL'sini al
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Motoru çalıştır
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Veritabanı bağlantı seansı oluşturan fonksiyon
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()