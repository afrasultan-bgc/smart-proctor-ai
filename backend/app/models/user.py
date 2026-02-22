from sqlalchemy import Column, Integer, String, Boolean
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False) # Şifrelerin hashli hali burada duracak
    role = Column(String, default="student")       # Roller: student, teacher, admin
    is_active = Column(Boolean, default=True)      # Kullanıcı aktif mi?