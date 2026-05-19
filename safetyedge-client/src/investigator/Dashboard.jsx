import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  MdWarning, MdSecurity, MdError, MdAssignment,
  MdRefresh, MdSearch, MdLocationOn, MdCalendarToday,
  MdChevronRight, MdPerson,
} from 'react-icons/md';
import '../styles/main.css';
import '../styles/investigator.css';
 
const API_BASE = '/server/safetyedge_function';
 
export default function InvestigatorDashboard({ user }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
 
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const rows = (data.data || []).map(r => r.Reports || r);
        // Show only reports assigned to this investigator
        const myEmail = user?.email_id;
        const assigned = rows.filter(r => r.assigned_to === myEmail);
        setReports(assigned);
      }
    } catch (e) {}
    setLoading(false);
  }, [user]);
 
  useEffect(() => { fetchReports(); }, [fetchReports]);
 
  useEffect(() => {
    const q = search.toLowerCase();
    let result = reports.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q)
    );
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);
    setFiltered(result);
  }, [search, filterStatus, reports]);
 
  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === 'open').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    closed: reports.filter(r => r.status === 'closed').length,
  };
 
  const getTypeIcon = (type) => {
    if (type === 'incident') return <MdError />;
    if (type === 'near_miss') return <MdWarning />;
    return <MdSecurity />;
  };
 
  const getTypeLabel = (t) => t === 'near_miss' ? 'Near Miss' : t === 'hazard' ? 'Hazard' : 'Incident';
  const getSevClass = (s) => s === 'high' ? 'badge badge-high' : s === 'medium' ? 'badge badge-medium' : 'badge badge-low';
  const getStsClass = (s) => s === 'open' ? 'badge badge-open' : s === 'in_progress' ? 'badge badge-in-progress' : 'badge badge-closed';
 
  return (
    <Layout user={user} title="Assigned Cases">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Assigned Cases</h1>
          <p className="page-subtitle">Incidents assigned to you for investigation</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchReports}><MdRefresh size={16} /> Refresh</button>
      </div>
 
      {/* Stats */}
      <div className="inv-stats">
        <div className="inv-stat-card">
          <div className="inv-stat-icon blue"><MdAssignment size={22} /></div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">{stats.total}</span>
            <span className="inv-stat-label">Total Assigned</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon orange"><MdWarning size={22} /></div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">{stats.open + stats.inProgress}</span>
            <span className="inv-stat-label">Pending</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon green"><MdAssignment size={22} /></div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">{stats.closed}</span>
            <span className="inv-stat-label">Closed</span>
          </div>
        </div>
      </div>
 
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="admin-search-wrap" style={{ maxWidth: 280 }}>
          <MdSearch className="admin-search-icon" />
          <input className="admin-search-input" placeholder="Search cases..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>
 
      {/* Cases */}
      {loading ? (
        <div style={{ color: 'var(--white-30)', padding: '40px 0' }}>Loading cases...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdAssignment /></div>
          <p className="empty-state-text">
            {reports.length === 0
              ? 'No cases assigned to you yet. Contact your admin.'
              : 'No cases match your search.'}
          </p>
        </div>
      ) : (
        <div className="case-list">
          {filtered.map((r, i) => (
            <div
              className={`case-card ${r.severity}`}
              key={r.ROWID || i}
              onClick={() => navigate(`/investigator/investigation/${r.ROWID}`)}
            >
              <div className={`case-type-icon ${r.type}`}>
                {getTypeIcon(r.type)}
              </div>
              <div className="case-info">
                <div className="case-title">{r.title}</div>
                <div className="case-meta">
                  <span><MdLocationOn size={12} />{r.location}</span>
                  <span><MdCalendarToday size={12} />{r.created_time ? new Date(r.created_time).toLocaleDateString() : '-'}</span>
                  <span><MdPerson size={12} />{r.reported_by}</span>
                </div>
              </div>
              <div className="case-badges">
                <span className={getSevClass(r.severity)}>{r.severity}</span>
                <span className={getStsClass(r.status)}>{(r.status || '').replace('_', ' ')}</span>
              </div>
              <MdChevronRight className="case-arrow" />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}