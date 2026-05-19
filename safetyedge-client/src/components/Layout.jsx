import React, { useState } from 'react';
import { MdMenu } from 'react-icons/md';
import Sidebar from './Sidebar';
import '../styles/sidebar.css';
import '../styles/main.css';
import Chatbot from './Chatbot';


export default function Layout({ user, title, children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="layout-root">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onLogout={onLogout}
      />
      <div className={`topbar ${!sidebarOpen ? 'topbar-collapsed' : ''}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <MdMenu />
        </button>
        <span className="topbar-title">{title || 'SafetyEdge'}</span>
        <div className="topbar-right">
  <div className="topbar-avatar">
    <div className="avatar-circle">
      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
    </div>
    <div className="avatar-info">
      <span className="avatar-name">
        {user?.first_name} {user?.last_name}
      </span>
      <span className="avatar-role">
        {user?.role_details?.role_name}
      </span>
    </div>
  </div>
</div>
      </div>
      <main className={`main-content ${!sidebarOpen ? 'main-content-collapsed' : ''}`}>
        <div className="main-inner">
          {children}
        </div>
        <Chatbot user={user} />
      </main>
    </div>
  );
}