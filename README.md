# Sağlık Okuryazarlığı Asistanı

Bu proje, vatandaşların sağlık alanındaki bilgi kirliliğinden korunmasını sağlamak ve doğru sağlık bilgilerine ulaşmasını kolaylaştırmak amacıyla geliştirilmiş bir dijital asistan uygulamasıdır. Kullanıcıların sorularını tıp, insan vücudu, beslenme, hastalıklar ve ilaçlar gibi alanlarla sınırlı tutarak güvenli bilgi sağlar. Sosyal medya iddialarını veya hassas tıbbi konuları tespit ettiğinde otomatik olarak özel uyarı mekanizmaları devreye girer.

## Proje Mimarisi

Proje iki ana bölümden oluşmaktadır:
1. **Backend (Arka Uç):** FastAPI (Python) tabanlı bir REST API. Yapay zeka modeli entegrasyonu, kullanıcı yetkilendirme işlemleri ve veritabanı (SQLite) yönetimi burada yapılır.
2. **Frontend (Ön Uç):** Vite + React ile hazırlanmış modern, hızlı ve duyarlı (responsive) bir kullanıcı arayüzü.

---

## Gereksinimler

Projenin bilgisayarınızda çalışabilmesi için aşağıdaki yazılımların yüklü olması gerekir:
- **Python 3.8** veya üzeri
- **Node.js 18** veya üzeri
- **Git**

---

## Kurulum ve Çalıştırma

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/F1actor/saglikokuryazarligi.git
cd saglikokuryazarligi
```

---

### 2. Backend (Arka Uç) Kurulumu

Backend klasörüne gidin, sanal ortam oluşturup gerekli bağımlılıkları yükleyin:

```bash
# Backend dizinine geçiş yapın
cd backend

# Python sanal ortamı (venv) oluşturun
python -m venv venv

# Sanal ortamı aktifleştirin
# Windows (PowerShell) için:
.\venv\Scripts\Activate
# Windows (CMD) için:
venv\Scripts\activate
# macOS/Linux için:
source venv/bin/activate

# Gerekli bağımlılıkları yükleyin
pip install fastapi uvicorn sqlalchemy passlib bcrypt python-dotenv google-generativeai watchfiles
```

#### `.env` (Çevre Değişkenleri) Yapılandırması
`backend` klasörü altında bir `.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:
```env
DATABASE_URL=sqlite:///./sql_app.db
GEMINI_API_KEY=YOUR_AI_API_KEY_HERE
```
> **Not:** `GEMINI_API_KEY` alanına yapay zeka servisini kullanabilmek için edindiğiniz geçerli API anahtarını eklemelisiniz.

#### Backend'i Başlatın:
Sanal ortamınız aktifken aşağıdaki komutu çalıştırarak sunucuyu ayağa kaldırabilirsiniz:
```bash
uvicorn main:app --reload
```
Sunucu başarıyla başladığında `http://127.0.0.1:8000` adresinde çalışacaktır. API dokümantasyonuna ise `http://127.0.0.1:8000/docs` adresinden erişebilirsiniz.

---

### 3. Frontend (Ön Uç) Kurulumu

Yeni bir terminal açıp frontend klasörüne gidin ve bağımlılıkları yükleyip projeyi çalıştırın:

```bash
# Frontend dizinine geçiş yapın
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirici sunucusunu başlatın
npm run dev
```

Sunucu başarıyla başladığında terminaldeki bağlantıya (varsayılan olarak `http://localhost:5173`) tıklayarak tarayıcınızda arayüze erişebilirsiniz.

---

## Öne Çıkan Özellikler

- **Sınırlandırılmış Bilgi Alanı:** Sadece sağlık okuryazarlığı konularında cevap üretir. Sağlık dışı soruları filtreler.
- **Akışlı Cevap (Streaming Response):** Yapay zekanın cevabını kelime kelime ekrana yazdırarak gerçek zamanlı hissi verir.
- **Gelişmiş Uyarı Sistemi:**
  - **Doktor Uyarısı:** Kullanıcı tedavi veya ilaç sorduğunda otomatik olarak uzman bir doktora danışılması gerektiğini hatırlatır.
  - **Sosyal Medya Uyarısı:** Bitkisel kürler veya sosyal medyadaki kulaktan dolma bilgiler sorulduğunda, doğruluğu kanıtlanmamış iddialara inanılmaması gerektiği uyarısını ekler.
- **Kullanıcı Sistemi:** Güvenli şifreleme (bcrypt) kullanan kayıt olma ve giriş yapma özellikleri.
- **Sorgu Geçmişi:** Kullanıcıların sorduğu soruları ve aldığı yanıtları veritabanında loglayarak saklar.
