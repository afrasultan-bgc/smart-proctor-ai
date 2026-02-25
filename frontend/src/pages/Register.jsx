import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Backend'in beklediği verileri hazırlıyoruz (Schema ile uyumlu olmalı)
    const userData = {
      full_name: name, // Senin backend'in (schemas.py) büyük ihtimalle "full_name" bekliyor
      email: email,
      password: password,
      role: role
    };

    try {
      // DİKKAT: Backend'de yeni kullanıcı oluşturma adresin "/users/" veya "/auth/register" olabilir.
      // Swagger'a bakarak burayı düzeltmen gerekebilir. Ben standart bir yapıya göre yazıyorum:
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        // E-posta zaten kullanımdaysa vb. hatalar
        setError(data.detail || 'Kayıt başarısız!');
      }

    } catch (err) {
      setError('Sunucuya ulaşılamadı. Lütfen backend bağlantısını kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-2">Smart Proctor</h2>
        <p className="text-center text-gray-500 mb-6">Yeni Hesap Oluştur</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Zeynep Münteha"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ogrenci@univ.edu.tr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="student">Öğrenci</option>
              <option value="instructor">Eğitmen</option>
              <option value="proctor">Gözetmen</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Zaten hesabın var mı? <Link to="/" className="text-indigo-600 hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;