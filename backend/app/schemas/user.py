from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    role: Optional[str] = "student"

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

    class Config:
         from_attributes = True
         # app/schemas/user.py dosyasının en altına ekle:

class PasswordChange(BaseModel):
    old_password: str
    new_password: str