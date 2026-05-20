from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

    @validator('email')
    def validate_erzurum_email(cls, v):
        if not v.endswith('@erzurum.edu.tr'):
            raise ValueError('Email adresi @erzurum.edu.tr uzantili olmalidir.')
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    alert_doctor: bool = False
    alert_social_media: bool = False
