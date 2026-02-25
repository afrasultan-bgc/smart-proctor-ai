import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

/*
  Backend Endpoint'leri:
  GET /auth/me    → { id, email, role, is_active }
  GET /exams/     → Tüm sınavlar

  İhlal/Violation sistemi henüz backend'de yok → mock veri kullanılıyor.
  Backend'e Violations tablosu eklendiğinde:
  GET  /violations/pending   → Bekleyen ihlaller
  POST /violations/{id}/review → Gözetmen kararı { decision, note }
*/

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────
function tarihFormatla(iso) {
  const t = new Date(iso);
  return t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function saatFormatla(iso) {
  const t = new Date(iso);
  return t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

const ihlalTurleri = {
  telefon: { etiket: 'Telefon Tespit Edildi', renk: '#ef4444' },
  yuz_bulunamadi: { etiket: 'Yüz Bulunamadı', renk: '#f59e0b' },
  saga_bakis: { etiket: 'Sağa Bakış', renk: '#d77127' },
  sola_bakis: { etiket: 'Sola Bakış', renk: '#d77127' },
  ikinci_kisi: { etiket: 'İkinci Kişi Tespit Edildi', renk: '#ef4444' },
  sekme_degisimi: { etiket: 'Sekme Değiştirildi', renk: '#f59e0b' },
};
function guvenRengi(y) { return y >= 80 ? '#ef4444' : y >= 60 ? '#f59e0b' : '#4ade80'; }

// Mock ihlal verisi
const mockIhlaller = [
  { id: 1, ogrenciId: 'STU-1042', sinavBaslik: 'Veri Yapıları Final', ders: 'BİL201', ihlalTuru: 'telefon', guvenYuzdesi: 87, zaman: '2026-03-02T10:23:00', durum: 'bekliyor', gozetmenKarar: null, gozetmenNotu: null },
  { id: 2, ogrenciId: 'STU-2087', sinavBaslik: 'Algoritma Analizi Vize', ders: 'BİL301', ihlalTuru: 'yuz_bulunamadi', guvenYuzdesi: 72, zaman: '2026-03-05T14:11:00', durum: 'bekliyor', gozetmenKarar: null, gozetmenNotu: null },
  { id: 3, ogrenciId: 'STU-3015', sinavBaslik: 'Veritabanı Yönetimi Quiz', ders: 'BİL202', ihlalTuru: 'saga_bakis', guvenYuzdesi: 65, zaman: '2026-02-25T13:08:00', durum: 'bekliyor', gozetmenKarar: null, gozetmenNotu: null },
  { id: 4, ogrenciId: 'STU-1042', sinavBaslik: 'Veri Yapıları Final', ders: 'BİL201', ihlalTuru: 'ikinci_kisi', guvenYuzdesi: 91, zaman: '2026-03-02T10:35:00', durum: 'bekliyor', gozetmenKarar: null, gozetmenNotu: null },
  { id: 5, ogrenciId: 'STU-4501', sinavBaslik: 'Yapay Zeka Proje Sunumu', ders: 'BİL405', ihlalTuru: 'sekme_degisimi', guvenYuzdesi: 95, zaman: '2026-03-10T09:18:00', durum: 'incelendi', gozetmenKarar: 'ihlal_var', gozetmenNotu: 'Açıkça sekme değiştirilmiş.' },
];

// ─── Bileşenler ──────────────────────────────────────────────
function IhlalTuruRozeti({ tur }) {
  const b = ihlalTurleri[tur] || { etiket: tur, renk: '#94a3b8' };
  return <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: b.renk + '20', color: b.renk }}>{b.etiket}</span>;
}

// ─── İnceleme Modalı ─────────────────────────────────────────
function IncelemeModali({ ihlal, kapat, kararVer }) {
  const [not, setNot] = useState('');

  if (!ihlal) return null;

  return (
    <div style={stiller.modalArka} onClick={kapat}>
      <div style={stiller.modalIcerik} onClick={e => e.stopPropagation()}>
        <div style={stiller.modalBaslik}>
          <h3 style={stiller.modalBaslikYazi}>İhlal İnceleme</h3>
          <button style={stiller.modalKapat} onClick={kapat}>✕</button>
        </div>

        <div style={stiller.modalGovde}>
          {/* Fotoğraf Önizleme */}
          <div style={stiller.fotografYerTutucu}>
            <span style={{ fontSize: 32 }}>📷</span>
            <span style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Kanıt fotoğrafı</span>
            <span style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>(Backend bağlandığında görüntülenecek)</span>
          </div>

          {/* Detaylar */}
          <div style={stiller.detayGrid}>
            <div style={stiller.detayOge}>
              <span style={stiller.detayEtiket}>Öğrenci ID</span>
              <span style={stiller.detayDeger}>{ihlal.ogrenciId}</span>
            </div>
            <div style={stiller.detayOge}>
              <span style={stiller.detayEtiket}>Sınav</span>
              <span style={stiller.detayDeger}>{ihlal.sinavBaslik}</span>
            </div>
            <div style={stiller.detayOge}>
              <span style={stiller.detayEtiket}>İhlal Türü</span>
              <IhlalTuruRozeti tur={ihlal.ihlalTuru} />
            </div>
            <div style={stiller.detayOge}>
              <span style={stiller.detayEtiket}>AI Güven Oranı</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: guvenRengi(ihlal.guvenYuzdesi) }}>
                %{ihlal.guvenYuzdesi}
              </span>
            </div>
            <div style={stiller.detayOge}>
              <span style={stiller.detayEtiket}>Zaman</span>
              <span style={stiller.detayDeger}>{tarihFormatla(ihlal.zaman)} · {saatFormatla(ihlal.zaman)}</span>
            </div>
          </div>

          {/* Not */}
          <div>
            <label style={stiller.formEtiket}>Gözetmen Notu</label>
            <textarea
              style={{ ...stiller.formGirdi, marginTop: 6, resize: 'vertical' }}
              rows={3}
              placeholder="İnceleme notunuzu buraya yazın..."
              value={not}
              onChange={e => setNot(e.target.value)}
            />
          </div>
        </div>

        <div style={stiller.modalAlt}>
          <button style={stiller.ihlalYokBtn} onClick={() => { kararVer(ihlal.id, 'ihlal_yok', not); kapat(); }}>
            ✓ İhlal Yok
          </button>
          <button style={stiller.ihlalVarBtn} onClick={() => { kararVer(ihlal.id, 'ihlal_var', not); kapat(); }}>
            ✕ İhlal Var
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Gözetmen Paneli ─────────────────────────────────────
export default function ProctorDashboard() {
  const navigate = useNavigate();
  const [kullanici, setKullanici] = useState(null);
  const [ihlaller, setIhlaller] = useState(mockIhlaller);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliIhlal, setSeciliIhlal] = useState(null);
  const [aktifFiltre, setAktifFiltre] = useState('bekliyor');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/', { replace: true }); return; }

    axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setKullanici(res.data);
      setYukleniyor(false);
      /*
        Backend'e violations endpoint'i eklendiğinde:
        return axios.get(`${API_URL}/violations/pending`, { headers });
      */
    })
    .catch(() => {
      localStorage.removeItem('token');
      navigate('/', { replace: true });
    });
  }, [token, navigate]);

  const kararVer = (ihlalId, karar, not) => {
    setIhlaller(onceki =>
      onceki.map(ih =>
        ih.id === ihlalId
          ? { ...ih, durum: 'incelendi', gozetmenKarar: karar, gozetmenNotu: not }
          : ih
      )
    );
    /*
      Backend bağlandığında:
      await axios.post(`${API_URL}/violations/${ihlalId}/review`, {
        decision: karar,
        note: not,
      }, { headers: { Authorization: `Bearer ${token}` } });
    */
  };

  const cikisYap = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  if (yukleniyor) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
        Yükleniyor...
      </div>
    );
  }

  const filtrelenmis = ihlaller.filter(ih => {
    if (aktifFiltre === 'bekliyor') return ih.durum === 'bekliyor';
    if (aktifFiltre === 'incelendi') return ih.durum === 'incelendi';
    return true;
  });

  const ist = {
    bekleyen: ihlaller.filter(ih => ih.durum === 'bekliyor').length,
    incelenen: ihlaller.filter(ih => ih.durum === 'incelendi').length,
    toplam: ihlaller.length,
  };

  return (
    <div style={stiller.sayfa}>
      {/* ── Üst Bar ── */}
      <header style={stiller.ustBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={stiller.logoIsaret}>SP</div>
          <div>
            <h1 style={stiller.sayfaBaslik}>Gözetmen Paneli</h1>
            <p style={stiller.sayfaAltBaslik}>Hoş geldin, {kullanici?.email} · {tarihFormatla(new Date().toISOString())}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={stiller.bekleyenRozet}>{ist.bekleyen} bekleyen inceleme</span>
          <Link to="/profil" style={stiller.profilLink}>Profil</Link>
          <button style={stiller.cikisButonu} onClick={cikisYap}>Çıkış</button>
        </div>
      </header>

      <div style={stiller.icerikAlani}>
        {/* ── İstatistikler ── */}
        <div style={stiller.istatistikGrid}>
          <div style={{ ...stiller.istatistikKarti, borderLeft: '3px solid #f59e0b' }}>
            <div style={stiller.istatistikDeger}>{ist.bekleyen}</div>
            <div style={stiller.istatistikEtiket}>Bekleyen İnceleme</div>
          </div>
          <div style={{ ...stiller.istatistikKarti, borderLeft: '3px solid #4ade80' }}>
            <div style={stiller.istatistikDeger}>{ist.incelenen}</div>
            <div style={stiller.istatistikEtiket}>İncelenen</div>
          </div>
          <div style={{ ...stiller.istatistikKarti, borderLeft: '3px solid #60a5fa' }}>
            <div style={stiller.istatistikDeger}>{ist.toplam}</div>
            <div style={stiller.istatistikEtiket}>Toplam İhlal</div>
          </div>
        </div>

        {/* ── Çift Kör Uyarısı ── */}
        <div style={stiller.uyariKarti}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Çift kör doğrulama aktif — diğer gözetmenin kararını göremezsiniz. Kararınızı bağımsız olarak verin.
          </p>
        </div>

        {/* ── İhlal Tablosu ── */}
        <div style={stiller.tabloAlani}>
          <div style={stiller.tabloUst}>
            <h3 style={stiller.bolumBaslik}>İhlal İncelemeleri</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'bekliyor', e: 'Bekleyen' },
                { id: 'incelendi', e: 'İncelenen' },
                { id: 'hepsi', e: 'Tümü' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAktifFiltre(f.id)}
                  style={{ ...stiller.filtreButonu, ...(aktifFiltre === f.id ? stiller.filtreAktif : {}) }}
                >
                  {f.e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={stiller.tablo}>
              <thead>
                <tr>
                  <th style={stiller.th}>#</th>
                  <th style={stiller.th}>Öğrenci ID</th>
                  <th style={stiller.th}>Sınav</th>
                  <th style={stiller.th}>İhlal Türü</th>
                  <th style={stiller.th}>AI Güven</th>
                  <th style={stiller.th}>Zaman</th>
                  <th style={stiller.th}>Durum</th>
                  <th style={stiller.th}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmis.length === 0 ? (
                  <tr><td colSpan={8} style={stiller.bosHucre}>Bu filtreye ait ihlal bulunamadı.</td></tr>
                ) : (
                  filtrelenmis.map((ihlal, i) => (
                    <tr key={ihlal.id}>
                      <td style={{ ...stiller.td, color: '#6b7280' }}>{i + 1}</td>
                      <td style={stiller.td}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#f1f5f9', fontSize: 12 }}>
                          {ihlal.ogrenciId}
                        </span>
                      </td>
                      <td style={stiller.td}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: 2 }}>{ihlal.sinavBaslik}</span>
                          <span style={{ backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{ihlal.ders}</span>
                        </div>
                      </td>
                      <td style={stiller.td}><IhlalTuruRozeti tur={ihlal.ihlalTuru} /></td>
                      <td style={stiller.td}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: guvenRengi(ihlal.guvenYuzdesi) }}>
                          %{ihlal.guvenYuzdesi}
                        </span>
                      </td>
                      <td style={stiller.td}>
                        <div style={{ fontSize: 12 }}>
                          <div>{tarihFormatla(ihlal.zaman)}</div>
                          <div style={{ color: '#64748b' }}>{saatFormatla(ihlal.zaman)}</div>
                        </div>
                      </td>
                      <td style={stiller.td}>
                        {ihlal.durum === 'bekliyor' ? (
                          <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>Bekliyor</span>
                        ) : (
                          <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>İncelendi</span>
                        )}
                      </td>
                      <td style={stiller.td}>
                        {ihlal.durum === 'bekliyor' ? (
                          <button style={stiller.inceleButonu} onClick={() => setSeciliIhlal(ihlal)}>İncele</button>
                        ) : (
                          <span style={{ color: ihlal.gozetmenKarar === 'ihlal_var' ? '#fca5a5' : '#4ade80', fontSize: 12, fontWeight: 600 }}>
                            {ihlal.gozetmenKarar === 'ihlal_var' ? 'İhlal Var' : 'İhlal Yok'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <IncelemeModali ihlal={seciliIhlal} kapat={() => setSeciliIhlal(null)} kararVer={kararVer} />
    </div>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const stiller = {
  sayfa: { minHeight: '100vh', backgroundColor: '#0a0f1a', color: '#e5e7eb', fontFamily: "'Outfit', 'Segoe UI', sans-serif" },
  ustBar: { padding: '20px 32px', borderBottom: '1px solid #1e293b', backgroundColor: '#0d1321', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoIsaret: { width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff', flexShrink: 0 },
  sayfaBaslik: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  sayfaAltBaslik: { fontSize: 13, color: '#64748b', marginTop: 2 },
  bekleyenRozet: { backgroundColor: '#f59e0b20', color: '#f59e0b', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  profilLink: { color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' },
  cikisButonu: { backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  icerikAlani: { padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 },
  istatistikGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  istatistikKarti: { backgroundColor: '#111827', borderRadius: 10, padding: '18px 20px', border: '1px solid #1e293b' },
  istatistikDeger: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', fontFamily: "'JetBrains Mono', monospace" },
  istatistikEtiket: { fontSize: 12, color: '#64748b', marginTop: 2 },
  uyariKarti: { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 10, padding: '14px 20px', border: '1px solid #334155' },
  tabloAlani: { backgroundColor: '#111827', borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden' },
  tabloUst: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' },
  bolumBaslik: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 },
  filtreButonu: { backgroundColor: 'transparent', color: '#64748b', border: '1px solid #1e293b', padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  filtreAktif: { backgroundColor: '#1e293b', color: '#f1f5f9', borderColor: '#334155' },
  tablo: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 24px', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 24px', borderBottom: '1px solid #1e293b22', color: '#cbd5e1' },
  bosHucre: { padding: '32px 24px', textAlign: 'center', color: '#64748b', fontSize: 14 },
  inceleButonu: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  // Modal
  modalArka: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalIcerik: { backgroundColor: '#111827', borderRadius: 14, border: '1px solid #1e293b', width: '100%', maxWidth: 560, overflow: 'hidden' },
  modalBaslik: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #1e293b' },
  modalBaslikYazi: { fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  modalKapat: { background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit' },
  modalGovde: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 },
  modalAlt: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #1e293b' },
  fotografYerTutucu: { backgroundColor: '#0a0f1a', border: '1px dashed #334155', borderRadius: 10, height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  detayGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  detayOge: { display: 'flex', flexDirection: 'column', gap: 4 },
  detayEtiket: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  detayDeger: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  formEtiket: { fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  formGirdi: { backgroundColor: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  ihlalYokBtn: { backgroundColor: '#14532d', color: '#4ade80', border: '1px solid #166534', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  ihlalVarBtn: { backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};