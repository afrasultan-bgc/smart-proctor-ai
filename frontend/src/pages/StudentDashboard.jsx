import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">Öğrenci Paneli</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
          >
            Çıkış Yap
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-2">Atanan Sınavlar</h2>
          <p className="text-gray-500">Henüz atanmış sınav bulunmuyor.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Geçmiş Sınavlar</h2>
          <p className="text-gray-500">Henüz tamamlanmış sınav bulunmuyor.</p>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;