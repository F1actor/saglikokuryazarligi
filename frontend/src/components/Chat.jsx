import React, { useState, useRef, useEffect } from 'react';
import etuLogo from '../assets/etu_logo.png';

function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([
    { id: 1, text: `Merhaba ${user.first_name}, ben dijital asistanınız! Sağlık okuryazarlığı konusunda size nasıl yardımcı olabilirim?`, isAi: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (loading || !input.trim()) return;
    
    const userMsg = { id: Date.now(), text: input, isAi: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/chat?user_id=${user.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      });
      
      if (!res.ok) {
        let errorMsg = 'Bilinmeyen hata';
        try {
          const data = await res.json();
          errorMsg = data.detail || errorMsg;
        } catch (_) {}
        setMessages(prev => [...prev, { id: Date.now(), text: "Sunucu hatasi: " + errorMsg, isAi: true }]);
        setLoading(false);
        return;
      }

      if (!res.body) {
        setMessages(prev => [...prev, { id: Date.now(), text: "Sunucu yanıt akışı okunamadı.", isAi: true }]);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';
      
      const aiMsgId = Date.now();
      setMessages(prev => [...prev, { 
        id: aiMsgId, 
        text: '', 
        isAi: true,
        alertDoctor: false,
        alertSocial: false
      }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;

          // Arayüz temizleme filtreleri
          const cleanedText = accumulatedText
            .replaceAll("[DOKTOR_UYARISI]", "")
            .replaceAll("[SOSYAL_MEDYA_UYARISI]", "")
            .replaceAll("KızılelmAI", "dijital asistanınız")
            .replaceAll("KizilelmAI", "dijital asistanınız")
            .trim();

          const alertDoctor = accumulatedText.includes("[DOKTOR_UYARISI]");
          const alertSocial = accumulatedText.includes("[SOSYAL_MEDYA_UYARISI]");

          // Mesajı anlık olarak güncelliyoruz
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, text: cleanedText, alertDoctor, alertSocial }
              : msg
          ));
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Sunucuya baglanilamadi. Lutfen backend'in calistigindan emin olun.", isAi: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        handleSend();
      }
    }
  };

  return (
    <div className="chat-layout">
      <div className="sidebar">
        <div className="brand">
          <img src={etuLogo} alt="ETÜ Logo" width="32" height="32" style={{ marginRight: '10px', filter: 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.3))' }} />
          Sağlık Okuryazarlığı
        </div>
        
        <div className="user-info">
          <div>
            <div style={{fontSize: '14px', fontWeight: '600'}}>{user.first_name} {user.last_name}</div>
            <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Oturum açık</div>
          </div>
          <button className="logout-btn" onClick={onLogout}>Çıkış</button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.isAi ? 'ai' : 'user'}`}>
              <div className={`message ${msg.isAi ? 'ai' : 'user'}`}>
                <div style={{whiteSpace: 'pre-wrap'}}>{msg.text}</div>
                
                {msg.alertDoctor && (
                  <div className="alert-box doctor">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink: 0}}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div>
                      <strong>Doktorunuza Danışın!</strong><br/>
                      Lütfen herhangi bir ilaç veya tedavi uygulamadan önce mutlaka uzman bir doktora danışın.
                    </div>
                  </div>
                )}

                {msg.alertSocial && (
                  <div className="alert-box social">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink: 0}}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>
                      <strong>Dikkat! Asılsız Bilgi Olabilir</strong><br/>
                      Sosyal medyada gördüğünüz her sağlık haberine veya bitkisel kür iddiasına inanmayın, sağlığınıza zarar verebilir.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-wrapper ai">
              <div className="message ai" style={{fontStyle: 'italic', color: 'var(--text-secondary)'}}>
                Düşünüyor...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea 
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sağlık okuryazarlığı ile ilgili bir soru sorun..."
            />
            <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
