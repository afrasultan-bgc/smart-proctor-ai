import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      // GEÇİCİ: Backend hazır olunca burası API çağrısı olacak
      let role = '';
      if (email.includes('student')) role = 'student';
      else if (email.includes('proctor')) role = 'proctor';
      else if (email.includes('instructor')) role = 'instructor';
      else {
        setError('Test için: student@test.com, proctor@test.com veya instructor@test.com kullanın');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', 'mock-token-12345');
      localStorage.setItem('role', role);

      if (role === 'student') navigate('/dashboard');
      else if (role === 'instructor') navigate('/instructor');
      else if (role === 'proctor') navigate('/proctor');

    } catch (err) {
      setError('Giriş başarısız!');
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

        <p className="mt-4 text-center text-xs text-gray-400">
          © 2026 Smart Proctor AI
        </p>
      </div>
    </div>
  );
}

export default Login;