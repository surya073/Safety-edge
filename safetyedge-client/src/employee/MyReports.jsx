import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { MdRefresh, MdAssignment, MdLocationOn, MdAccessTime ,MdError,MdWarning,MdSecurity,MdKeyboardArrowUp,MdKeyboardArrowDown } from 'react-icons/md';
import '../styles/main.css';
import '../styles/my-reports.css';

const API_BASE = '/server/safetyedge_function';

const typeIcon = {
  incident:  <MdError    size={22} color="#e85d4a" />,
  near_miss: <MdWarning  size={22} color="#f5a623" />,
  hazard:    <MdSecurity size={22} color="#4da6e8" />,
};
const typeLabel = { incident: 'Incident', near_miss: 'Near Miss', hazard: 'Hazard' };
const sevColor  = { high: '#e85d4a', medium: '#f5a623', low: '#3ecf8e' };
const statColor = { open: '#4da6e8', in_progress: '#a78bfa', closed: '#3ecf8e' };

function groupByMonthYear(reports) {
  const groups = {};
  reports.forEach(row => {
    const r = row.Reports || row;
    const raw = r.created_time || '';
    const date = raw ? new Date(raw.replace(' ', 'T')) : new Date();
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = { label: key, date, items: [] };
    groups[key].items.push(r);
  });
  return Object.values(groups).sort((a, b) => b.date - a.date);
}

export default function MyReports({ user }) {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchReports = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/reports?role=employee`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setReports(data.data || []);
      else setError(data.error || 'Failed to load');
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const groups = groupByMonthYear(reports);

  return (
    <Layout user={user} title="My Reports">
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">My Reports</h1>
          <p className="page-subtitle">{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchReports}><MdRefresh size={16}/> Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="tl-loading">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdAssignment/></div>
          <p className="empty-state-text">No reports yet. Submit your first report from the dashboard.</p>
        </div>
      ) : (
        <div className="tl-root">
          {groups.map((group, gi) => (
            <div key={gi} className="tl-group">

              {/* Month/Year header */}
              <div className="tl-month-header">
                <div className="tl-month-pill">{group.label}</div>
                <div className="tl-month-line"/>
                <span className="tl-month-count">{group.items.length} report{group.items.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Timeline items */}
              <div className="tl-items">
                {group.items.map((r, ri) => {
                  const isOpen = expanded === `${gi}-${ri}`;
                  const dateObj = r.created_time ? new Date(r.created_time.replace(' ', 'T')) : null;
                  const dayLabel = dateObj
                    ? dateObj.toLocaleDateString('default', { weekday: 'short', day: 'numeric', month: 'short' })
                    : '—';
                  const timeLabel = dateObj
                    ? dateObj.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div key={ri} className="tl-row">
                      {/* Left: date */}
                      <div className="tl-date-col">
                        <span className="tl-day">{dayLabel}</span>
                        <span className="tl-time"><MdAccessTime size={11}/> {timeLabel}</span>
                      </div>

                      {/* Center: dot + line */}
                      <div className="tl-center-col">
                        <div className="tl-dot" style={{ borderColor: sevColor[r.severity] || '#4da6e8' }}>
                          <div className="tl-dot-inner" style={{ background: sevColor[r.severity] || '#4da6e8' }}/>
                        </div>
                        {ri < group.items.length - 1 && <div className="tl-line"/>}
                      </div>

                      {/* Right: card */}
                      <div className={`tl-card ${isOpen ? 'open' : ''}`}
                        onClick={() => setExpanded(isOpen ? null : `${gi}-${ri}`)}>

                        <div className="tl-card-top">
                          <span className="tl-type-icon">{typeIcon[r.type] || '📋'}</span>
                          <div className="tl-card-main">
                            <span className="tl-card-title">{r.title}</span>
                            <span className="tl-card-type">{typeLabel[r.type] || r.type}</span>
                          </div>
                          <div className="tl-badges">
                            <span className="tl-badge" style={{ color: sevColor[r.severity], background: `${sevColor[r.severity]}18` }}>
                              {r.severity?.toUpperCase()}
                            </span>
                            <span className="tl-badge" style={{ color: statColor[r.status] || '#aaa', background: `${statColor[r.status] || '#aaa'}18` }}>
                              {(r.status || '').replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <span className="tl-chevron">
                            {isOpen ? <MdKeyboardArrowUp size={18}/> : <MdKeyboardArrowDown size={18}/>}
                          </span>
                        </div>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div className="tl-card-detail">
                            <div className="tl-detail-row">
                              <MdLocationOn size={13}/> <span>{r.location || '—'}</span>
                            </div>
                            {r.description && (
                              <p className="tl-desc">{r.description}</p>
                            )}
                            {r.incident_date && (
                              <div className="tl-detail-row">
                                <MdAccessTime size={13}/>
                                <span>Incident: {r.incident_date} {r.incident_time && `at ${r.incident_time}`}</span>
                              </div>
                            )}
                            {r.photo_url && (
                              <div className="tl-photos">
                                {r.photo_url.split(',').filter(Boolean).map((id, pi) => (
                                  <img
                                    key={pi}
                                    src={`${API_BASE}/api/file/${id}`}
                                    alt=""
                                    className="tl-photo"
                                    onError={e => { e.target.style.display = 'none'; }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}