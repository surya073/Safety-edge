import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  MdDashboard, MdWarning, MdAssignment, MdPeople,
  MdLogout, MdSearch, MdAddCircle, MdDarkMode, MdLightMode,
} from 'react-icons/md';
import '../styles/sidebar.css';
import logo from '../assets/logo.png';

const employeeLinks = [
  { to: '/employee/my-dashboard', icon: <MdDashboard />, label: 'My Dashboard' },
  { to: '/employee/dashboard', icon: <MdAddCircle />, label: 'Report Incident' },
  { to: '/employee/my-reports', icon: <MdAssignment />, label: 'My Reports' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { to: '/admin/reports', icon: <MdWarning />, label: 'All Reports' },
  { to: '/admin/users', icon: <MdPeople />, label: 'Users' },
];

const investigatorLinks = [
  { to: '/investigator/dashboard', icon: <MdSearch />, label: 'Assigned Cases' },
];

export default function Sidebar({ user, isOpen, onToggle, onLogout }) {
  const role = user?.role_details?.role_name || 'employee';

  const links =
    role === 'admin' ? adminLinks :
    role === 'investigator' ? investigatorLinks :
    employeeLinks;

  // ── Theme ──
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-hidden'}`}>

        <div className="sidebar-logo">
          <img src={logo} alt="SafetyEdge" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">SAFETY EDGE</span>
        </div>

        {/* User + Theme Toggle */}
        <div className="sidebar-user">
          <div className="sidebar-user-row">
            <div>
              <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
              <div className={`sidebar-user-role ${role}`}>{role}</div>
            </div>
            <button
              className="theme-toggle"
              onClick={() => setIsDark(p => !p)}
              title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDark ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => { if (window.innerWidth <= 768) onToggle(); }}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-logout" onClick={handleLogout}>
            <MdLogout size={16} />
            Sign out
          </button>
        </div>

      </aside>
    </>
  );
}