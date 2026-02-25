import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

/*
  Backend JWT payload: { sub: user_id, exp: ... }
  Rol bilgisi token'da YOK → /auth/me endpoint'inden çekiyoruz.
  
  Roller: student, instructor, admin
*/

function rolVarsayilanYol(rol) {
  switch (rol) {
    case 'student':    return '/dashboard';
    case 'instructor': return '/instructor';
    case 'admin':      return '/admin';
    default:           return '/';
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const [durum, setDurum] = useState('yukleniyor'); // yukleniyor | yetkili | yetkisiz | giris_yok
  const [kullaniciRol, setKullaniciRol] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // 1) Token yoksa → giriş sayfasına
    if (!token) {
      setDurum('giris_yok');
      return;
    }

    // 2) /auth/me ile kullanıcı bilgisini çek
    axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      const rol = res.data.role;
      setKullaniciRol(rol);

      // 3) Rol kontrolü
      if (allowedRoles && !allowedRoles.includes(rol)) {
        setDurum('yetkisiz');
      } else {
        setDurum('yetkili');
      }
    })
    .catch(() => {
      // Token geçersiz veya süresi dolmuş
      localStorage.removeItem('token');
      setDurum('giris_yok');
    });
  }, [allowedRoles]);

  // Yükleniyor
  if (durum === 'yukleniyor') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        fontSize: 14,
      }}>
        Yükleniyor...
      </div>
    );
  }

  // Token yok → giriş sayfası
  if (durum === 'giris_yok') {
    return <Navigate to="/" replace />;
  }

  // Yetkisiz → kendi paneline yönlendir
  if (durum === 'yetkisiz') {
    return <Navigate to={rolVarsayilanYol(kullaniciRol)} replace />;
  }

  // Yetkili → içeriği göster
  return children;
}