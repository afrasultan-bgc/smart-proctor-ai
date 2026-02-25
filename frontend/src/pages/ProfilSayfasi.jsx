import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

/*
  Backend Endpoint'leri:
  GET  /auth/me             → { id, email, role, is_active }
  PUT  /auth/change-password → { old_password, new_password }
  POST /auth/upload-avatar   → FormData (file)
  
  Roller: student, instructor, admin
*/

function rolEtiketi(rol) {
  switch (rol) {
    case 'student':    return 'Öğrenci';
    case 'instructor': return 'Eğitmen';
    case 'admin':      return 'Admin';
    default:           return rol;
  }
}

function rolVarsayilanYol(rol) {
  switch (rol) {
    case 'student':    return '/dashboard';
    case 'instructor': return '/instructor';
    case 'admin':      return '/admin';
    default:           return '/';
  }
}

export default function ProfilSayfasi() {
  const navigate = useNavigate();
  const dosyaRef = useRef(null);
  const token = localStorage.getItem('token');

  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [avatarOnizleme, setAvatarOnizleme] = useState(null);
  const [sifreForm, setSifreForm] = useState({ mevcut: '', yeni: '', tekrar: '' });
  const [sifreMesaj, setSifreMesaj] = useState(null);
  const [avatarMesaj, setAvatarMesaj] = useState(null);

  // Kullanıcı bilgisini backend'den çek
  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setKullanici(res.data);
      setYukleniyor(false);
    })
    .catch(() => {
      localStorage.removeItem('token');
      navigate('/', { replace: true });
    });
  }, [token, navigate]);

  // Şifre değiştir
  const sifreFormGonder = async () => {
    setSifreMesaj(null);

    if (!sifreForm.mevcut || !sifreForm.yeni || !sifreForm.tekrar) {
      setSifreMesaj({ tip: 'hata', yazi: 'Tüm alanları doldurun.' });
      return;
    }
    if (sifreForm.yeni.length < 6) {
      setSifreMesaj({ tip: 'hata', yazi: 'Yeni şifre en az 6 karakter olmalı.' });
      return;
    }
    if (sifreForm.yeni !== sifreForm.tekrar) {
      setSifreMesaj({ tip: 'hata', yazi: 'Yeni şifreler eşleşmiyor.' });
      return;
    }

    try {
      const res = await axios.put(`${API_URL}/auth/change-password`, {
        old_password: sifreForm.mevcut,
        new_password: sifreForm.yeni,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSifreMesaj({ tip: 'basari', yazi: res.data.mesaj || 'Şifre başarıyla değiştirildi.' });
      setSifreForm({ mevcut: '', yeni: '', tekrar: '' });
    } catch (err) {
      const detay = err.response?.data?.detail || 'Şifre değiştirilirken bir hata oluştu.';
      setSifreMesaj({ tip: 'hata', yazi: detay });
    }
  };

  // Fotoğraf yükle
  const dosyaSec = async (e) => {
    const dosya = e.target.files[0];
    if (!dosya) return;

    if (!dosya.type.startsWith('image/')) {
      setAvatarMesaj({ tip: 'hata', yazi: 'Lütfen bir resim dosyası seçin.' });
      return;
    }
    if (dosya.size > 5 * 1024 * 1024) {
      setAvatarMesaj({ tip: 'hata', yazi: 'Dosya boyutu 5MB\'dan küçük olmalı.' });
      return;
    }

    // Önizleme
    const okuyucu = new FileReader();
    okuyucu.onload = (event) => setAvatarOnizleme(event.target.result);
    okuyucu.readAsDataURL(dosya);

    // Backend'e yükle
    try {
      const formData = new FormData();
      formData.append('file', dosya);

      const res = await axios.post(`${API_URL}/auth/upload-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      setAvatarMesaj({ tip: 'basari', yazi: res.data.mesaj || 'Fotoğraf yüklendi.' });
    } catch (err) {
      const detay = err.response?.data?.detail || 'Fotoğraf yüklenirken bir hata oluştu.';
      setAvatarMesaj({ tip: 'hata', yazi: detay });
    }
  };

  // Çıkış yap
  const cikisYap = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  if (yukleniyor || !kullanici) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0a0f1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748b', fontFamily: "'Outfit', 'Segoe UI', sans-serif", fontSize: 14,
      }}>
        Yükleniyor...
      </div>
    );
  }

  const avatarGosterim = avatarOnizleme;
  const basHarfler = kullanici.email ? kullanici.email.substring(0, 2).toUpperCase() : 'KU';

  return (
    <div style={stiller.sayfa}>
      {/* ── Üst Bar ── */}
      <header style={stiller.ustBar}>
        <div style={stiller.ustBarSol}>
          <div style={stiller.logoIsaret}>SP</div>
          <div>
            <h1 style={stiller.sayfaBaslik}>Profil Ayarları</h1>
            <p style={stiller.sayfaAltBaslik}>{rolEtiketi(kullanici.role)} Hesabı</p>
          </div>
        </div>
        <div style={stiller.ustBarSag}>
          <button
            style={stiller.geriButonu}
            onClick={() => navigate(rolVarsayilanYol(kullanici.role))}
          >
            ← Panele Dön
          </button>
          <button style={stiller.cikisButonu} onClick={cikisYap}>
            Çıkış Yap
          </button>
        </div>
      </header>

      <div style={stiller.profilIcerik}>
        {/* ── Profil Kartı ── */}
        <div style={stiller.profilKarti}>
          <div style={stiller.profilUst}>
            <div style={stiller.avatarAlani}>
              <div
                style={stiller.avatarKutu}
                onClick={() => dosyaRef.current?.click()}
                onMouseEnter={(e) => {
                  const k = e.currentTarget.querySelector('[data-kaplama]');
                  if (k) k.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const k = e.currentTarget.querySelector('[data-kaplama]');
                  if (k) k.style.opacity = '0';
                }}
              >
                {avatarGosterim ? (
                  <img src={avatarGosterim} alt="Profil" style={stiller.avatarResim} />
                ) : (
                  <span style={stiller.avatarHarf}>{basHarfler}</span>
                )}
                <div data-kaplama="true" style={stiller.avatarKaplama}>📷</div>
              </div>
              <input
                ref={dosyaRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={dosyaSec}
              />
              <button
                style={stiller.fotografButonu}
                onClick={() => dosyaRef.current?.click()}
              >
                Fotoğraf Değiştir
              </button>
              {avatarMesaj && (
                <span style={{
                  fontSize: 11,
                  color: avatarMesaj.tip === 'basari' ? '#4ade80' : '#fca5a5',
                  marginTop: 4,
                }}>
                  {avatarMesaj.yazi}
                </span>
              )}
            </div>

            <div style={stiller.profilBilgi}>
              <h2 style={stiller.profilIsim}>{kullanici.email}</h2>
              <span style={stiller.profilRolRozet}>{rolEtiketi(kullanici.role)}</span>
              <div style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: kullanici.is_active ? '#4ade80' : '#ef4444',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {kullanici.is_active ? 'Aktif Hesap' : 'Pasif Hesap'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Şifre Değiştirme ── */}
        <div style={stiller.bolumKarti}>
          <h3 style={stiller.bolumBaslik}>Şifre Değiştir</h3>
          <p style={stiller.bolumAciklama}>Güvenliğiniz için şifrenizi düzenli olarak değiştirin.</p>

          {sifreMesaj && (
            <div style={{
              ...stiller.mesajKutu,
              backgroundColor: sifreMesaj.tip === 'basari' ? '#14532d' : '#7f1d1d',
              color: sifreMesaj.tip === 'basari' ? '#4ade80' : '#fca5a5',
              borderColor: sifreMesaj.tip === 'basari' ? '#166534' : '#991b1b',
            }}>
              {sifreMesaj.yazi}
            </div>
          )}

          <div style={stiller.sifreForm}>
            <div style={stiller.formGrup}>
              <label style={stiller.formEtiket}>Mevcut Şifre</label>
              <input
                style={stiller.formGirdi}
                type="password"
                placeholder="••••••"
                value={sifreForm.mevcut}
                onChange={(e) => setSifreForm({ ...sifreForm, mevcut: e.target.value })}
              />
            </div>
            <div style={stiller.sifreSatir}>
              <div style={{ ...stiller.formGrup, flex: 1 }}>
                <label style={stiller.formEtiket}>Yeni Şifre</label>
                <input
                  style={stiller.formGirdi}
                  type="password"
                  placeholder="En az 6 karakter"
                  value={sifreForm.yeni}
                  onChange={(e) => setSifreForm({ ...sifreForm, yeni: e.target.value })}
                />
              </div>
              <div style={{ ...stiller.formGrup, flex: 1 }}>
                <label style={stiller.formEtiket}>Yeni Şifre (Tekrar)</label>
                <input
                  style={stiller.formGirdi}
                  type="password"
                  placeholder="Tekrar girin"
                  value={sifreForm.tekrar}
                  onChange={(e) => setSifreForm({ ...sifreForm, tekrar: e.target.value })}
                />
              </div>
            </div>
            <button style={stiller.sifreKaydetButonu} onClick={sifreFormGonder}>
              Şifreyi Güncelle
            </button>
          </div>
        </div>

        {/* ── Hesap Bilgileri ── */}
        <div style={stiller.bolumKarti}>
          <h3 style={stiller.bolumBaslik}>Hesap Bilgileri</h3>
          <div style={stiller.hesapGrid}>
            <div style={stiller.hesapOge}>
              <span style={stiller.hesapEtiket}>E-Posta</span>
              <span style={stiller.hesapDeger}>{kullanici.email}</span>
            </div>
            <div style={stiller.hesapOge}>
              <span style={stiller.hesapEtiket}>Rol</span>
              <span style={stiller.hesapDeger}>{rolEtiketi(kullanici.role)}</span>
            </div>
            <div style={stiller.hesapOge}>
              <span style={stiller.hesapEtiket}>Kullanıcı ID</span>
              <span style={{ ...stiller.hesapDeger, fontFamily: "'JetBrains Mono', monospace" }}>
                #{kullanici.id}
              </span>
            </div>
            <div style={stiller.hesapOge}>
              <span style={stiller.hesapEtiket}>Hesap Durumu</span>
              <span style={stiller.hesapDeger}>
                {kullanici.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const stiller = {
  sayfa: {
    minHeight: '100vh',
    backgroundColor: '#0a0f1a',
    color: '#e5e7eb',
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
  },
  ustBar: {
    padding: '20px 32px',
    borderBottom: '1px solid #1e293b',
    backgroundColor: '#0d1321',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ustBarSol: { display: 'flex', alignItems: 'center', gap: 14 },
  ustBarSag: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIsaret: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 15, color: '#fff', flexShrink: 0,
  },
  sayfaBaslik: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  sayfaAltBaslik: { fontSize: 13, color: '#64748b', marginTop: 2 },
  geriButonu: {
    backgroundColor: 'transparent', color: '#94a3b8',
    border: '1px solid #334155', padding: '8px 18px',
    borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  cikisButonu: {
    backgroundColor: '#7f1d1d', color: '#fca5a5',
    border: '1px solid #991b1b', padding: '8px 18px',
    borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  profilIcerik: {
    padding: '24px 32px', maxWidth: 680, margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: 24,
  },
  profilKarti: {
    backgroundColor: '#111827', borderRadius: 12,
    border: '1px solid #1e293b', padding: '32px',
  },
  profilUst: { display: 'flex', alignItems: 'center', gap: 28 },
  avatarAlani: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  avatarKutu: {
    width: 88, height: 88, borderRadius: 20,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0,
  },
  avatarResim: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarHarf: { fontSize: 28, fontWeight: 800, color: '#fff' },
  avatarKaplama: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, opacity: 0, transition: 'opacity 0.2s ease',
  },
  fotografButonu: {
    backgroundColor: 'transparent', color: '#94a3b8',
    border: '1px solid #334155', padding: '5px 14px',
    borderRadius: 6, fontSize: 11, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  profilBilgi: { flex: 1 },
  profilIsim: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  profilRolRozet: {
    display: 'inline-block', marginTop: 10, padding: '4px 14px',
    borderRadius: 20, backgroundColor: '#1e3a5f', color: '#60a5fa',
    fontSize: 12, fontWeight: 600,
  },
  bolumKarti: {
    backgroundColor: '#111827', borderRadius: 12,
    border: '1px solid #1e293b', padding: '24px 28px',
  },
  bolumBaslik: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  bolumAciklama: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 18 },
  mesajKutu: {
    padding: '10px 14px', borderRadius: 8, fontSize: 13,
    marginBottom: 14, border: '1px solid',
  },
  sifreForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  sifreSatir: { display: 'flex', gap: 12 },
  sifreKaydetButonu: {
    backgroundColor: '#3b82f6', color: '#fff', border: 'none',
    padding: '10px 22px', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    alignSelf: 'flex-start', marginTop: 4,
  },
  hesapGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16,
  },
  hesapOge: { display: 'flex', flexDirection: 'column', gap: 4 },
  hesapEtiket: {
    fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  hesapDeger: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  formGrup: { display: 'flex', flexDirection: 'column', gap: 6 },
  formEtiket: {
    fontSize: 12, fontWeight: 600, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  formGirdi: {
    backgroundColor: '#0a0f1a', border: '1px solid #1e293b',
    borderRadius: 8, padding: '10px 14px', color: '#f1f5f9',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
};