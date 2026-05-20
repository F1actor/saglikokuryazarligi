from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from database import engine, get_db, Base
import models
import schemas
import ai_service

# JWT for authentication (simplified for now)
# pyrefly: ignore [missing-import]
from passlib.context import CryptContext
# Parola hash'leme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Veritabani tablolarini olustur
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Tablolar olusturulurken hata (Veritabani var mi?): {e}")

app = FastAPI(title="Sağlık Okuryazarlığı Backend")

# CORS (Frontend'in ulasabilmesi icin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme ortamı için *
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayitli.")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Hatali email veya sifre.")
    
    # Basit bir token döndürüyoruz (Gelişmiş projelerde JWT kullanilir)
    # Burada user_id'yi frontend'de localstorage'da tutmak icin gonderiyoruz
    return {"message": "Giris basarili", "user_id": db_user.id, "first_name": db_user.first_name, "last_name": db_user.last_name}

@app.post("/chat")
def chat_with_ai(request: schemas.ChatRequest, user_id: int, db: Session = Depends(get_db)):
    # 1. Kullaniciyi kontrol et
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi.")

    # 2. Gemini API'ye gönder ve akış oluştur
    def event_generator():
        full_response = []
        try:
            for chunk in ai_service.get_chat_response_stream(request.message):
                full_response.append(chunk)
                yield chunk
        finally:
            # Akış bittikten sonra log'u veritabanına kaydet
            response_text = "".join(full_response)
            clean_text = response_text.replace("[DOKTOR_UYARISI]", "").replace("[SOSYAL_MEDYA_UYARISI]", "").strip()
            clean_text = clean_text.replace("KızılelmAI", "dijital asistanınız").replace("KizilelmAI", "dijital asistanınız")
            
            try:
                log = models.QueryLog(
                    user_id=user.id,
                    query_text=request.message,
                    response_text=clean_text,
                    timestamp=datetime.utcnow()
                )
                db.add(log)
                db.commit()
            except Exception as db_err:
                print(f"Veritabani log kaydi sirasinda hata: {db_err}")

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.get("/")
def read_root():
    return {"message": "Sağlık Okuryazarlığı Backend Calisiyor..."}
