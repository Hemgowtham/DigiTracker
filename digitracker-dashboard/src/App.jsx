import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

// --- SECURITY GUARD ---
// Checks if you are logged in before letting you see the dashboard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Independent Admin Route (No token required, uses passcode) */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* Protected User Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      
      {/* Default fallback */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;