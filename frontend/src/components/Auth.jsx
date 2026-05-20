import React, { useState } from 'react';
import etuLogo from '../assets/etu_logo.png';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Frontend domain kontrolü
    if (!formData.email.endsWith('@erzurum.edu.tr')) {
      setError('Email adresiniz @erzurum.edu.tr uzantılı olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? 'http://localhost:8000/login' : 'http://localhost:8000/register';
      
      const payload = isLogin ? {
        email: formData.email,
        password: formData.password
      } : {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Bir hata oluştu.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        onLogin(data);
      } else {
        setIsLogin(true);
        setError('Kayıt başarılı! Lütfen giriş yapın.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Lütfen backendin çalıştığından emin olun.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-brand-panel">
        <div className="auth-brand-header">
          <div className="brand-logo-area">
            <img src={etuLogo} alt="ETÜ Logo" className="brand-logo-img" width="60" height="60" />
            <div className="brand-titles">
              <span className="brand-univ">ERZURUM TEKNİK ÜNİVERSİTESİ</span>
              <span className="brand-sub">SAĞLIK OKURYAZARLIĞI</span>
            </div>
          </div>
        </div>

        <div className="auth-brand-content">
          <h1>Sağlık Okuryazarlığı ve Bilgi Kirliliğiyle Mücadele Platformu</h1>
          <p className="brand-intro">
            Sosyal medyadaki asılsız sağlık iddialarını analiz etmek, ilaç kullanımlarında bilinç oluşturmak ve doğru tıbbi bilgilere erişmek için geliştirilmiş yapay zeka destekli portal.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Güvenli Bilgi Filtresi</h3>
                <p>Sosyal medya efsaneleri ve kulaktan dolma kür iddiaları hakkında anında uyarılar.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>@erzurum.edu.tr Koruması</h3>
                <p>Sadece ETÜ mensuplarına açık, yüksek güvenlikli üyelik ve veri kaydı sistemi.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Sağlık Asistanı</h3>
                <p>Gelişmiş yapay zeka desteğiyle sağlık konularında bilimsel ve anlaşılır diyalog.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <p>© 2026 Erzurum Teknik Üniversitesi. Tüm Hakları Saklıdır.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-box">
          <div className="form-header">
            <h2>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
            <p>{isLogin ? 'ETÜ e-posta adresiniz ile giriş yapın' : 'Platforma erişmek için hesap oluşturun'}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-row">
                <div className="input-field">
                  <label>Adınız</label>
                  <input type="text" name="firstName" placeholder="Ad" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label>Soyadınız</label>
                  <input type="text" name="lastName" placeholder="Soyad" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>
            )}

            <div className="input-field">
              <label>Kurumsal E-posta</label>
              <input type="email" name="email" placeholder="kullanici@erzurum.edu.tr" value={formData.email} onChange={handleChange} required />
              <span className="field-hint">Sadece @erzurum.edu.tr uzantılı e-postalar kabul edilir.</span>
            </div>

            <div className="input-field">
              <label>Şifre</label>
              <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
            
            {error && <div className="error-msg">{error}</div>}
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span>
                  İşlem yapılıyor...
                </span>
              ) : (isLogin ? 'Giriş Yap' : 'Hesap Oluştur')}
            </button>
          </form>
          
          <div className="auth-switch">
            {isLogin ? (
              <p>Hesabınız yok mu? <span onClick={() => { setIsLogin(false); setError(''); }}>Yeni Kayıt Oluşturun</span></p>
            ) : (
              <p>Zaten üye misiniz? <span onClick={() => { setIsLogin(true); setError(''); }}>Giriş Yapın</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
