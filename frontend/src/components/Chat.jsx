import React, { useState, useRef, useEffect } from 'react';
import etuLogo from '../assets/etu_logo.png';

function Chat({ user, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Oturumları localStorage'dan yükle (veya varsayılan oluştur)
  useEffect(() => {
    const key = `health_literacy_sessions_${user.user_id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Kayıtlı sohbetler yüklenirken hata oluştu:", e);
      }
    }
    
    // Varsayılan bir oturum oluştur
    const initialSession = {
      id: Date.now().toString(),
      title: 'Yeni Sohbet',
      messages: [
        { id: 1, text: `Merhaba ${user.first_name}, ben dijital asistanınız! Sağlık okuryazarlığı konusunda size nasıl yardımcı olabilirim?`, isAi: true }
      ]
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, [user.user_id]);

  // Her oturum değişikliğinde localStorage'a kaydet
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(`health_literacy_sessions_${user.user_id}`, JSON.stringify(sessions));
    }
  }, [sessions, user.user_id]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'Yeni Sohbet',
      messages: [
        { id: Date.now() + 1, text: `Merhaba ${user.first_name}, ben dijital asistanınız! Sağlık okuryazarlığı konusunda size nasıl yardımcı olabilirim?`, isAi: true }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation(); // Satır tıklamasını engelle
    
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    
    // LocalStorage'dan silinen oturumu güncelle veya temizle
    if (updatedSessions.length === 0) {
      localStorage.removeItem(`health_literacy_sessions_${user.user_id}`);
    }

    if (activeSessionId === id) {
      if (updatedSessions.length > 0) {
        setActiveSessionId(updatedSessions[0].id);
      } else {
        // Hiç sohbet kalmadıysa yeni bir tane aç
        const newSession = {
          id: Date.now().toString(),
          title: 'Yeni Sohbet',
          messages: [
            { id: Date.now() + 1, text: `Merhaba ${user.first_name}, ben dijital asistanınız! Sağlık okuryazarlığı konusunda size nasıl yardımcı olabilirim?`, isAi: true }
          ]
        };
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
      }
    }
  };

  const handleSend = async () => {
    if (loading || !input.trim()) return;
    
    const currentSessionId = activeSessionId;
    const userMsg = { id: Date.now(), text: input, isAi: false };
    
    // Oturum mesajlarını ve başlığını güncelle (İlk kullanıcı mesajıysa başlığı değiştir)
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const isFirstUserMsg = s.messages.filter(m => !m.isAi).length === 0;
        const newTitle = isFirstUserMsg 
          ? (input.trim().substring(0, 22) + (input.trim().length > 22 ? '...' : '')) 
          : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    }));
    
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
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: [...s.messages, { id: Date.now(), text: "Sunucu hatası: " + errorMsg, isAi: true }] }
            : s
        ));
        setLoading(false);
        return;
      }

      if (!res.body) {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: [...s.messages, { id: Date.now(), text: "Sunucu yanıt akışı okunamadı.", isAi: true }] }
            : s
        ));
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';
      
      const aiMsgId = Date.now();
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: [...s.messages, { 
                id: aiMsgId, 
                text: '', 
                isAi: true,
                alertDoctor: false,
                alertSocial: false
              }] 
            }
          : s
      ));

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;

          const cleanedText = accumulatedText
            .replaceAll("[DOKTOR_UYARISI]", "")
            .replaceAll("[SOSYAL_MEDYA_UYARISI]", "")
            .replaceAll("KızılelmAI", "dijital asistanınız")
            .replaceAll("KizilelmAI", "dijital asistanınız")
            .trim();

          const alertDoctor = accumulatedText.includes("[DOKTOR_UYARISI]");
          const alertSocial = accumulatedText.includes("[SOSYAL_MEDYA_UYARISI]");

          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: s.messages.map(msg => 
                  msg.id === aiMsgId 
                    ? { ...msg, text: cleanedText, alertDoctor, alertSocial }
                    : msg
                )
              };
            }
            return s;
          }));
        }
      }
    } catch (err) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, { id: Date.now(), text: "Sunucuya bağlanılamadı. Lütfen backend'in çalıştığından emin olun.", isAi: true }] }
          : s
      ));
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
        <div className="sidebar-top">
          <div className="brand">
            <img src={etuLogo} alt="ETÜ Logo" width="32" height="32" style={{ marginRight: '10px', filter: 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.3))' }} />
            Sağlık Okuryazarlığı
          </div>
          
          <button className="new-chat-btn" onClick={handleNewChat} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Yeni Sohbet
          </button>
          
          <div className="sessions-list">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="session-item-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-bubble-icon">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="session-title" title={session.title}>{session.title}</span>
                </div>
                <button 
                  className="session-delete-btn" 
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  title="Sohbeti Sil"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
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
