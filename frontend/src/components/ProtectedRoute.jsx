import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Token yoksa login'e yönlendir
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Rol yetkisi yoksa login'e yönlendir
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;