import React, { useState, useEffect, useCallback  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  MdArrowBack, MdCheckCircle, MdError, MdAdd,
  MdClose, MdWarning, MdSecurity, MdAutoAwesome,
  MdLocationOn, MdCalendarToday, MdPerson,
} from 'react-icons/md';
import '../styles/main.css';
import '../styles/investigator.css';


const API_BASE = '/server/safetyedge_function';
 
export default function Investigation({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const [report, setReport] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const [form, setForm] = useState({
    root_cause: '',
    corrective_actions: [''],
    status: 'in_progress',
  });
 
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

const [lightboxImg, setLightboxImg] = useState(null);
const [lightboxIndex, setLightboxIndex] = useState(0);
const photoUrls = report?.photo_url?.split(',').filter(Boolean) || [];

 
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes, invRes] = await Promise.all([
        fetch(`${API_BASE}/api/reports/${id}`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/investigations/${id}`, { credentials: 'include' }),
      ]);
      const reportData = await reportRes.json();
      const invData = await invRes.json();
 
      if (reportData.success) setReport(reportData.data);
      if (invData.success && invData.data?.length > 0) {
        const inv = invData.data[0].Investigations || invData.data[0];
        setInvestigation(inv);
        setForm({
          root_cause: inv.root_cause || '',
          corrective_actions: inv.corrective_actions
            ? inv.corrective_actions.split('\n').filter(Boolean)
            : [''],
          status: inv.status || 'in_progress',
        });
      }
    } catch (e) {}
    setLoading(false);
  }, [id]);
 
  useEffect(() => { fetchData(); }, [fetchData]);
 
  const addAction = () => setForm(f => ({ ...f, corrective_actions: [...f.corrective_actions, ''] }));
  const removeAction = (idx) => setForm(f => ({ ...f, corrective_actions: f.corrective_actions.filter((_, i) => i !== idx) }));
  const updateAction = (idx, val) => setForm(f => ({
    ...f,
    corrective_actions: f.corrective_actions.map((a, i) => i === idx ? val : a),
  }));
 
  const aiSuggest = async () => {
    if (!report) return;
    setAiLoading(true);
    try {
      const prompt = `You are a workplace safety investigator. Based on this incident:
Title: ${report.title}
Type: ${report.type}
Severity: ${report.severity}
Location: ${report.location}
Description: ${report.description}
 
Provide:
1. Most likely root cause (2-3 sentences)
2. Three specific corrective actions
 
Return ONLY this JSON:
{"root_cause":"...","corrective_actions":["action 1","action 2","action 3"]}`;
 
      const res = await fetch(`${API_BASE}/api/ai-fill`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.root_cause) {
        setForm(f => ({
          ...f,
          root_cause: data.root_cause,
          corrective_actions: data.corrective_actions || f.corrective_actions,
        }));
      }
    } catch (e) {}
    setAiLoading(false);
  };
 
  const handleSubmit = async () => {
    if (!form.root_cause.trim()) { setError('Root cause is required.'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const payload = {
        report_id: id,
        root_cause: form.root_cause,
        corrective_actions: form.corrective_actions.filter(Boolean).join('\n'),
        status: form.status,
      };
 
      const method = investigation ? 'PUT' : 'POST';
      const url = investigation
        ? `${API_BASE}/api/investigations/${investigation.ROWID}`
        : `${API_BASE}/api/investigations`;
 
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
 
      const data = await res.json();
      if (data.success) {
        // Also update report status
        await fetch(`${API_BASE}/api/reports/${id}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: form.status }),
        });
        setSuccess('Investigation saved successfully!');
        fetchData();
      } else {
        setError(data.error || 'Failed to save.');
      }
    } catch (e) { setError('Network error.'); }
    setSubmitting(false);
  };
 
  const getSevClass = (s) => s === 'high' ? 'badge badge-high' : s === 'medium' ? 'badge badge-medium' : 'badge badge-low';
  const getTypeLabel = (t) => t === 'near_miss' ? 'Near Miss' : t === 'hazard' ? 'Hazard' : 'Incident';
 
  if (loading) return (
    <Layout user={user} title="Investigation">
      <div style={{ color: 'var(--white-30)', padding: '40px 0' }}>Loading case...</div>
    </Layout>
  );
 
  if (!report) return (
    <Layout user={user} title="Investigation">
      <div className="empty-state">
        <div className="empty-state-icon"><MdError /></div>
        <p className="empty-state-text">Report not found.</p>
      </div>
    </Layout>
  );

 
  return (
    <Layout user={user} title="Investigation">
      <button className="back-btn" onClick={() => navigate('/investigator/dashboard')}>
        <MdArrowBack size={16} /> Back to Cases
      </button>
 
      <div className="page-header">
        <h1 className="page-title">Investigation</h1>
        <p className="page-subtitle">Document root cause and corrective actions</p>
      </div>
 
      {/* Report Summary */}
      <div className="report-summary">
        <div className="report-summary-title">{report.title}</div>
        <div className="report-summary-grid">
          <div className="report-summary-item">
            <span className="report-summary-label">Type</span>
            <span className="report-summary-value">{getTypeLabel(report.type)}</span>
          </div>
          <div className="report-summary-item">
            <span className="report-summary-label">Severity</span>
            <span className={getSevClass(report.severity)}>{report.severity}</span>
          </div>
          <div className="report-summary-item">
            <span className="report-summary-label">Location</span>
            <span className="report-summary-value">{report.location}</span>
          </div>
          <div className="report-summary-item">
            <span className="report-summary-label">Reported By</span>
            <span className="report-summary-value">{report.reported_by}</span>
          </div>
          <div className="report-summary-item" style={{ gridColumn: '1 / -1' }}>
            <span className="report-summary-label">Description</span>
            <span className="report-summary-value">{report.description}</span>
          </div>


          

           {/* ← ADD HERE after description */}
     {report.photo_url && (
        <div className="report-summary-item" style={{ gridColumn: '1 / -1' }}>
          <span className="report-summary-label">Photos</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 8 }}>
            {photoUrls.map((fileId, i) => {
              const src = `${API_BASE}/api/file/${fileId.trim()}`;
              return (
                <div
                  key={i}
                  onClick={() => { setLightboxImg(src); setLightboxIndex(i); }}
                  style={{
                    aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
                    border: '1px solid var(--white-10)', background: 'var(--white-5)',
                    cursor: 'zoom-in', transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img
                    src={src} alt={`photo-${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.parentElement.style.display = 'none'; }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Custom Lightbox ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Prev */}
          {photoUrls.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); const prev = (lightboxIndex - 1 + photoUrls.length) % photoUrls.length; setLightboxIndex(prev); setLightboxImg(`${API_BASE}/api/file/${photoUrls[prev].trim()}`); }}
              style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer', borderRadius: 8, padding: '8px 14px' }}
            >‹</button>
          )}

          {/* Image */}
          <img
            src={lightboxImg}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
          />

          {/* Next */}
          {photoUrls.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); const next = (lightboxIndex + 1) % photoUrls.length; setLightboxIndex(next); setLightboxImg(`${API_BASE}/api/file/${photoUrls[next].trim()}`); }}
              style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer', borderRadius: 8, padding: '8px 14px' }}
            >›</button>
          )}

          {/* Close */}
          <button
            onClick={() => setLightboxImg(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', borderRadius: 8, padding: '6px 12px' }}
          >✕</button>

          {/* Counter */}
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            {lightboxIndex + 1} / {photoUrls.length}
          </div>
        </div>
      )}

          {/* ── Injured Persons ── */}
          {(() => {
            try {
              const persons = report.injured_persons
                ? JSON.parse(report.injured_persons)
                : [];
              if (!Array.isArray(persons) || persons.length === 0) return null;
              return (
                <div className="report-summary-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="report-summary-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <MdPerson size={13}/> Injured Persons ({persons.length})
                  </span>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
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
              );
            } catch { return null; }
          })()}


        </div>
      </div>
 
      {/* Investigation Form */}
      <div className="inv-form-card">
        <div className="inv-form-title">Investigation Report</div>
        <div className="inv-form-sub">
          {investigation ? 'Update your investigation findings.' : 'Begin documenting your investigation.'}
        </div>
 
        {success && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <MdCheckCircle size={16} /> {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <MdError size={16} /> {error}
          </div>
        )}
 
        {/* Case Status */}
        <div className="form-group">
          <label className="form-label">Case Status</label>
          <div className="status-steps">
            {[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'closed', label: 'Closed' },
            ].map(s => (
              <button
                key={s.value}
                className={`status-step ${s.value} ${form.status === s.value ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, status: s.value }))}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
 
        {/* AI Suggest */}
        <div className="ai-panel" style={{ marginBottom: 20 }}>
          <div className="ai-panel-header">
            <span className="ai-panel-title"><MdAutoAwesome size={14} /> AI Assistant</span>
            <button className="ai-analyze-btn" onClick={aiSuggest} disabled={aiLoading}>
              <MdAutoAwesome size={12} />
              {aiLoading ? 'Analyzing...' : 'Suggest Root Cause'}
            </button>
          </div>
          <p className="ai-result" style={{ opacity: 0.5 }}>
            Click to get AI-suggested root cause and corrective actions based on the incident details.
          </p>
        </div>
 
        {/* Root Cause */}
        <div className="form-group">
          <label className="form-label">Root Cause Analysis *</label>
          <textarea
            className="form-textarea"
            value={form.root_cause}
            onChange={e => setForm(f => ({ ...f, root_cause: e.target.value }))}
            placeholder="Describe the root cause of this incident..."
            rows={5}
          />
        </div>
 
        {/* Corrective Actions */}
        <div className="form-group">
          <label className="form-label">Corrective Actions</label>
          <div className="actions-list">
            {form.corrective_actions.map((action, idx) => (
              <div className="action-item" key={idx}>
                <input
                  className="form-input"
                  value={action}
                  onChange={e => updateAction(idx, e.target.value)}
                  placeholder={`Action ${idx + 1}...`}
                />
                {form.corrective_actions.length > 1 && (
                  <button className="action-remove" onClick={() => removeAction(idx)}>
                    <MdClose size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="add-action-btn" onClick={addAction}>
            <MdAdd size={14} /> Add Corrective Action
          </button>
        </div>
 
        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
          className="btn btn-primary"
          style={{ 
            flex: 1, 
            justifyContent: 'center', 
            padding: '14px',
            opacity: submitting ? 0.6 : 1,           // ← visual feedback
            cursor: submitting ? 'not-allowed' : 'pointer',  // ← cursor change
          }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving...' : investigation ? 'Update Investigation' : 'Submit Investigation'}
        </button>
        </div>
      </div>
    </Layout>
  );
}