import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import StudentExam from './pages/StudentExam';
import ProctorDashboard from './pages/ProctorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/exam" element={<StudentExam />} />
        <Route path="/proctor" element={<ProctorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;