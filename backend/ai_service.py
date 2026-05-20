import os
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

SYSTEM_PROMPT = """Sen Sağlık Okuryazarlığı Asistanı adında, sadece sağlık okuryazarlığı ve sağlıkta bilgi kirliliği üzerine uzmanlaşmış bir yapay zeka asistanısın. 
Görevin insanların yanlış yönlendirilmesini engellemek ve doğru sağlık bilgisi sunmaktır.

Kuralların:
1. Kesinlikle "KızılelmAI" veya "KizilelmAI" ismini kullanma. Kendinden bahsetmen gerekirse "dijital asistanınız" veya "Sağlık Okuryazarlığı Asistanı" de. Ancak normal sohbet akışında her cevabın başında "Merhaba, ben dijital asistanınız" diyerek kendini tekrar etme, doğrudan soruya cevap ver.
2. SADECE sağlık, tıp, insan vücudu, beslenme, hastalıklar ve ilaçlarla ilgili sorulara cevap ver. Eğer kullanıcı sağlıkla ilgisi olmayan bir şey sorarsa kibarca "Ben sadece sağlık okuryazarlığı alanında hizmet veren bir asistanım, bu soruya cevap veremem." de.
3. Eğer kullanıcı senden bir ilaç tavsiyesi, tedavi yöntemi veya "Şu hastalığım var ne iyi gelir?" gibi bir soru sorarsa, genel bilgiler verebilirsin ANCAK cevabının sonuna veya başına MUTLAKA şu uyarıyı koy: "[DOKTOR_UYARISI] Lütfen herhangi bir ilaç veya tedavi uygulamadan önce mutlaka uzman bir doktora danışın."
4. Eğer kullanıcı sosyal medyada (Instagram, TikTok, Twitter vb.) gördüğü bir haberi, bitkisel kür iddialarını ("şu ot kansere iyi geliyormuş", "şunu içince zayıflıyorsun" vb.) sorarsa, bilginin doğruluğunu kontrol et ve cevabına MUTLAKA şu uyarıyı ekle: "[SOSYAL_MEDYA_UYARISI] Lütfen sosyal medyada gördüğünüz her sağlık haberine veya bitkisel kür iddiasına inanmayın, bilimselliği kanıtlanmamış yöntemler sağlığınıza zarar verebilir."

Cevaplarını her zaman anlaşılır, bilimsel gerçeklere dayanan ve yardımsever bir tonda ver.
"""

def get_chat_response(message: str) -> dict:
    if not api_key:
        return {"response": "Sistem hatası: Gemini API anahtarı ayarlanmamış.", "alert_doctor": False, "alert_social_media": False}

    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            model = genai.GenerativeModel('gemini-3.5-flash', system_instruction=SYSTEM_PROMPT)
            response = model.generate_content(message)
            text = response.text

            alert_doctor = "[DOKTOR_UYARISI]" in text
            alert_social_media = "[SOSYAL_MEDYA_UYARISI]" in text

            # Arayüzde daha temiz görünmesi için flag (bayrak) etiketlerini siliyoruz
            clean_text = text.replace("[DOKTOR_UYARISI]", "").replace("[SOSYAL_MEDYA_UYARISI]", "").strip()
            
            # Güvenlik önlemi olarak eski isimleri tamamen temizliyoruz
            clean_text = clean_text.replace("KızılelmAI", "dijital asistanınız").replace("KizilelmAI", "dijital asistanınız")

            return {
                "response": clean_text,
                "alert_doctor": alert_doctor,
                "alert_social_media": alert_social_media
            }
        except Exception as e:
            error_str = str(e)
            # Hata 429 ise ve deneme limitini aşmadıysak bekle ve tekrar dene
            if "429" in error_str and attempt < max_retries:
                time.sleep(2)
                continue
            
            # Son denemede de başarısız olunduysa kullanıcı dostu hata mesajı göster
            if "429" in error_str or "quota" in error_str.lower() or "limit" in error_str.lower():
                friendly_response = "Şu anda Gemini yapay zeka servisinde yoğunluk (istek limiti aşımı) yaşanıyor. Lütfen yaklaşık 30-40 saniye sonra tekrar deneyiniz."
            else:
                friendly_response = f"Yapay zeka servisine ulaşılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz. (Hata: {error_str})"
                
            return {
                "response": friendly_response,
                "alert_doctor": False,
                "alert_social_media": False
            }

def get_chat_response_stream(message: str):
    if not api_key:
        yield "Sistem hatası: Gemini API anahtarı ayarlanmamış."
        return

    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            model = genai.GenerativeModel('gemini-3.5-flash', system_instruction=SYSTEM_PROMPT)
            response = model.generate_content(message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            error_str = str(e)
            if "429" in error_str and attempt < max_retries:
                time.sleep(2)
                continue
            
            if "429" in error_str or "quota" in error_str.lower() or "limit" in error_str.lower():
                yield "Şu anda Gemini yapay zeka servisinde yoğunluk (istek limiti aşımı) yaşanıyor. Lütfen yaklaşık 30-40 saniye sonra tekrar deneyiniz."
            else:
                yield f"Yapay zeka servisine ulaşılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz. (Hata: {error_str})"
            return

