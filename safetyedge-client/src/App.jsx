import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import EmployeeDashboard from './employee/Dashboard';
import MyReports from './employee/MyReports';
import MyDashboard from './employee/MyDashboard';
import AdminDashboard from './admin/Dashboard';
import AdminReports from './admin/Reports';
import AdminUsers from './admin/Users';
import InvestigatorDashboard from './investigator/Dashboard';
import Investigation from './investigator/Investigation';
import logo from './assets/logo.png';
import './styles/main.css';

const API_BASE = '/server/safetyedge_function';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


const handleLogout = () => {
  setUser(null);

  const redirectURL =
    window.location.origin + '/__catalyst/auth/login';

  if (window.catalyst?.auth) {
    window.catalyst.auth.signOut(redirectURL);
  } else {
    window.location.replace('/__catalyst/auth/login');
  }
};


useEffect(() => {
  fetch(`${API_BASE}/api/userinfo`, {
    credentials: 'include',
  })
    .then(async (res) => {

      // User not logged in
      if (res.status === 401) {
        window.location.replace('/__catalyst/auth/login');
        return null;
      }

      return res.json();
    })
    .then((data) => {
      if (data?.user) {
        setUser(data.user);
      }

      setLoading(false);
    })
    .catch(() => {
      window.location.replace('/__catalyst/auth/login');
    });
}, []);

if (loading) {
  return (
    <div className="preloader">
      <div className="preloader-grid" />
      <div className="preloader-blob" />
      <div className="preloader-logo">
        <img src={logo} alt="SafetyEdge" />
      </div>
      <div className="preloader-brand">SAFETY EDGE</div>
      <div className="preloader-sub">Incident Management System</div>
      <div className="preloader-bar-wrap">
        <div className="preloader-bar" />
      </div>
      <div className="preloader-text">Loading...</div>
    </div>
  );
}
  
const role = user?.role_details?.role_name;

return (
  <HashRouter>
    <Routes>
      <Route path="/" element={
        user
          ? role === 'admin' ? <Navigate to="/admin/dashboard" replace />
          : role === 'investigator' ? <Navigate to="/investigator/dashboard" replace />
          : <Navigate to="/employee/my-dashboard" replace />
          : <LandingPage />
      } />

      <Route path="/dashboard" element={
        user
          ? role === 'admin' ? <Navigate to="/admin/dashboard" replace />
          : role === 'investigator' ? <Navigate to="/investigator/dashboard" replace />
          : <Navigate to="/employee/my-dashboard" replace />
          : <Navigate to="/" replace />
      } />

      {/* Employee */}
      <Route path="/employee/my-dashboard" element={
        user ? <MyDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />
      <Route path="/employee/dashboard" element={
        user ? <EmployeeDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />
      <Route path="/employee/my-reports" element={
        user ? <MyReports user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        user && role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />
      <Route path="/admin/reports" element={
        user && role === 'admin' ? <AdminReports user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />
      <Route path="/admin/users" element={
        user && role === 'admin' ? <AdminUsers user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />

      {/* Investigator */}
      <Route path="/investigator/dashboard" element={
        user && role === 'investigator' ? <InvestigatorDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />
      <Route path="/investigator/investigation/:id" element={
        user && role === 'investigator' ? <Investigation user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
      } />
    </Routes>
  </HashRouter>
);
}

export default App;