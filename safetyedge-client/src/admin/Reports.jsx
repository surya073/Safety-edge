    import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  MdSearch, MdRefresh, MdMoreVert, MdAssignment,
  MdClose, MdPerson, MdPictureAsPdf, MdGridOn,
  MdChevronLeft, MdChevronRight, MdVisibility,
  MdCheckCircle, MdDelete,
} from 'react-icons/md';
import '../styles/main.css';
import '../styles/admin.css';
 
const API_BASE = '/server/safetyedge_function';
const PAGE_SIZE = 10;
 
export default function AdminReports({ user }) {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [investigators, setInvestigators] = useState([]);
  const [invDetail, setInvDetail] = useState(null);
  const [invLoading, setInvLoading] = useState(false);
  const [menuPos, setMenuPos] = useState({ rowId: null, dropUp: false });
 
  // Detail offcanvas
  const [detailReport, setDetailReport] = useState(null);
 
  // Assign modal
  const [assignReport, setAssignReport] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
 
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setReports((data.data || []).map(r => r.Reports || r));
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
  fetch(`${API_BASE}/api/users`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const invs = data.data.filter(u => u.role === 'investigator');
        setInvestigators(invs);
      }
    })
    .catch(() => {});
}, []);

const viewInvestigation = async (reportId) => {
  setInvLoading(true);
  setInvDetail(null);
  try {
    const res = await fetch(`${API_BASE}/api/investigations/${reportId}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success && data.data?.length > 0) {
      setInvDetail(data.data[0].Investigations || data.data[0]);
    } else {
      setInvDetail({ empty: true });
    }
  } catch (e) {}
  setInvLoading(false);
};
 
  useEffect(() => { fetchReports(); }, [fetchReports]);
 
  useEffect(() => {
    const q = search.toLowerCase();
    let result = reports.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q) ||
      (r.reported_by || '').toLowerCase().includes(q)
    );
    if (filterType !== 'all') result = result.filter(r => r.type === filterType);
    if (filterSeverity !== 'all') result = result.filter(r => r.severity === filterSeverity);
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);
    setFiltered(result);
    setPage(1);
    setSelected([]);
  }, [search, filterType, filterSeverity, filterStatus, reports]);

  useEffect(() => {
  const close = () => setOpenMenu(null);
  document.addEventListener('click', close);
  return () => document.removeEventListener('click', close);
  }, []);
 
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = pageData.length > 0 && pageData.every(r => selected.includes(r.ROWID));
  const toggleSelectAll = () => allSelected
    ? setSelected(selected.filter(id => !pageData.map(r => r.ROWID).includes(id)))
    : setSelected([...new Set([...selected, ...pageData.map(r => r.ROWID)])]);
  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
 
  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE}/api/reports/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchReports();
    } catch (e) {}
    setOpenMenu(null);
  };
 
  const handleAssign = async () => {
    if (!assignEmail) return;
    setAssigning(true);
    try {
      await fetch(`${API_BASE}/api/reports/${assignReport.ROWID}/assign`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignEmail }),
      });
      setAssignReport(null);
      setAssignEmail('');
      fetchReports();
    } catch (e) {}
    setAssigning(false);
  };
 
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await fetch(`${API_BASE}/api/reports/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchReports();
    } catch (e) {}
    setOpenMenu(null);
  };
 
  const exportExcel = () => {
    const csv = [['Title', 'Type', 'Severity', 'Location', 'Reported By', 'Status', 'Date'],
      ...filtered.map(r => [r.title, r.type, r.severity, r.location, r.reported_by, r.status, r.created_time || ''])
    ].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'all-reports.csv'; a.click();
  };
 
  const exportPDF = () => {
    const txt = ['Title\tType\tSeverity\tLocation\tReported By\tStatus',
      ...filtered.map(r => `${r.title}\t${r.type}\t${r.severity}\t${r.location}\t${r.reported_by}\t${r.status}`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = 'all-reports.txt'; a.click();
  };
 
  const getSevClass = (s) => s === 'high' ? 'badge badge-high' : s === 'medium' ? 'badge badge-medium' : 'badge badge-low';
  const getStsClass = (s) => s === 'open' ? 'badge badge-open' : s === 'in_progress' ? 'badge badge-in-progress' : 'badge badge-closed';
  const getTypeLabel = (t) => t === 'near_miss' ? 'Near Miss' : t === 'hazard' ? 'Hazard' : 'Incident';
 
  return (
    <Layout user={user} title="All Reports">
      <div className="page-header">
        <h1 className="page-title">All Reports</h1>
        <p className="page-subtitle">Manage and investigate all submitted reports</p>
      </div>
 
      {selected.length > 0 && (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-text">{selected.length} selected</span>
          <button className="btn btn-ghost" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}
 
      <div className="admin-table-card">
        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-toolbar-left">
            <div className="admin-search-wrap">
              <MdSearch className="admin-search-icon" />
              <input className="admin-search-input" placeholder="Search reports..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="admin-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="incident">Incident</option>
              <option value="near_miss">Near Miss</option>
              <option value="hazard">Hazard</option>
            </select>
            <select className="admin-filter-select" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="admin-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
            <button className="btn btn-ghost" onClick={fetchReports}><MdRefresh size={16} /></button>
          </div>
          <div className="admin-toolbar-right">
            <button className="export-btn pdf" onClick={exportPDF}><MdPictureAsPdf size={14} /> PDF</button>
            <button className="export-btn excel" onClick={exportExcel}><MdGridOn size={14} /> Excel</button>
          </div>
        </div>
 
        {/* Table */}
        <div className="table-wrap table-responsive">
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--white-30)' }}>Loading reports...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MdAssignment /></div>
              <p className="empty-state-text">No reports found.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" className="cb" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Location</th>
                  <th>Reported By</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r, i) => (
                  <tr key={r.ROWID || i}>
                    <td><input type="checkbox" className="cb" checked={selected.includes(r.ROWID)} onChange={() => toggleSelect(r.ROWID)} /></td>
                    <td style={{ color: 'var(--white)', fontWeight: 500, cursor: 'pointer' }} onClick={() => setDetailReport(r)}>{r.title}</td>
                    <td>{getTypeLabel(r.type)}</td>
                    <td><span className={getSevClass(r.severity)}>{r.severity}</span></td>
                    <td>{r.location}</td>
                    <td style={{ color: 'var(--white-70)', fontSize: 12 }}>{r.reported_by}</td>
                    <td style={{ fontSize: 12 }}>
                      {r.assigned_to
                        ? <span style={{ color: 'var(--blue-brand)' }}>{r.assigned_to}</span>
                        : <span style={{ color: 'var(--white-30)' }}>Unassigned</span>}
                    </td>
                    <td>
                    <span
                    className={getStsClass(r.status)}
                    style={{ cursor: r.status === 'in_progress' || r.status === 'closed' ? 'pointer' : 'default' }}
                    onClick={() => {
                    if (r.status === 'in_progress' || r.status === 'closed') {
                    viewInvestigation(r.ROWID);
                    }
                    }}
                    title={r.status === 'in_progress' || r.status === 'closed' ? 'View investigation' : ''}
                    >
                    {(r.status || '').replace('_', ' ')}
                    </span>
                    </td>
                    <td>{r.created_time ? new Date(r.created_time).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="action-menu-wrap">
                        <button
                          className="three-dot-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            setMenuPos({ rowId: r.ROWID, dropUp: spaceBelow < 100 });
                            setOpenMenu(openMenu === r.ROWID ? null : r.ROWID);
                          }}
                        >
                          <MdMoreVert />
                        </button>
                        {openMenu === r.ROWID && (
                          <div
                            className={`action-dropdown ${menuPos.dropUp ? 'drop-up' : 'drop-down'}`}
                            onClick={e => e.stopPropagation()}
                          >
                            <button className="action-dropdown-item" onClick={() => { setDetailReport(r); setOpenMenu(null); }}>
                              <MdVisibility size={14} /> View Details
                            </button>
                            <button className="action-dropdown-item warning" onClick={() => { setAssignReport(r); setOpenMenu(null); }}>
                              <MdPerson size={14} /> Assign
                            </button>
                            <button className="action-dropdown-item success" onClick={() => updateStatus(r.ROWID, 'closed')}>
                              <MdCheckCircle size={14} /> Mark Closed
                            </button>
                            <button className="action-dropdown-item" onClick={() => updateStatus(r.ROWID, 'in_progress')}>
                              Mark In Progress
                            </button>
                            <button className="action-dropdown-item danger" onClick={() => handleDelete(r.ROWID)}>
                              <MdDelete size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
 
        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="admin-pagination">
            <span className="admin-pagination-info">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="pagination-btns">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}><MdChevronLeft /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><MdChevronRight /></button>
            </div>
          </div>
        )}
      </div>
 
      {/* Detail Offcanvas */}
      {detailReport && (
        <>
          <div className="assign-modal-overlay" onClick={() => setDetailReport(null)} />
          <div className="detail-offcanvas">
            <div className="detail-header">
              <span className="detail-title">Report Details</span>
              <button className="offcanvas-close" onClick={() => setDetailReport(null)}><MdClose /></button>
            </div>
            <div className="detail-body">
              <div className="detail-field">
                <div className="detail-field-label">Title</div>
                <div className="detail-field-value white">{detailReport.title}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="detail-field">
                  <div className="detail-field-label">Type</div>
                  <div className="detail-field-value">{getTypeLabel(detailReport.type)}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Severity</div>
                  <span className={getSevClass(detailReport.severity)}>{detailReport.severity}</span>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Status</div>
                  <span className={getStsClass(detailReport.status)}>{(detailReport.status || '').replace('_', ' ')}</span>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Location</div>
                  <div className="detail-field-value">{detailReport.location}</div>
                </div>
              </div>
              <div className="detail-divider" />
              <div className="detail-field">
                <div className="detail-field-label">Description</div>
                <div className="detail-field-value">{detailReport.description}</div>
              </div>
              <div className="detail-divider" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="detail-field">
                  <div className="detail-field-label">Reported By</div>
                  <div className="detail-field-value">{detailReport.reported_by}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Assigned To</div>
                  <div className="detail-field-value">{detailReport.assigned_to || 'Unassigned'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Incident Date</div>
                  <div className="detail-field-value">{detailReport.incident_date || '-'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Incident Time</div>
                  <div className="detail-field-value">{detailReport.incident_time || '-'}</div>
                </div>
              </div>
              {detailReport.photo_url && (
                <>
                  <div className="detail-divider" />
                  <div className="detail-field">
                    <div className="detail-field-label">Photos</div>
                    <div className="detail-images">
                      {detailReport.photo_url.split(',').map((id, i) => (
                        <div className="detail-img" key={i}>
                          <img
                            src={`${API_BASE}/api/file/${id}`}
                            alt={`photo-${i}`}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Injured Persons ── */}
              {(() => {
                try {
                  const persons = detailReport.injured_persons
                    ? JSON.parse(detailReport.injured_persons)
                    : [];
                  if (!Array.isArray(persons) || persons.length === 0) return null;
                  return (
                    <>
                      <div className="detail-divider" />
                      <div className="detail-field">
                        <div className="detail-field-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <MdPerson size={13}/> Injured Persons ({persons.length})
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10 }}>
                          {persons.map((p, i) => (
                            <div key={i} style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--white-10)',
                              borderRadius: 10,
                              padding: '12px 14px',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: 12,
                            }}>
                              <div>
                                <div style={{ fontSize:10, fontWeight:700, color:'var(--white-30)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Name</div>
                                <div style={{ fontSize:13, fontWeight:600, color:'var(--white)' }}>{p.name || '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize:10, fontWeight:700, color:'var(--white-30)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Age</div>
                                <div style={{ fontSize:13, color:'var(--white-70)' }}>{p.age || '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize:10, fontWeight:700, color:'var(--white-30)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Gender</div>
                                <div style={{ fontSize:13, color:'var(--white-70)' }}>{p.gender || '—'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                } catch { return null; }
              })()}
            </div>
            <div className="detail-footer">
             <button
              className="btn btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                opacity: (detailReport?.status === 'closed') ? 0.5 : 1,
                cursor: (detailReport?.status === 'closed') ? 'not-allowed' : 'pointer',
              }}
              disabled={detailReport?.status === 'closed'}
              onClick={() => { setAssignReport(detailReport); setDetailReport(null); }}
            >
              <MdPerson size={15} /> Assign to Investigator
            </button>
              <button className="btn btn-ghost" onClick={() => setDetailReport(null)}>Close</button>
            </div>
          </div>
        </>
      )}
 
      {/* Assign Modal */}
      {assignReport && (
        <div className="assign-modal-overlay">
          <div className="assign-modal">
            <div className="assign-modal-title">Assign to Investigator</div>
            <p className="assign-modal-sub">Report: {assignReport.title}</p>
            <div className="form-group">
              <label className="form-label">Investigator Email</label>
              <input className="form-input" value={assignEmail}
                onChange={e => setAssignEmail(e.target.value)}
                placeholder="investigator@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Or select from list</label>
              <select className="form-select" value={assignEmail} onChange={e => setAssignEmail(e.target.value)}>
              <option value="">Select investigator...</option>
              {investigators.map((inv, i) => (
              <option key={i} value={inv.email}>{inv.name} — {inv.email}</option>
              ))}
              </select>
            </div>
            <div className="assign-modal-actions">
              <button className="btn btn-ghost" onClick={() => { setAssignReport(null); setAssignEmail(''); }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={assigning || !assignEmail}
                style={{
                  opacity: (assigning || !assignEmail) ? 0.6 : 1,
                  cursor: (assigning || !assignEmail) ? 'not-allowed' : 'pointer',
                }}
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}


          {(invDetail || invLoading) && (
      <div className="inv-detail-overlay" onClick={() => setInvDetail(null)}>
        <div className="inv-detail-modal" onClick={e => e.stopPropagation()}>

          <div className="inv-detail-header">
            <div className="inv-detail-title">Investigation Report</div>
            <button className="offcanvas-close" onClick={() => setInvDetail(null)}>
              <MdClose />
            </button>
          </div>

          {invLoading ? (
            <div className="inv-loading">Loading investigation...</div>
          ) : invDetail?.empty ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon"><MdAssignment /></div>
              <p className="empty-state-text">No investigation submitted yet.</p>
            </div>
          ) : (
            <>
              {/* Status Bar */}
              <div className="inv-status-bar">
                {['open', 'in_progress', 'closed'].map(s => (
                  <div
                    key={s}
                    className={`inv-status-item ${invDetail?.status === s ? `active ${s}` : ''}`}
                  >
                    {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>

              {/* Investigator */}
              <div className="inv-section-label">Investigator</div>
              <div className="inv-investigator">
                <div className="inv-investigator-avatar">
                <MdPerson size={18} />
                </div>
                <div>
                  <div className="inv-investigator-email">{invDetail?.investigator || '-'}</div>
                  <div className="inv-investigator-label">Investigation Officer</div>
                </div>
              </div>

              {/* Root Cause */}
              <div className="inv-section-label">Root Cause Analysis</div>
              <div className="inv-root-cause-box">
                {invDetail?.root_cause || 'Not provided'}
              </div>

              {/* Corrective Actions */}
              <div className="inv-section-label">Corrective Actions</div>
              <div className="inv-actions-list">
                {(invDetail?.corrective_actions || '').split('\n').filter(Boolean).length > 0
                  ? (invDetail?.corrective_actions || '').split('\n').filter(Boolean).map((action, i) => (
                    <div className="inv-action-item" key={i}>
                      <span className="inv-action-num">{i + 1}</span>
                      <span className="inv-action-text">{action}</span>
                    </div>
                  ))
                  : <div className="inv-empty-actions">No corrective actions listed.</div>
                }
              </div>

              {/* Updated time */}
              <div className="inv-updated-time">
                Last updated: {invDetail?.updated_time ? new Date(invDetail.updated_time).toLocaleString() : '-'}
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </Layout>
  );
}