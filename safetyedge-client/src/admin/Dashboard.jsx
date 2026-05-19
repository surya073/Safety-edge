import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  MdWarning, MdSecurity, MdError, MdAssignment,
  MdPeople, MdBarChart, MdRefresh, MdTrendingUp,
  MdCheckCircle, MdLocationOn, MdCalendarToday,
} from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import '../styles/main.css';
import '../styles/admin.css';
 
const API_BASE = '/server/safetyedge_function';
 
const COLORS = {
  incident: '#e85d4a', near_miss: '#f5a623', hazard: '#4da6e8',
  high: '#e85d4a', medium: '#f5a623', low: '#3ecf8e',
};
 
export default function AdminDashboard({ user,onLogout  }) {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE}/api/analytics`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/reports`, { credentials: 'include' }),
      ]);
      const analyticsData = await analyticsRes.json();
      const reportsData = await reportsRes.json();
      if (analyticsData.success) setAnalytics(analyticsData.data);
      if (reportsData.success) setReports((reportsData.data || []).map(r => r.Reports || r));
    } catch (e) {}
    setLoading(false);
  }, []);
 
  useEffect(() => { fetchData(); }, [fetchData]);
 
  const byType = [
    { name: 'Incident', value: analytics?.by_type?.incident || 0, color: COLORS.incident },
    { name: 'Near Miss', value: analytics?.by_type?.near_miss || 0, color: COLORS.near_miss },
    { name: 'Hazard', value: analytics?.by_type?.hazard || 0, color: COLORS.hazard },
  ];
 
  const bySeverity = [
    { name: 'High', value: analytics?.by_severity?.high || 0, color: COLORS.high },
    { name: 'Medium', value: analytics?.by_severity?.medium || 0, color: COLORS.medium },
    { name: 'Low', value: analytics?.by_severity?.low || 0, color: COLORS.low },
  ];
 
  const monthlyTrend = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short' });
      const count = reports.filter(r => {
        if (!r.created_time) return false;
        const rd = new Date(r.created_time);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      }).length;
      months.push({ name: label, Reports: count });
    }
    return months;
  })();
 
  const recent = [...reports].sort((a, b) => new Date(b.created_time) - new Date(a.created_time)).slice(0, 6);
 
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className="chart-tooltip-value">{payload[0].value} reports</p>
      </div>
    );
    return null;
  };
 
  const getSevClass = (s) => s === 'high' ? 'badge badge-high' : s === 'medium' ? 'badge badge-medium' : 'badge badge-low';
  const getStsClass = (s) => s === 'open' ? 'badge badge-open' : s === 'in_progress' ? 'badge badge-in-progress' : 'badge badge-closed';
  const getTypeLabel = (t) => t === 'near_miss' ? 'Near Miss' : t === 'hazard' ? 'Hazard' : 'Incident';

  const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
 
  return (
    <Layout user={user} onLogout={onLogout} title="Admin Dashboard">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">
              {greeting()}, {user?.first_name}! 👋
            </h1>
            <p className="page-subtitle">
              Here's your organisation-wide safety overview
            </p>
          </div>
        </div>
        </div>
        <button className="btn btn-ghost" onClick={fetchData}><MdRefresh size={16} /> Refresh</button>
      </div>
 
      {loading ? (
        <div style={{ color: 'var(--white-30)', padding: '40px 0' }}>Loading dashboard...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="admin-stats">
            <div className="admin-stat-card blue">
              <div className="admin-stat-icon blue"><MdAssignment size={22} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{analytics?.total || 0}</span>
                <span className="admin-stat-label">Total Reports</span>
              </div>
            </div>
            <div className="admin-stat-card orange">
              <div className="admin-stat-icon orange"><MdTrendingUp size={22} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{analytics?.open || 0}</span>
                <span className="admin-stat-label">Open Reports</span>
              </div>
            </div>
            <div className="admin-stat-card red">
              <div className="admin-stat-icon red"><MdError size={22} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{analytics?.high_severity || 0}</span>
                <span className="admin-stat-label">High Severity</span>
              </div>
            </div>
            <div className="admin-stat-card green">
              <div className="admin-stat-icon green"><MdCheckCircle size={22} /></div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{analytics?.investigations || 0}</span>
                <span className="admin-stat-label">Investigations</span>
              </div>
            </div>
          </div>
 
          {/* Charts */}
          <div className="admin-charts">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <span className="admin-chart-title">Monthly Trend</span>
                <span className="admin-chart-sub">Last 6 months</span>
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
 
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <span className="admin-chart-title">By Type</span>
              </div>
              {analytics?.total === 0 ? <div className="chart-empty">No data</div> : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={byType} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                        {byType.map((e, i) => <Cell key={i} fill={e.color} />)}
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
 
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <span className="admin-chart-title">By Severity</span>
              </div>
              {analytics?.total === 0 ? <div className="chart-empty">No data</div> : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={bySeverity} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                        {bySeverity.map((e, i) => <Cell key={i} fill={e.color} />)}
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
 
          {/* Recent Reports */}
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <span className="admin-chart-title">Recent Reports</span>
              <span className="admin-chart-sub">Latest 6 across all employees</span>
            </div>
            {recent.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><MdAssignment /></div>
                <p className="empty-state-text">No reports submitted yet.</p>
              </div>
            ) : (
              <div className="table-wrap table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Location</th>
                      <th>Reported By</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--white)', fontWeight: 500 }}>{r.title}</td>
                        <td>{getTypeLabel(r.type)}</td>
                        <td><span className={getSevClass(r.severity)}>{r.severity}</span></td>
                        <td>{r.location}</td>
                        <td style={{ color: 'var(--white-70)' }}>{r.reported_by}</td>
                        <td><span className={getStsClass(r.status)}>{(r.status || '').replace('_', ' ')}</span></td>
                        <td>{r.created_time ? new Date(r.created_time).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}