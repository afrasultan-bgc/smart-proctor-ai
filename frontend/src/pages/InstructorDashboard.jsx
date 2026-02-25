import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

/*
  Backend Endpoint'leri:
  GET  /auth/me    → { id, email, role, is_active }
  GET  /exams/     → Tüm sınavlar [{ id, title, duration, start_time, instructor_id, created_at }]
  POST /exams/     → Sınav oluştur { title, duration, start_time } (sadece instructor)
  
  Çakışma sistemi henüz backend'de yok → şimdilik mock veri
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

const ihlalTurleri = {
  telefon: { etiket: 'Telefon Tespit Edildi', renk: '#ef4444' },
  yuz_bulunamadi: { etiket: 'Yüz Bulunamadı', renk: '#f59e0b' },
  saga_bakis: { etiket: 'Sağa Bakış', renk: '#d77127' },
  ikinci_kisi: { etiket: 'İkinci Kişi', renk: '#ef4444' },
  sekme_degisimi: { etiket: 'Sekme Değiştirildi', renk: '#f59e0b' },
};
function guvenRengi(y) { return y >= 80 ? '#ef4444' : y >= 60 ? '#f59e0b' : '#4ade80'; }

// Mock çakışma verisi (backend'de violation sistemi yapılınca API'den çekilecek)
const mockCakismalar = [
  { id: 1, ogrenciId: 'STU-1042', sinavBaslik: 'Veri Yapıları Final', ihlalTuru: 'telefon', guvenYuzdesi: 87, zaman: '2026-03-02T10:23:00', gozetmen1: { karar: 'ihlal_var', not: 'Ekranda telefon yansıması görünüyor.' }, gozetmen2: { karar: 'ihlal_yok', not: 'Yansıma belirsiz.' }, egitmenKarar: null },
  { id: 2, ogrenciId: 'STU-3015', sinavBaslik: 'Veritabanı Quiz', ihlalTuru: 'saga_bakis', guvenYuzdesi: 65, zaman: '2026-02-25T13:08:00', gozetmen1: { karar: 'ihlal_yok', not: 'Anlık bakış.' }, gozetmen2: { karar: 'ihlal_var', not: 'Uzun süreli bakış.' }, egitmenKarar: null },
];

// ─── Bileşenler ──────────────────────────────────────────────
function DurumRozeti({ durum }) {
  const ayarlar = {
    yaklasan: { arka: '#1e3a5f', renk: '#d77127', yazi: 'Yaklaşan' },
    aktif: { arka: '#1e3a5f', renk: '#4ade80', yazi: 'Aktif' },
    tamamlandi: { arka: '#1e3a5f', renk: '#60a5fa', yazi: 'Tamamlandı' },
  };
  const a = ayarlar[durum] || ayarlar.yaklasan;
  return <span style={{ ...stiller.rozet, backgroundColor: a.arka, color: a.renk }}>{a.yazi}</span>;
}

function IhlalTuruRozeti({ tur }) {
  const b = ihlalTurleri[tur] || { etiket: tur, renk: '#94a3b8' };
  return <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: b.renk + '20', color: b.renk }}>{b.etiket}</span>;
}

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

// ─── Sınav Oluştur Modalı ────────────────────────────────────
function SinavOlusturModal({ acik, kapat, kaydet, yukleniyor }) {
  const [form, setForm] = useState({ baslik: '', sure: '', tarih: '', saat: '' });
  const [hata, setHata] = useState('');

  const d = (alan, deger) => setForm(o => ({ ...o, [alan]: deger }));

  const gonder = () => {
    setHata('');
    if (!form.baslik || !form.sure || !form.tarih || !form.saat) {
      setHata('Tüm alanları doldurun.');
      return;
    }
    kaydet({
      title: form.baslik,
      duration: parseInt(form.sure),
      start_time: `${form.tarih}T${form.saat}:00`,
    });
    setForm({ baslik: '', sure: '', tarih: '', saat: '' });
  };

  if (!acik) return null;
  return (
    <div style={stiller.modalArka} onClick={kapat}>
      <div style={stiller.modalIcerik} onClick={e => e.stopPropagation()}>
        <div style={stiller.modalBaslik}>
          <h3 style={stiller.modalBaslikYazi}>Yeni Sınav Oluştur</h3>
          <button style={stiller.modalKapat} onClick={kapat}>✕</button>
        </div>
        <div style={stiller.modalForm}>
          {hata && <div style={stiller.hataMesaji}>{hata}</div>}
          <div style={stiller.formGrup}>
            <label style={stiller.formEtiket}>Sınav Adı</label>
            <input style={stiller.formGirdi} placeholder="örn: Veri Yapıları Final" value={form.baslik} onChange={e => d('baslik', e.target.value)} />
          </div>
          <div style={stiller.formSatir}>
            <div style={{ ...stiller.formGrup, flex: 1 }}>
              <label style={stiller.formEtiket}>Süre (dk)</label>
              <input style={stiller.formGirdi} type="number" placeholder="90" value={form.sure} onChange={e => d('sure', e.target.value)} />
            </div>
            <div style={{ ...stiller.formGrup, flex: 1 }}>
              <label style={stiller.formEtiket}>Tarih</label>
              <input style={stiller.formGirdi} type="date" value={form.tarih} onChange={e => d('tarih', e.target.value)} />
            </div>
            <div style={{ ...stiller.formGrup, flex: 1 }}>
              <label style={stiller.formEtiket}>Saat</label>
              <input style={stiller.formGirdi} type="time" value={form.saat} onChange={e => d('saat', e.target.value)} />
            </div>
          </div>
        </div>
        <div style={stiller.modalAlt}>
          <button style={stiller.iptalButonu} onClick={kapat}>İptal</button>
          <button style={{ ...stiller.kaydetButonu, opacity: yukleniyor ? 0.7 : 1 }} onClick={gonder} disabled={yukleniyor}>
            {yukleniyor ? 'Oluşturuluyor...' : 'Sınav Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Çakışma Modalı ──────────────────────────────────────────
function CakismaModali({ cakisma, kapat, kararVer }) {
  const [not, setNot] = useState('');
  if (!cakisma) return null;
  return (
    <div style={stiller.modalArka} onClick={kapat}>
      <div style={{ ...stiller.modalIcerik, maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div style={stiller.modalBaslik}>
          <div>
            <h3 style={stiller.modalBaslikYazi}>Çakışma Değerlendirmesi</h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Gözetmenler farklı karar verdi — nihai karar sizin</p>
          </div>
          <button style={stiller.modalKapat} onClick={kapat}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><span style={stiller.detayEtiket}>Öğrenci ID</span><span style={stiller.detayDeger}>{cakisma.ogrenciId}</span></div>
            <div><span style={stiller.detayEtiket}>Sınav</span><span style={stiller.detayDeger}>{cakisma.sinavBaslik}</span></div>
            <div><span style={stiller.detayEtiket}>İhlal Türü</span><IhlalTuruRozeti tur={cakisma.ihlalTuru} /></div>
            <div><span style={stiller.detayEtiket}>AI Güven</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: guvenRengi(cakisma.guvenYuzdesi) }}>%{cakisma.guvenYuzdesi}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {[cakisma.gozetmen1, cakisma.gozetmen2].map((g, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: '#0a0f1a', borderRadius: 10, padding: '14px 16px', border: `1px solid ${g.karar === 'ihlal_var' ? '#991b1b' : '#166534'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Gözetmen {i + 1}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: g.karar === 'ihlal_var' ? '#7f1d1d' : '#14532d', color: g.karar === 'ihlal_var' ? '#fca5a5' : '#4ade80' }}>
                    {g.karar === 'ihlal_var' ? 'İhlal Var' : 'İhlal Yok'}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, fontStyle: 'italic' }}>"{g.not}"</p>
              </div>
            ))}
          </div>
          <div>
            <label style={stiller.formEtiket}>Nihai Kararınız İçin Not</label>
            <textarea style={{ ...stiller.formGirdi, marginTop: 6, resize: 'vertical' }} rows={3} placeholder="Kararınızın gerekçesini yazın..." value={not} onChange={e => setNot(e.target.value)} />
          </div>
        </div>
        <div style={stiller.modalAlt}>
          <button style={{ backgroundColor: '#14532d', color: '#4ade80', border: '1px solid #166534', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { kararVer(cakisma.id, 'ihlal_yok', not); kapat(); }}>✓ İhlal Yok</button>
          <button style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { kararVer(cakisma.id, 'ihlal_var', not); kapat(); }}>✕ İhlal Var</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Eğitmen Paneli ──────────────────────────────────────
export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [kullanici, setKullanici] = useState(null);
  const [sinavlar, setSinavlar] = useState([]);
  const [cakismalar, setCakismalar] = useState(mockCakismalar);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modalAcik, setModalAcik] = useState(false);
  const [kaydetYukleniyor, setKaydetYukleniyor] = useState(false);
  const [aktifFiltre, setAktifFiltre] = useState('hepsi');
  const [aktifSekme, setAktifSekme] = useState('sinavlar');
  const [seciliCakisma, setSeciliCakisma] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/', { replace: true }); return; }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API_URL}/auth/me`, { headers }),
      axios.get(`${API_URL}/exams/`, { headers }),
    ])
    .then(([kullaniciRes, sinavRes]) => {
      setKullanici(kullaniciRes.data);
      setSinavlar(sinavRes.data);
      setYukleniyor(false);
    })
    .catch(() => { localStorage.removeItem('token'); navigate('/', { replace: true }); });
  }, [token, navigate]);

  const yeniSinavKaydet = async (sinavData) => {
    setKaydetYukleniyor(true);
    try {
      const res = await axios.post(`${API_URL}/exams/`, sinavData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSinavlar(onceki => [res.data, ...onceki]);
      setModalAcik(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Sınav oluşturulurken hata oluştu.');
    }
    setKaydetYukleniyor(false);
  };

  const cakismaKararVer = (id, karar, not) => {
    setCakismalar(o => o.map(c => c.id === id ? { ...c, egitmenKarar: karar, egitmenNot: not } : c));
  };

  if (yukleniyor) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>Yükleniyor...</div>;
  }

  const filtrelenmis = aktifFiltre === 'hepsi' ? sinavlar : sinavlar.filter(s => sinavDurumu(s.start_time, s.duration) === aktifFiltre);
  const bekleyenCakismalar = cakismalar.filter(c => c.egitmenKarar === null);
  const kararVerilenler = cakismalar.filter(c => c.egitmenKarar !== null);

  const ist = {
    aktif: sinavlar.filter(s => sinavDurumu(s.start_time, s.duration) === 'aktif').length,
    yaklasan: sinavlar.filter(s => sinavDurumu(s.start_time, s.duration) === 'yaklasan').length,
    tamamlandi: sinavlar.filter(s => sinavDurumu(s.start_time, s.duration) === 'tamamlandi').length,
    toplam: sinavlar.length,
  };

  const cikisYap = () => { localStorage.removeItem('token'); navigate('/', { replace: true }); };

  return (
    <div style={stiller.sayfa}>
      <header style={stiller.ustBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={stiller.logoIsaret}>SP</div>
          <div>
            <h1 style={stiller.sayfaBaslik}>Eğitmen Paneli</h1>
            <p style={stiller.sayfaAltBaslik}>Hoş geldin, {kullanici?.email} · {tarihFormatla(new Date().toISOString())}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {bekleyenCakismalar.length > 0 && (
            <span style={stiller.cakismaUyari} onClick={() => setAktifSekme('cakismalar')}>
              ⚠ {bekleyenCakismalar.length} çakışma
            </span>
          )}
          <Link to="/profil" style={stiller.profilLink}>Profil</Link>
          <button style={stiller.olusturButonu} onClick={() => setModalAcik(true)}>+ Sınav Oluştur</button>
          <button style={stiller.cikisButonuUst} onClick={cikisYap}>Çıkış</button>
        </div>
      </header>

      <div style={stiller.icerikAlani}>
        <div style={stiller.istatistikGrid}>
          <IstatistikKarti etiket="Aktif Sınav" deger={ist.aktif} vurgu="#4ade80" />
          <IstatistikKarti etiket="Yaklaşan Sınav" deger={ist.yaklasan} vurgu="#d77127" />
          <IstatistikKarti etiket="Tamamlanan" deger={ist.tamamlandi} vurgu="#60a5fa" />
          <IstatistikKarti etiket="Toplam Sınav" deger={ist.toplam} vurgu="#c084fc" />
        </div>

        {/* Sekme */}
        <div style={stiller.sekmeGrup}>
          {[{ id: 'sinavlar', e: 'Sınavlarım' }, { id: 'cakismalar', e: `Çakışmalar${bekleyenCakismalar.length > 0 ? ` (${bekleyenCakismalar.length})` : ''}` }].map(s => (
            <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{ ...stiller.sekmeButonu, ...(aktifSekme === s.id ? stiller.sekmeAktif : {}) }}>{s.e}</button>
          ))}
        </div>

        {/* SINAVLAR */}
        {aktifSekme === 'sinavlar' && (
          <div style={stiller.tabloAlani}>
            <div style={stiller.tabloUst}>
              <h3 style={stiller.bolumBaslik}>Sınavlarım</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {['hepsi', 'aktif', 'yaklasan', 'tamamlandi'].map(f => (
                  <button key={f} onClick={() => setAktifFiltre(f)} style={{ ...stiller.filtreButonu, ...(aktifFiltre === f ? stiller.filtreAktif : {}) }}>
                    {f === 'hepsi' ? 'Tümü' : f === 'aktif' ? 'Aktif' : f === 'yaklasan' ? 'Yaklaşan' : 'Tamamlanan'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={stiller.tablo}>
                <thead><tr>
                  <th style={stiller.th}>#</th><th style={stiller.th}>Sınav Adı</th><th style={stiller.th}>Tarih</th><th style={stiller.th}>Saat</th><th style={stiller.th}>Süre</th><th style={stiller.th}>Durum</th>
                </tr></thead>
                <tbody>
                  {filtrelenmis.length === 0 ? (
                    <tr><td colSpan={6} style={stiller.bosHucre}>Sınav bulunamadı.</td></tr>
                  ) : filtrelenmis.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ ...stiller.td, color: '#6b7280' }}>{i + 1}</td>
                      <td style={stiller.td}><span style={{ fontWeight: 600, color: '#f1f5f9' }}>{s.title}</span></td>
                      <td style={stiller.td}>{tarihFormatla(s.start_time)}</td>
                      <td style={stiller.td}>{saatFormatla(s.start_time)}</td>
                      <td style={stiller.td}>{s.duration} dk</td>
                      <td style={stiller.td}><DurumRozeti durum={sinavDurumu(s.start_time, s.duration)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ÇAKIŞMALAR */}
        {aktifSekme === 'cakismalar' && (
          <>
            <div style={stiller.bilgiKarti}>
              <span>⚖️</span>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Aşağıdaki ihlallerde iki gözetmen farklı karar vermiştir. Nihai karar sizindir.</p>
            </div>
            {bekleyenCakismalar.length > 0 && (
              <div style={stiller.tabloAlani}>
                <div style={stiller.tabloUst}><h3 style={stiller.bolumBaslik}>Karar Bekleyen</h3></div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={stiller.tablo}>
                    <thead><tr>
                      <th style={stiller.th}>#</th><th style={stiller.th}>Öğrenci</th><th style={stiller.th}>Sınav</th><th style={stiller.th}>İhlal</th><th style={stiller.th}>AI Güven</th><th style={stiller.th}>G1</th><th style={stiller.th}>G2</th><th style={stiller.th}>İşlem</th>
                    </tr></thead>
                    <tbody>
                      {bekleyenCakismalar.map((c, i) => (
                        <tr key={c.id}>
                          <td style={{ ...stiller.td, color: '#6b7280' }}>{i + 1}</td>
                          <td style={stiller.td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#f1f5f9', fontSize: 12 }}>{c.ogrenciId}</span></td>
                          <td style={stiller.td}>{c.sinavBaslik}</td>
                          <td style={stiller.td}><IhlalTuruRozeti tur={c.ihlalTuru} /></td>
                          <td style={stiller.td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: guvenRengi(c.guvenYuzdesi) }}>%{c.guvenYuzdesi}</span></td>
                          <td style={stiller.td}><span style={{ color: c.gozetmen1.karar === 'ihlal_var' ? '#fca5a5' : '#4ade80', fontSize: 12, fontWeight: 600 }}>{c.gozetmen1.karar === 'ihlal_var' ? 'Var' : 'Yok'}</span></td>
                          <td style={stiller.td}><span style={{ color: c.gozetmen2.karar === 'ihlal_var' ? '#fca5a5' : '#4ade80', fontSize: 12, fontWeight: 600 }}>{c.gozetmen2.karar === 'ihlal_var' ? 'Var' : 'Yok'}</span></td>
                          <td style={stiller.td}><button style={stiller.degerlendirButonu} onClick={() => setSeciliCakisma(c)}>Değerlendir</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {kararVerilenler.length > 0 && (
              <div style={stiller.tabloAlani}>
                <div style={stiller.tabloUst}><h3 style={stiller.bolumBaslik}>Karara Bağlanan</h3></div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={stiller.tablo}>
                    <thead><tr><th style={stiller.th}>#</th><th style={stiller.th}>Öğrenci</th><th style={stiller.th}>Sınav</th><th style={stiller.th}>İhlal</th><th style={stiller.th}>Nihai Karar</th></tr></thead>
                    <tbody>
                      {kararVerilenler.map((c, i) => (
                        <tr key={c.id}>
                          <td style={{ ...stiller.td, color: '#6b7280' }}>{i + 1}</td>
                          <td style={stiller.td}>{c.ogrenciId}</td>
                          <td style={stiller.td}>{c.sinavBaslik}</td>
                          <td style={stiller.td}><IhlalTuruRozeti tur={c.ihlalTuru} /></td>
                          <td style={stiller.td}><span style={{ color: c.egitmenKarar === 'ihlal_var' ? '#fca5a5' : '#4ade80', fontSize: 12, fontWeight: 700 }}>{c.egitmenKarar === 'ihlal_var' ? 'İhlal Var (Kesinleşti)' : 'İhlal Yok (Kesinleşti)'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <SinavOlusturModal acik={modalAcik} kapat={() => setModalAcik(false)} kaydet={yeniSinavKaydet} yukleniyor={kaydetYukleniyor} />
      <CakismaModali cakisma={seciliCakisma} kapat={() => setSeciliCakisma(null)} kararVer={cakismaKararVer} />
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
  cakismaUyari: { backgroundColor: '#f59e0b20', color: '#f59e0b', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  profilLink: { color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' },
  olusturButonu: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  cikisButonuUst: { backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  icerikAlani: { padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 },
  istatistikGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  istatistikKarti: { backgroundColor: '#111827', borderRadius: 10, padding: '18px 20px', border: '1px solid #1e293b' },
  istatistikDeger: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', fontFamily: "'JetBrains Mono', monospace" },
  istatistikEtiket: { fontSize: 12, color: '#64748b', marginTop: 2 },
  sekmeGrup: { display: 'flex', gap: 4, backgroundColor: '#111827', padding: 4, borderRadius: 10, border: '1px solid #1e293b', width: 'fit-content' },
  sekmeButonu: { backgroundColor: 'transparent', color: '#64748b', border: 'none', padding: '8px 20px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  sekmeAktif: { backgroundColor: '#1e293b', color: '#f1f5f9' },
  tabloAlani: { backgroundColor: '#111827', borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden' },
  tabloUst: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' },
  bolumBaslik: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 },
  filtreButonu: { backgroundColor: 'transparent', color: '#64748b', border: '1px solid #1e293b', padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  filtreAktif: { backgroundColor: '#1e293b', color: '#f1f5f9', borderColor: '#334155' },
  tablo: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 24px', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 24px', borderBottom: '1px solid #1e293b22', color: '#cbd5e1' },
  bosHucre: { padding: '32px 24px', textAlign: 'center', color: '#64748b', fontSize: 14 },
  rozet: { padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-block' },
  degerlendirButonu: { backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  bilgiKarti: { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 10, padding: '14px 20px', border: '1px solid #334155' },
  detayEtiket: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 },
  detayDeger: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'block' },
  // Modal
  modalArka: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalIcerik: { backgroundColor: '#111827', borderRadius: 14, border: '1px solid #1e293b', width: '100%', maxWidth: 520, overflow: 'hidden' },
  modalBaslik: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #1e293b' },
  modalBaslikYazi: { fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  modalKapat: { background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit' },
  modalForm: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  modalAlt: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #1e293b' },
  hataMesaji: { backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  formGrup: { display: 'flex', flexDirection: 'column', gap: 6 },
  formSatir: { display: 'flex', gap: 12 },
  formEtiket: { fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  formGirdi: { backgroundColor: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  iptalButonu: { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  kaydetButonu: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};
