import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

/*
  Backend Endpoint'leri:
  GET /auth/me       → { id, email, role, is_active }
  GET /exams/active  → [{ id, title, duration, start_time, instructor_id, created_at }]
  GET /exams/past    → [{ id, title, duration, start_time, instructor_id, created_at }]
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

function sinavDurumu(startTime, duration) {
  const baslangic = new Date(startTime);
  const bitis = new Date(baslangic.getTime() + duration * 60000);
  const simdi = new Date();
  if (simdi >= baslangic && simdi <= bitis) return 'aktif';
  if (simdi < baslangic) return 'yaklasan';
  return 'tamamlandi';
}

// ─── Durum Rozeti ────────────────────────────────────────────
function DurumRozeti({ durum }) {
  const ayarlar = {
    yaklasan: { arka: '#1e3a5f', renk: '#d77127', yazi: 'Yaklaşan' },
    aktif: { arka: '#1e3a5f', renk: '#4ade80', yazi: 'Aktif' },
    tamamlandi: { arka: '#1e3a5f', renk: '#60a5fa', yazi: 'Tamamlandı' },
  };
  const a = ayarlar[durum] || ayarlar.yaklasan;
  return (
    <span style={{ ...stiller.rozet, backgroundColor: a.arka, color: a.renk }}>
      {a.yazi}
    </span>
  );
}

// ─── İstatistik Kartı ────────────────────────────────────────
function IstatistikKarti({ etiket, deger, vurgu }) {
  return (
    <div style={{ ...stiller.istatistikKarti, borderLeft: `3px solid ${vurgu}` }}>
      <div>
        <div style={stiller.istatistikDeger}>{deger}</div>
        <div style={stiller.istatistikEtiket}>{etiket}</div>
      </div>
    </div>
  );
}

// ─── Yan Menü ────────────────────────────────────────────────
function YanMenu({ aktifSekme, setAktifSekme, kullanici }) {
  const navigate = useNavigate();
  const menuOgeleri = [
    { id: 'anasayfa', etiket: 'Ana Sayfa' },
    { id: 'atanan', etiket: 'Atanan Sınavlar' },
    { id: 'gecmis', etiket: 'Geçmiş Sınavlar' },
  ];

  const cikisYap = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  const basHarfler = kullanici?.email ? kullanici.email.substring(0, 2).toUpperCase() : 'KU';

  return (
    <div style={stiller.yanMenu}>
      <div style={stiller.yanMenuBaslik}>
        <div style={stiller.logoIsaret}>SP</div>
        <span style={stiller.logoYazi}>SmartProctor</span>
      </div>

      <nav style={stiller.navigasyon}>
        {menuOgeleri.map((oge) => (
          <button
            key={oge.id}
            onClick={() => setAktifSekme(oge.id)}
            style={{
              ...stiller.menuOgesi,
              ...(aktifSekme === oge.id ? stiller.menuOgesiAktif : {}),
            }}
          >
            {oge.etiket}
          </button>
        ))}
        <Link to="/profil" style={{ ...stiller.menuOgesi, textDecoration: 'none' }}>
          Profil
        </Link>
      </nav>

      <div style={stiller.yanMenuAlt}>
        <div style={stiller.kullaniciKarti}>
          <div style={stiller.kullaniciAvatar}>{basHarfler}</div>
          <div style={{ flex: 1 }}>
            <div style={stiller.kullaniciIsim}>{kullanici?.email || '...'}</div>
            <div style={stiller.kullaniciRol}>Öğrenci</div>
          </div>
        </div>
        <button style={stiller.cikisButonuYan} onClick={cikisYap}>Çıkış Yap</button>
      </div>
    </div>
  );
}

// ─── Ana Öğrenci Paneli ──────────────────────────────────────
export default function StudentDashboard() {
  const navigate = useNavigate();
  const [aktifSekme, setAktifSekme] = useState('anasayfa');
  const [kullanici, setKullanici] = useState(null);
  const [aktifSinavlar, setAktifSinavlar] = useState([]);
  const [gecmisSinavlar, setGecmisSinavlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/', { replace: true }); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API_URL}/auth/me`, { headers }),
      axios.get(`${API_URL}/exams/active`, { headers }),
      axios.get(`${API_URL}/exams/past`, { headers }),
    ])
    .then(([kullaniciRes, aktifRes, gecmisRes]) => {
      setKullanici(kullaniciRes.data);
      setAktifSinavlar(aktifRes.data);
      setGecmisSinavlar(gecmisRes.data);
      setYukleniyor(false);
    })
    .catch(() => {
      localStorage.removeItem('token');
      navigate('/', { replace: true });
    });
  }, [navigate]);

  if (yukleniyor) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <div style={stiller.duzen}>
      <YanMenu aktifSekme={aktifSekme} setAktifSekme={setAktifSekme} kullanici={kullanici} />

      <main style={stiller.anaIcerik}>
        <header style={stiller.ustBar}>
          <div>
            <h1 style={stiller.sayfaBaslik}>
              {aktifSekme === 'anasayfa' && 'Ana Sayfa'}
              {aktifSekme === 'atanan' && 'Atanan Sınavlar'}
              {aktifSekme === 'gecmis' && 'Geçmiş Sınavlar'}
            </h1>
            <p style={stiller.sayfaAltBaslik}>{tarihFormatla(new Date().toISOString())}</p>
          </div>
        </header>

        <div style={stiller.icerik}>
          {/* ── ANA SAYFA ── */}
          {aktifSekme === 'anasayfa' && (
            <>
              <div style={stiller.hosgeldinKarti}>
                <h2 style={stiller.hosgeldinBaslik}>Hoş geldin! 👋</h2>
                <p style={stiller.hosgeldinYazi}>
                  {aktifSinavlar.length} yaklaşan sınavın var!
                </p>
              </div>

              <div style={stiller.istatistikGrid}>
                <IstatistikKarti
                  etiket="Yaklaşan Sınav"
                  deger={aktifSinavlar.filter(s => sinavDurumu(s.start_time, s.duration) === 'yaklasan').length}
                  vurgu="#60a5fa"
                />
                <IstatistikKarti etiket="Tamamlanan Sınav" deger={gecmisSinavlar.length} vurgu="#4ade80" />
                <IstatistikKarti
                  etiket="Aktif Sınav"
                  deger={aktifSinavlar.filter(s => sinavDurumu(s.start_time, s.duration) === 'aktif').length}
                  vurgu="#fbbf24"
                />
                <IstatistikKarti etiket="Toplam Sınav" deger={aktifSinavlar.length + gecmisSinavlar.length} vurgu="#c084fc" />
              </div>

              <div style={stiller.tabloAlani}>
                <h3 style={stiller.bolumBaslik}>Yaklaşan Sınavlar</h3>
                <div style={stiller.tabloSarici}>
                  <table style={stiller.tablo}>
                    <thead>
                      <tr>
                        <th style={stiller.tabloBaslikH}>Sınav Adı</th>
                        <th style={stiller.tabloBaslikH}>Tarih</th>
                        <th style={stiller.tabloBaslikH}>Saat</th>
                        <th style={stiller.tabloBaslikH}>Süre</th>
                        <th style={stiller.tabloBaslikH}>Durum</th>
                        <th style={stiller.tabloBaslikH}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {aktifSinavlar.length === 0 ? (
                        <tr><td colSpan={6} style={stiller.bosHucre}>Yaklaşan sınav bulunmuyor.</td></tr>
                      ) : (
                        aktifSinavlar.map((sinav) => {
                          const durum = sinavDurumu(sinav.start_time, sinav.duration);
                          return (
                            <tr key={sinav.id} style={stiller.tabloSatir}>
                              <td style={stiller.tabloHucre}><span style={stiller.sinavAdi}>{sinav.title}</span></td>
                              <td style={stiller.tabloHucre}>{tarihFormatla(sinav.start_time)}</td>
                              <td style={stiller.tabloHucre}>{saatFormatla(sinav.start_time)}</td>
                              <td style={stiller.tabloHucre}>{sinav.duration} dk</td>
                              <td style={stiller.tabloHucre}><DurumRozeti durum={durum} /></td>
                              <td style={stiller.tabloHucre}>
                                {durum === 'aktif' && (
                                  <button style={stiller.girisButonu} onClick={() => navigate('/exam')}>
                                    Sınava Gir
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── ATANAN SINAVLAR ── */}
          {aktifSekme === 'atanan' && (
            <div style={stiller.tabloAlani}>
              <div style={stiller.tabloSarici}>
                <table style={stiller.tablo}>
                  <thead>
                    <tr>
                      <th style={stiller.tabloBaslikH}>#</th>
                      <th style={stiller.tabloBaslikH}>Sınav Adı</th>
                      <th style={stiller.tabloBaslikH}>Tarih</th>
                      <th style={stiller.tabloBaslikH}>Saat</th>
                      <th style={stiller.tabloBaslikH}>Süre</th>
                      <th style={stiller.tabloBaslikH}>Durum</th>
                      <th style={stiller.tabloBaslikH}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aktifSinavlar.length === 0 ? (
                      <tr><td colSpan={7} style={stiller.bosHucre}>Atanan sınav bulunamadı.</td></tr>
                    ) : (
                      aktifSinavlar.map((sinav, i) => {
                        const durum = sinavDurumu(sinav.start_time, sinav.duration);
                        return (
                          <tr key={sinav.id} style={stiller.tabloSatir}>
                            <td style={{ ...stiller.tabloHucre, color: '#6b7280' }}>{i + 1}</td>
                            <td style={stiller.tabloHucre}><span style={stiller.sinavAdi}>{sinav.title}</span></td>
                            <td style={stiller.tabloHucre}>{tarihFormatla(sinav.start_time)}</td>
                            <td style={stiller.tabloHucre}>{saatFormatla(sinav.start_time)}</td>
                            <td style={stiller.tabloHucre}>{sinav.duration} dk</td>
                            <td style={stiller.tabloHucre}><DurumRozeti durum={durum} /></td>
                            <td style={stiller.tabloHucre}>
                              {durum === 'aktif' ? (
                                <button style={stiller.girisButonu} onClick={() => navigate('/exam')}>Sınava Gir</button>
                              ) : (
                                <button style={stiller.detayButonu}>Detay</button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── GEÇMİŞ SINAVLAR ── */}
          {aktifSekme === 'gecmis' && (
            <div style={stiller.tabloAlani}>
              <div style={stiller.tabloSarici}>
                <table style={stiller.tablo}>
                  <thead>
                    <tr>
                      <th style={stiller.tabloBaslikH}>#</th>
                      <th style={stiller.tabloBaslikH}>Sınav Adı</th>
                      <th style={stiller.tabloBaslikH}>Tarih</th>
                      <th style={stiller.tabloBaslikH}>Süre</th>
                      <th style={stiller.tabloBaslikH}>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gecmisSinavlar.length === 0 ? (
                      <tr><td colSpan={5} style={stiller.bosHucre}>Geçmiş sınav bulunamadı.</td></tr>
                    ) : (
                      gecmisSinavlar.map((sinav, i) => (
                        <tr key={sinav.id} style={stiller.tabloSatir}>
                          <td style={{ ...stiller.tabloHucre, color: '#6b7280' }}>{i + 1}</td>
                          <td style={stiller.tabloHucre}><span style={stiller.sinavAdi}>{sinav.title}</span></td>
                          <td style={stiller.tabloHucre}>{tarihFormatla(sinav.start_time)}</td>
                          <td style={stiller.tabloHucre}>{sinav.duration} dk</td>
                          <td style={stiller.tabloHucre}><DurumRozeti durum="tamamlandi" /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const stiller = {
  duzen: { display: 'flex', minHeight: '100vh', backgroundColor: '#0a0f1a', color: '#e5e7eb', fontFamily: "'Outfit', 'Segoe UI', sans-serif" },
  yanMenu: { width: 240, backgroundColor: '#0d1321', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 },
  yanMenuBaslik: { padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1e293b' },
  logoIsaret: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' },
  logoYazi: { fontSize: 16, fontWeight: 700, color: '#f1f5f9' },
  navigasyon: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  menuOgesi: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  menuOgesiAktif: { backgroundColor: '#1e293b', color: '#f1f5f9' },
  yanMenuAlt: { padding: '16px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 10 },
  kullaniciKarti: { display: 'flex', alignItems: 'center', gap: 10 },
  kullaniciAvatar: { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' },
  kullaniciIsim: { fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 },
  kullaniciRol: { fontSize: 11, color: '#64748b' },
  cikisButonuYan: { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  anaIcerik: { flex: 1, marginLeft: 240, minHeight: '100vh' },
  ustBar: { padding: '20px 32px', borderBottom: '1px solid #1e293b', backgroundColor: '#0d1321' },
  sayfaBaslik: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  sayfaAltBaslik: { fontSize: 13, color: '#64748b', marginTop: 2 },
  icerik: { padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 },
  hosgeldinKarti: { background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a3e 100%)', borderRadius: 12, padding: '24px 28px', border: '1px solid #2d4a7a' },
  hosgeldinBaslik: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  hosgeldinYazi: { fontSize: 14, color: '#94a3b8', marginTop: 6 },
  istatistikGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  istatistikKarti: { backgroundColor: '#111827', borderRadius: 10, padding: '18px 20px', border: '1px solid #1e293b' },
  istatistikDeger: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', fontFamily: "'JetBrains Mono', monospace" },
  istatistikEtiket: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tabloAlani: { backgroundColor: '#111827', borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden' },
  bolumBaslik: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', padding: '18px 24px 0', margin: 0 },
  tabloSarici: { overflowX: 'auto', padding: '12px 0' },
  tablo: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  tabloBaslikH: { textAlign: 'left', padding: '10px 24px', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #1e293b' },
  tabloSatir: { transition: 'background-color 0.15s ease' },
  tabloHucre: { padding: '12px 24px', borderBottom: '1px solid #1e293b22', color: '#cbd5e1' },
  bosHucre: { padding: '32px 24px', textAlign: 'center', color: '#64748b', fontSize: 14 },
  sinavAdi: { fontWeight: 600, color: '#f1f5f9' },
  rozet: { padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-block' },
  girisButonu: { backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  detayButonu: { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
};