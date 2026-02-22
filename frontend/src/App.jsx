import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StudentExam from './pages/StudentExam';
import ProctorDashboard from './pages/ProctorDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

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

        <Route path="/proctor" element={
          <ProtectedRoute allowedRoles={['proctor']}>
            <ProctorDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;