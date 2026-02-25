import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StudentExam from './pages/StudentExam';
import InstructorDashboard from './pages/InstructorDashboard';
import ProctorDashboard from './pages/ProctorDashboard';
import ProfilSayfasi from './pages/ProfilSayfasi';
import ProtectedRoute from './components/ProtectedRoute';

/*
  Backend Rol Yapısı:
  - student    → Öğrenci paneli (/dashboard, /exam)
  - instructor → Eğitmen paneli (/instructor)
  - admin      → Gözetmen/Admin paneli (/admin)

  Backend API Endpoint'leri:
  POST /auth/register        → { email, password, role }
  POST /auth/login           → OAuth2 form (username, password) → { access_token, token_type }
  GET  /auth/me              → { id, email, role, is_active }
  PUT  /auth/change-password  → { old_password, new_password }
  POST /auth/upload-avatar    → FormData (file)
  GET  /exams/               → Tüm sınavlar
  GET  /exams/active         → Aktif/yaklaşan sınavlar
  GET  /exams/past           → Geçmiş sınavlar
  POST /exams/               → Sınav oluştur (sadece instructor)
*/

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Genel (Giriş gerektirmeyen) ── */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Öğrenci ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/exam" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExam />
          </ProtectedRoute>
        } />

        {/* ── Eğitmen ── */}
        <Route path="/instructor" element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorDashboard />
          </ProtectedRoute>
        } />

        {/* ── Admin / Gözetmen ── */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProctorDashboard />
          </ProtectedRoute>
        } />

        {/* ── Profil (Tüm roller erişebilir) ── */}
        <Route path="/profil" element={
          <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
            <ProfilSayfasi />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
