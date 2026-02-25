import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Eğer api/axios dosyası ayarlıysa onu kullanırız ama şimdilik standart fetch veya importlu axios kullanabiliriz.
// Zeynep'in import ettiği api'yi kullanıyoruz.
import api from '../api/axios'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. FastAPI'nin beklediği formatta (Form Data) veriyi hazırlıyoruz
      const formData = new URLSearchParams();
      formData.append('username', email); // FastAPI e-postayı username olarak bekler
      formData.append('password', password);

      // 2. Senin Backend'ine gerçek isteği atıyoruz
      const response = await api.post('http://localhost:8000/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // 3. Backend'den gelen Token'ı ve bilgileri alıyoruz
      const data = response.data;
      
      // Token'ı tarayıcıya (Local Storage) kaydediyoruz
      localStorage.setItem('token', data.access_token);
      
      // Şimdilik rolleri backend'den almadığımız için geçici bir yönlendirme yapıyoruz
      // (İleride backend'den kullanıcının rolü gelince burayı güncelleyeceğiz)
      if (email.includes('instructor')) {
        navigate('/instructor');
      } else if (email.includes('proctor')) {
        navigate('/proctor');
      } else {
        navigate('/dashboard'); // Standart öğrenci/kullanıcı girişi
      }

    } catch (err) {
      // Backend'den gelen 401 veya 403 hatasını (Yanlış şifre vb.) yakalayıp ekrana basıyoruz
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Giriş başarısız! Sunucuya bağlanılamadı.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-2">Smart Proctor</h2>
        <p className="text-center text-gray-500 mb-6">Güvenli Sınav Sistemi</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ornek@univ.edu.tr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Hesabın yok mu? <Link to="/register" className="text-indigo-600 hover:underline">Kayıt Ol</Link>
          <br/>© 2026 Smart Proctor AI
        </p>
      </div>
    </div>
  );
}

export default Login;