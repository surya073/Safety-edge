import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  MdPeople, MdRefresh, MdSearch, MdAdminPanelSettings,
  MdVerifiedUser, MdSave,
} from 'react-icons/md';
import '../styles/main.css';
import '../styles/admin.css';
 
const API_BASE = '/server/safetyedge_function';
 
export default function AdminUsers({ user }) {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
 
  const fetchUsers = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/users`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      const rows = (data.data || []).map(r => r.Users || r);
      setUsers(rows); // ← show ALL users including self
    }
  } catch (e) {}
  setLoading(false);
}, [user.email_id]);
 
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
 
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    ));
  }, [search, users]);
 
  const handleRoleChange = async (rowId, newRole) => {
    setSaving(rowId);
    try {
      await fetch(`${API_BASE}/api/users/${rowId}/role`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setSuccessMsg('Role updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchUsers();
    } catch (e) {}
    setSaving(null);
  };
 
  // REPLACE stats:
    const stats = {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      employee: users.filter(u => u.role === 'employee').length,
      investigator: users.filter(u => u.role === 'investigator').length,
    };
 
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
    }
    return (email || '?')[0].toUpperCase();
  };
 
  return (
    <Layout user={user} title="User Management">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage roles and access for all users</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchUsers}><MdRefresh size={16} /> Refresh</button>
      </div>
 
      {successMsg && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {successMsg}
        </div>
      )}
 
      {/* Stats */}
      <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="admin-stat-card blue">
          <div className="admin-stat-icon blue"><MdPeople size={22} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats.total}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
        </div>
        <div className="admin-stat-card blue">
          <div className="admin-stat-icon blue"><MdAdminPanelSettings size={22} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats.admin}</span>
            <span className="admin-stat-label">Admins</span>
          </div>
        </div>
        <div className="admin-stat-card green">
          <div className="admin-stat-icon green"><MdVerifiedUser size={22} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats.employee}</span>
            <span className="admin-stat-label">Employees</span>
          </div>
        </div>
        <div className="admin-stat-card red">
          <div className="admin-stat-icon red"><MdSearch size={22} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats.investigator}</span>
            <span className="admin-stat-label">Investigators</span>
          </div>
        </div>
      </div>
 
      {/* Search */}
      <div className="admin-toolbar" style={{ marginBottom: 16, padding: 0, border: 'none', background: 'transparent' }}>
        <div className="admin-toolbar-left">
          <div className="admin-search-wrap">
            <MdSearch className="admin-search-icon" />
            <input className="admin-search-input" placeholder="Search users..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>
 
      {/* Users Grid */}
      {loading ? (
        <div style={{ color: 'var(--white-30)', padding: '40px 0' }}>Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdPeople /></div>
          <p className="empty-state-text">No users found.</p>
        </div>
      ) : (
        <div className="users-grid">
          {filtered.map((u, i) => {
              const isSelf = u.email === user.email_id; // ← compare with email_id
              return (
                <div className="user-card" key={u.ROWID || i}>
                  <div className="user-avatar">
                    {isSelf ? '👤' : getInitials(u.name, u.email)}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {isSelf ? 'You' : (u.name || 'Unknown')} {/* ← show You */}
                    </div>
                    <div className="user-email">{u.email}</div>
                    <span className={`user-role-badge ${u.role || 'employee'}`}>
                      {u.role || 'employee'}
                    </span>
                  </div>
                  <div className="user-actions">
                    {isSelf ? (
                      // ← No dropdown for self
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--white-30)',
                        padding: '6px 12px', borderRadius: 8,
                        border: '1px solid var(--white-10)',
                        background: 'transparent',
                      }}>
                        You
                      </span>
                    ) : (
                      <>
                        <select
                          className="role-select"
                          value={u.role || 'employee'}
                          onChange={e => handleRoleChange(u.ROWID, e.target.value)}
                          disabled={saving === u.ROWID}
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                          <option value="investigator">Investigator</option>
                        </select>
                        {saving === u.ROWID && (
                          <span style={{ fontSize: 12, color: 'var(--blue-brand)' }}>Saving...</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Layout>
  );
}