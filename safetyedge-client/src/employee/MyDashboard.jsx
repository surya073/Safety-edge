import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  MdWarning, MdSecurity, MdError, MdAssignment,
  MdCheckCircle, MdPending, MdTrendingUp, MdCalendarToday,
  MdLocationOn, MdRefresh,
} from 'react-icons/md';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../styles/main.css';
import '../styles/mydashboard.css';

const API_BASE = '/server/safetyedge_function';

const COLORS = {
  incident: '#e85d4a',
  near_miss: '#f5a623',
  hazard: '#4da6e8',
  high: '#e85d4a',
  medium: '#f5a623',
  low: '#3ecf8e',
  open: '#4da6e8',
  in_progress: '#f5a623',
  closed: '#3ecf8e',
};

export default function MyDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports?role=employee`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const rows = (data.data || []).map(r => r.Reports || r);
        setReports(rows);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Compute stats ──
  const total = reports.length;
  const open = reports.filter(r => r.status === 'open').length;
  const inProgress = reports.filter(r => r.status === 'in_progress').length;
  const closed = reports.filter(r => r.status === 'closed').length;
  const highSeverity = reports.filter(r => r.severity === 'high').length;

  // By type
  const byType = [
    { name: 'Incident', value: reports.filter(r => r.type === 'incident').length, color: COLORS.incident },
    { name: 'Near Miss', value: reports.filter(r => r.type === 'near_miss').length, color: COLORS.near_miss },
    { name: 'Hazard', value: reports.filter(r => r.type === 'hazard').length, color: COLORS.hazard },
  ];

  // By severity
  const bySeverity = [
    { name: 'High', value: reports.filter(r => r.severity === 'high').length, color: COLORS.high },
    { name: 'Medium', value: reports.filter(r => r.severity === 'medium').length, color: COLORS.medium },
    { name: 'Low', value: reports.filter(r => r.severity === 'low').length, color: COLORS.low },
  ];

  // Monthly trend (last 6 months)
  const monthlyTrend = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();
      const count = reports.filter(r => {
        if (!r.created_time) return false;
        const rd = new Date(r.created_time);
        return rd.getMonth() === month && rd.getFullYear() === year;
      }).length;
      months.push({ name: label, Reports: count });
    }
    return months;
  })();

  // Recent 5 reports
  const recent = [...reports]
    .sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
    .slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          <p className="chart-tooltip-value">{payload[0].value} reports</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout user={user} title="My Dashboard">
      {/* ── Greeting ── */}
      <div className="dash-greeting">
        <div>
          <h1 className="dash-greeting-title">
            {greeting()}, {user?.first_name}
          </h1>
          <p className="dash-greeting-sub">
            Here's an overview of your safety reports
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchReports} style={{ alignSelf: 'flex-start' }}>
          <MdRefresh size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--white-30)', padding: '40px 0' }}>Loading dashboard...</div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div className="dash-stats">
            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <div className="dash-stat-icon" style={{ background: 'rgba(77,166,232,0.15)', color: '#4da6e8' }}>
                  <MdAssignment size={22} />
                </div>
                <span className="dash-stat-trend">
                  <MdTrendingUp size={14} /> Total
                </span>
              </div>
              <div className="dash-stat-value">{total}</div>
              <div className="dash-stat-label">Reports Submitted</div>
              <div className="dash-stat-bar" style={{ '--bar-color': '#4da6e8', '--bar-width': '100%' }} />
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <div className="dash-stat-icon" style={{ background: 'rgba(77,166,232,0.15)', color: '#4da6e8' }}>
                  <MdPending size={22} />
                </div>
                <span className="dash-stat-trend" style={{ color: '#4da6e8' }}>Open</span>
              </div>
              <div className="dash-stat-value" style={{ color: '#4da6e8' }}>{open}</div>
              <div className="dash-stat-label">Awaiting Action</div>
              <div className="dash-stat-bar" style={{ '--bar-color': '#4da6e8', '--bar-width': `${total ? (open / total) * 100 : 0}%` }} />
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <div className="dash-stat-icon" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>
                  <MdTrendingUp size={22} />
                </div>
                <span className="dash-stat-trend" style={{ color: '#f5a623' }}>Active</span>
              </div>
              <div className="dash-stat-value" style={{ color: '#f5a623' }}>{inProgress}</div>
              <div className="dash-stat-label">In Progress</div>
              <div className="dash-stat-bar" style={{ '--bar-color': '#f5a623', '--bar-width': `${total ? (inProgress / total) * 100 : 0}%` }} />
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <div className="dash-stat-icon" style={{ background: 'rgba(62,207,142,0.15)', color: '#3ecf8e' }}>
                  <MdCheckCircle size={22} />
                </div>
                <span className="dash-stat-trend" style={{ color: '#3ecf8e' }}>Done</span>
              </div>
              <div className="dash-stat-value" style={{ color: '#3ecf8e' }}>{closed}</div>
              <div className="dash-stat-label">Closed</div>
              <div className="dash-stat-bar" style={{ '--bar-color': '#3ecf8e', '--bar-width': `${total ? (closed / total) * 100 : 0}%` }} />
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-top">
                <div className="dash-stat-icon" style={{ background: 'rgba(232,93,74,0.15)', color: '#e85d4a' }}>
                  <MdError size={22} />
                </div>
                <span className="dash-stat-trend" style={{ color: '#e85d4a' }}>Critical</span>
              </div>
              <div className="dash-stat-value" style={{ color: '#e85d4a' }}>{highSeverity}</div>
              <div className="dash-stat-label">High Severity</div>
              <div className="dash-stat-bar" style={{ '--bar-color': '#e85d4a', '--bar-width': `${total ? (highSeverity / total) * 100 : 0}%` }} />
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="dash-charts">
            {/* Monthly Trend */}
            <div className="dash-chart-card dash-chart-wide">
              <div className="dash-chart-header">
                <span className="dash-chart-title">Monthly Trend</span>
                <span className="dash-chart-sub">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTrend} barSize={24}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Reports" fill="#4da6e8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Type Pie */}
            <div className="dash-chart-card">
              <div className="dash-chart-header">
                <span className="dash-chart-title">By Type</span>
              </div>
              {total === 0 ? (
                <div className="chart-empty">No data yet</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={byType} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    {byType.map((item, i) => (
                      <div className="legend-item" key={i}>
                        <span className="legend-dot" style={{ background: item.color }} />
                        <span className="legend-label">{item.name}</span>
                        <span className="legend-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* By Severity Pie */}
            <div className="dash-chart-card">
              <div className="dash-chart-header">
                <span className="dash-chart-title">By Severity</span>
              </div>
              {total === 0 ? (
                <div className="chart-empty">No data yet</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={bySeverity} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {bySeverity.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    {bySeverity.map((item, i) => (
                      <div className="legend-item" key={i}>
                        <span className="legend-dot" style={{ background: item.color }} />
                        <span className="legend-label">{item.name}</span>
                        <span className="legend-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Recent Reports ── */}
          <div className="dash-recent">
            <div className="dash-chart-header" style={{ marginBottom: 16 }}>
              <span className="dash-chart-title">Recent Reports</span>
              <span className="dash-chart-sub">Your last 5 submissions</span>
            </div>
            {recent.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><MdAssignment /></div>
                <p className="empty-state-text">No reports yet. Start by reporting an incident.</p>
              </div>
            ) : (
              <div className="recent-list">
                {recent.map((r, i) => (
                  <div className="recent-item" key={i}>
                    <div className="recent-icon" style={{
                      background: r.type === 'incident' ? 'rgba(232,93,74,0.15)' : r.type === 'near_miss' ? 'rgba(245,166,35,0.15)' : 'rgba(77,166,232,0.15)',
                      color: r.type === 'incident' ? '#e85d4a' : r.type === 'near_miss' ? '#f5a623' : '#4da6e8',
                    }}>
                      {r.type === 'incident' ? <MdError size={18} /> : r.type === 'near_miss' ? <MdWarning size={18} /> : <MdSecurity size={18} />}
                    </div>
                    <div className="recent-info">
                      <div className="recent-title">{r.title}</div>
                      <div className="recent-meta">
                        <span><MdLocationOn size={12} /> {r.location}</span>
                        <span><MdCalendarToday size={12} /> {r.created_time ? new Date(r.created_time).toLocaleDateString() : '-'}</span>
                      </div>
                    </div>
                    <div className="recent-badges">
                      <span className={`badge ${r.severity === 'high' ? 'badge-high' : r.severity === 'medium' ? 'badge-medium' : 'badge-low'}`}>
                        {r.severity}
                      </span>
                      <span className={`badge ${r.status === 'open' ? 'badge-open' : r.status === 'in_progress' ? 'badge-in-progress' : 'badge-closed'}`}>
                        {(r.status || '').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
