import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  MdWarning, MdSecurity, MdError, MdCheckCircle,
  MdAdd, MdSearch, MdClose, MdMoreVert, MdEdit, MdDelete,
  MdMic, MdMicOff, MdAutoAwesome,
  MdAssignment, MdPictureAsPdf, MdGridOn, MdRefresh,
  MdChevronLeft, MdChevronRight, MdImage, MdViewColumn, MdPerson
} from 'react-icons/md';

import '../styles/main.css';
import '../styles/employee-dashboard.css';

const API_BASE = '/server/safetyedge_function';
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  title: '', type: 'incident', severity: 'medium',
  description: '', location: '', incident_date: '', incident_time: '',
};

const ALL_COLUMNS = [
  { key: 'title', label: 'Title', always: true },
  { key: 'images', label: 'Report Images', always: true },  // ← always:true so it can't be hidden
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
  { key: 'created_time', label: 'Date' },
];

export default function EmployeeDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState(['title','type','severity','location','status','images','created_time']);
  const [showCanvas, setShowCanvas] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAll, setDeleteAll] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [injuredPersons, setInjuredPersons] = useState([]);
  const fileInputRef = useRef(null);
  const [dropUp, setDropUp] = useState(false);
  

  // Add inside fetchReports after setReports:
const fetchReports = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/reports?role=employee`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      const mapped = (data.data || []).map(r => r.Reports || r);
      console.log('Sample date:', mapped[0]?.created_time); // ← check format
      setReports(mapped);
    }
  } catch (e) {}
  setLoading(false);
}, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

 // REPLACE the date filter useEffect:
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(reports.filter(r => {
      const matchSearch =
        (r.title||'').toLowerCase().includes(q) ||
        (r.location||'').toLowerCase().includes(q) ||
        (r.type||'').toLowerCase().includes(q) ||
        (r.severity||'').toLowerCase().includes(q) ||
        (r.status||'').toLowerCase().includes(q);

      // ← Extract just the date part "2026-05-08" from "2026-05-08 06:14:05"
      const reportDateStr = r.created_time ? r.created_time.split(' ')[0] : null;

      const matchFrom = !dateFrom || (reportDateStr && reportDateStr >= dateFrom);
      const matchTo   = !dateTo   || (reportDateStr && reportDateStr <= dateTo);

      return matchSearch && matchFrom && matchTo;
    }));
    setPage(1); setSelected([]);
  }, [search, reports, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const allSelected = pageData.length > 0 && pageData.every(r => selected.includes(r.ROWID));
  const toggleSelectAll = () => allSelected
    ? setSelected(selected.filter(id => !pageData.map(r=>r.ROWID).includes(id)))
    : setSelected([...new Set([...selected, ...pageData.map(r=>r.ROWID)])]);
  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  const toggleCol = (key) => setVisibleCols(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev,key]);

  const openAdd = () => {
    setForm(EMPTY_FORM); setImages([]); setEditMode(false); setEditId(null);
    setFormSuccess(''); setFormError(''); setAiResult(''); setShowCanvas(true);
    setInjuredPersons([]);
  };
 // REPLACE openEdit function:
  const openEdit = (r) => {
    setForm({ 
      title: r.title || '', type: r.type || 'incident', severity: r.severity || 'medium',
      description: r.description || '', location: r.location || '',
      incident_date: r.incident_date || '', incident_time: r.incident_time || '' 
    });

    // ← Load existing images
    if (r.photo_url) {
      const existingIds = r.photo_url.split(',').filter(Boolean);
      setImages(existingIds.map(id => ({
        file: null,
        preview: `${API_BASE}/api/file/${id}`,
        name: id,
        existingId: id,
      })));
    } else {
      setImages([]);
    }

    // ← Parse injured persons JSON
    try {
      const persons = r.injured_persons
        ? JSON.parse(r.injured_persons)
        : [];
      setInjuredPersons(Array.isArray(persons) ? persons : []);
    } catch {
      setInjuredPersons([]);
    }

    setEditMode(true); setEditId(r.ROWID);
    setFormSuccess(''); setFormError(''); setAiResult('');
    setShowCanvas(true); setOpenMenu(null);
  };


  const closeCanvas = () => { setShowCanvas(false); setAiResult(''); setFormSuccess(''); setFormError(''); };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) { setFormError('Maximum 5 images allowed.'); return; }
    setImages(prev => [...prev, ...files.map(f => ({ file:f, preview:URL.createObjectURL(f), name:f.name }))]);
    setFormError('');
    e.target.value = '';
  };

  const [removedFileIds, setRemovedFileIds] = useState([]);

 const removeImage = (idx) => {
  const img = images[idx];
  if (img.existingId) {
    // ← Track removed existing images for deletion on save
    setRemovedFileIds(prev => [...prev, img.existingId]);
  }
  setImages(prev => prev.filter((_, i) => i !== idx));
};


// REPLACE uploadImages function:
const uploadImages = async () => {
  const ids = [];
  for (const img of images) {
    if (img.existingId) {
      // ← Already uploaded, just keep the ID
      ids.push(img.existingId);
    } else {
      // ← New file, upload it
      try {
        const fd = new FormData();
        fd.append('file', img.file, img.name);
        const res = await fetch(`${API_BASE}/api/upload`, { 
          method: 'POST', credentials: 'include', body: fd 
        });
        const data = await res.json();
        if (data.fileId) ids.push(data.fileId);
      } catch(e) {}
    }
  }
  return ids.join(',');
};

  const fileToBase64 = (file) => new Promise((res,rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const analyzeWithAI = async () => {
  setAiLoading(true); setAiResult('');
  try {
    const body = { prompt: form.description || form.title || 'analyze incident' };
    // ← Only use image if it's a NEW file (not existing)
    const newImage = images.find(img => img.file !== null);
    if (newImage) {
      body.imageBase64 = await fileToBase64(newImage.file);
      body.imageMimeType = newImage.file.type;
    }
    const res = await fetch(`${API_BASE}/api/ai-fill`, {
      method:'POST', credentials:'include',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.title) {
      setForm(prev => ({
        ...prev,
        title: data.title||prev.title,
        type: data.type||prev.type,
        severity: data.severity||prev.severity,
        description: data.description||prev.description,
      }));
      setAiResult('✓ AI filled the form!');
    } else {
      setAiResult(data.error || 'AI suggestion failed.');
    }
  } catch(e) { setAiResult('AI analysis failed.'); }
  setAiLoading(false);
};

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported. Try Chrome.'); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang='en-US'; rec.continuous=false; rec.interimResults=false;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setForm(prev => ({ ...prev, description: (prev.description?prev.description+' ':'')+t }));
      setRecording(false);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start(); setRecording(true);
  };
  const stopVoice = () => { if (recognitionRef.current) recognitionRef.current.stop(); setRecording(false); };

const handleSubmit = async () => {
  // ← Improved validation
  if (!form.title.trim()) { setFormError('Title is required.'); return; }
  if (!form.location.trim()) { setFormError('Location is required.'); return; }
  if (!form.description.trim()) { setFormError('Description is required.'); return; }

  // ← Validate injured persons
  for (let i = 0; i < injuredPersons.length; i++) {
    if (!injuredPersons[i].name.trim()) {
      setFormError(`Person ${i + 1}: Full name is required.`);
      return;
    }
  }

  setSubmitting(true); setFormError(''); setFormSuccess('');
  try {
    if (removedFileIds.length > 0) {
      for (const fileId of removedFileIds) {
        try {
          await fetch(`${API_BASE}/api/file/${fileId}/delete`, {
            method: 'DELETE', credentials: 'include'
          });
        } catch(e) {}
      }
      setRemovedFileIds([]);
    }

    const photoUrl = images.length > 0 ? await uploadImages() : '';
    const payload = {
      ...form,
      photo_url: photoUrl,
      injured_persons: JSON.stringify(injuredPersons),
    };
    const url = editMode ? `${API_BASE}/api/reports/${editId}` : `${API_BASE}/api/reports`;
    const res = await fetch(url, {
      method: editMode ? 'PUT' : 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setFormSuccess(editMode ? 'Report updated!' : 'Report submitted successfully!');
      setTimeout(() => { closeCanvas(); fetchReports(); }, 1200);
    } else { setFormError(data.error || 'Failed to submit.'); }
  } catch(e) { setFormError('Network error. Try again.'); }
  setSubmitting(false);
};

  const confirmDelete = async () => {
    try {
      for (const id of (deleteAll ? selected : [deleteTarget])) {
        await fetch(`${API_BASE}/api/reports/${id}`, { method:'DELETE', credentials:'include' });
      }
      setSelected([]); fetchReports();
    } catch(e) {}
    setDeleteTarget(null); setDeleteAll(false);
  };

  const exportExcel = () => {
    const csv = [['Title','Type','Severity','Location','Status','Date'],
      ...filtered.map(r=>[r.title,r.type,r.severity,r.location,r.status,r.created_time||''])
    ].map(r=>r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download='reports.csv'; a.click();
  };

  const exportPDF = () => {
    const txt = ['Title\tType\tSeverity\tLocation\tStatus',
      ...filtered.map(r=>`${r.title}\t${r.type}\t${r.severity}\t${r.location}\t${r.status}`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
    a.download='reports.txt'; a.click();
  };

  const getSevClass = (s) => s==='high'?'badge badge-high':s==='medium'?'badge badge-medium':'badge badge-low';
  const getStsClass = (s) => s==='open'?'badge badge-open':s==='in_progress'?'badge badge-in-progress':'badge badge-closed';
  const getTypeLabel = (t) => t==='near_miss'?'Near Miss':t==='hazard'?'Hazard':'Incident';
  const cols = ALL_COLUMNS.filter(c => c.always || visibleCols.includes(c.key));

  return (
    <Layout user={user} title="My Reports">
      <div className="page-header">
        <h1 className="page-title">Reports Incident</h1>
        <p className="page-subtitle">All incidents, near misses and hazards you have reported</p>
      </div>

      {selected.length > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar-text">{selected.length} selected</span>
          <button className="btn btn-danger" onClick={() => setDeleteAll(true)}><MdDelete size={15}/> Delete Selected</button>
          <button className="btn btn-ghost" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      <div className="table-toolbar">
  <div className="table-toolbar-left">
    <div className="search-wrap">
      <MdSearch className="search-icon"/>
      <input className="search-input" placeholder="Search reports..." value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <button className="btn btn-ghost" onClick={fetchReports}><MdRefresh size={16}/></button>
    <div style={{position:'relative'}}>
      <button className="btn btn-ghost" onClick={()=>setShowColMenu(p=>!p)}>
        <MdViewColumn size={16}/> Columns
      </button>
      {showColMenu && (
        <div className="action-dropdown" style={{top:40,left:0,minWidth:160}}>
          {ALL_COLUMNS.filter(c=>!c.always).map(c=>(
            <button key={c.key} className="action-dropdown-item" onClick={()=>toggleCol(c.key)}>
              <span style={{
                width:14,height:14,borderRadius:3,border:'2px solid',display:'inline-block',marginRight:4,flexShrink:0,
                borderColor:visibleCols.includes(c.key)?'var(--blue-brand)':'var(--white-30)',
                background:visibleCols.includes(c.key)?'var(--blue-brand)':'transparent',
              }}/>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* ── Date Filter ── */}
    <div className="date-filter-wrap">
      <span className="date-filter-label">Date:</span>
      <input
        type="date"
        className="date-input"
        value={dateFrom}
        onChange={e => setDateFrom(e.target.value)}
      />
      <span className="date-filter-sep">to</span>
      <input
        type="date"
        className="date-input"
        value={dateTo}
        onChange={e => setDateTo(e.target.value)}
      />
      {(dateFrom || dateTo) && (
        <button className="date-clear-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>
          ✕ Clear
        </button>
      )}
    </div>
  </div>

  <div className="table-toolbar-right">
    <button className="export-btn pdf" onClick={exportPDF}><MdPictureAsPdf size={14}/> PDF</button>
    <button className="export-btn excel" onClick={exportExcel}><MdGridOn size={14}/> Excel</button>
    <button className="btn btn-primary" onClick={openAdd}><MdAdd size={16}/> Add Incident</button>
  </div>
</div>

<div className="table-card">
  <div className="table-wrap">
    {loading ? (
      <div style={{padding:'48px',textAlign:'center',color:'var(--white-30)'}}>Loading reports...</div>
    ) : filtered.length === 0 ? (
      <div className="empty-state">
        <div className="empty-state-icon"><MdAssignment/></div>
        <p className="empty-state-text">No reports found. Add your first incident.</p>
      </div>
    ) : (
      <table className="data-table">
        <thead>
          <tr>
            <th style={{width:40}}><input type="checkbox" className="cb" checked={allSelected} onChange={toggleSelectAll}/></th>
            {cols.map(c=><th key={c.key}>{c.label}</th>)}
            <th style={{width:48}}></th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((r,i)=>(
            <tr key={r.ROWID||i}>
              <td>
            <input
              type="checkbox"
              className="cb"
              checked={selected.includes(r.ROWID)}
              onChange={() => toggleSelect(r.ROWID)}
              disabled={r.status === 'closed' || r.status === 'in_progress'}
              style={{
                opacity: (r.status === 'closed' || r.status === 'in_progress') ? 0.25 : 1,
                cursor: (r.status === 'closed' || r.status === 'in_progress') ? 'not-allowed' : 'pointer',
              }}
            />
          </td>
              {cols.map(c=>(
                <td key={c.key}>
                  {c.key==='title' && <span style={{color:'var(--white)',fontWeight:500}}>{r.title}</span>}
                  {c.key==='type' && getTypeLabel(r.type)}
                  {c.key==='severity' && <span className={getSevClass(r.severity)}>{r.severity}</span>}
                  {c.key==='location' && r.location}
                  {c.key==='status' && <span className={getStsClass(r.status)}>{(r.status||'').replace('_',' ')}</span>}
                  {c.key==='created_time' && (r.created_time ? new Date(r.created_time).toLocaleDateString() : '-')}

                  {/* ── Image Thumbs ── */}
                  {c.key==='images' && (
                    r.photo_url ? (
                      <div className="thumb-stack">
                        {r.photo_url.split(',').filter(Boolean).slice(0,4).map((fileId,idx,arr)=>(
                          <img
                            key={idx}
                            src={`${API_BASE}/api/file/${fileId}`}
                            alt=""
                            className="thumb-img"
                            style={{zIndex: arr.length - idx}}
                            onError={e=>{e.target.style.display='none';}}
                          />
                        ))}
                        {r.photo_url.split(',').filter(Boolean).length > 4 && (
                          <div className="thumb-more">
                            +{r.photo_url.split(',').filter(Boolean).length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="thumb-none">—</span>
                    )
                  )}
                </td>
              ))}
              <td>
                <div className="action-menu-wrap">
                  <button
                    className="three-dot-btn" data-rowid={r.ROWID}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const spaceBelow = window.innerHeight - rect.bottom;
                      setDropUp(spaceBelow < 120); // ← if less than 120px below, open upward
                      setOpenMenu(openMenu === r.ROWID ? null : r.ROWID);
                    }}
                    disabled={r.status === 'closed' || r.status === 'in_progress'}
                    style={{
                      opacity: (r.status === 'closed' || r.status === 'in_progress') ? 0.25 : 1,
                      cursor: (r.status === 'closed' || r.status === 'in_progress') ? 'not-allowed' : 'pointer',
                      pointerEvents: (r.status === 'closed' || r.status === 'in_progress') ? 'none' : 'auto',
                    }}
                  >
                    <MdMoreVert/>
                  </button>
                 {openMenu === r.ROWID && (
                  <div
                    className="action-dropdown"
                    style={{
                      position: 'fixed',
                      top: (() => {
                        const btn = document.querySelector(`[data-rowid="${r.ROWID}"]`);
                        if (btn) {
                          const rect = btn.getBoundingClientRect();
                          const spaceBelow = window.innerHeight - rect.bottom;
                          return spaceBelow < 120 ? rect.top - 80 : rect.bottom + 4;
                        }
                        return 'auto';
                      })(),
                      right: 20,
                      zIndex: 9999,
                    }}
                  >
                    <button className="action-dropdown-item" onClick={() => openEdit(r)}>
                      <MdEdit size={14}/> Edit
                    </button>
                    <button className="action-dropdown-item danger" onClick={() => { setDeleteTarget(r.ROWID); setOpenMenu(null); }}>
                      <MdDelete size={14}/> Delete
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
  {filtered.length > PAGE_SIZE && (
    <div className="pagination">
      <span className="pagination-info">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
      <div className="pagination-btns">
        <button className="page-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}><MdChevronLeft/></button>
        {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
          <button key={p} className={`page-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
        ))}
        <button className="page-btn" onClick={()=>setPage(p=>p+1)} disabled={page===totalPages}><MdChevronRight/></button>
      </div>
    </div>
  )}
</div>

      {showCanvas&&(
        <>
          <div className="offcanvas-overlay" onClick={closeCanvas}/>
          <div className="offcanvas">
            <div className="offcanvas-header">
              <span className="offcanvas-title">{editMode?'Edit Report':'New Report'}</span>
              <button className="offcanvas-close" onClick={closeCanvas}><MdClose/></button>
            </div>
            <div className="offcanvas-body">
              {formSuccess&&<div className="alert alert-success" style={{display:'flex',alignItems:'center',gap:8}}><MdCheckCircle size={16}/>{formSuccess}</div>}
              {formError&&<div className="alert alert-error" style={{display:'flex',alignItems:'center',gap:8}}><MdError size={16}/>{formError}</div>}

              {/* AI + Voice Panel */}
              <div className="ai-panel">
                <div className="ai-panel-header">
                  <span className="ai-panel-title"><MdAutoAwesome size={14}/> AI Assistant</span>
                  <div style={{display:'flex',gap:8}}>
                    <button className={`voice-btn ${recording?'recording':''}`}
                      onClick={recording?stopVoice:startVoice}
                      title={recording?'Stop recording':'Voice → description'}>
                      {recording?<MdMicOff size={15}/>:<MdMic size={15}/>}
                    </button>
                    <button className="ai-analyze-btn" onClick={analyzeWithAI} disabled={aiLoading}>
                      <MdAutoAwesome size={12}/>
                      {aiLoading?'Analyzing...':images.length>0?'Analyze Image':'Suggest'}
                    </button>
                  </div>
                </div>
                {recording&&<p className="ai-result" style={{color:'var(--danger)',marginBottom:4}}>🎙 Listening... speak now</p>}
                {aiResult&&<p className="ai-result">{aiResult}</p>}
                {!aiResult&&!recording&&<p className="ai-result" style={{opacity:0.4}}>Upload image or describe incident → click Suggest. Use mic for voice input.</p>}
              </div>

              {/* Type */}
              <div className="form-group">
                <label className="form-label">Report Type *</label>
                <div className="type-selector">
                  {[{value:'incident',label:'Incident',icon:<MdError/>},{value:'near_miss',label:'Near Miss',icon:<MdWarning/>},{value:'hazard',label:'Hazard',icon:<MdSecurity/>}].map(opt=>(
                    <button key={opt.value} className={`type-btn ${opt.value} ${form.type===opt.value?'active':''}`}
                      onClick={()=>setForm(f=>({...f,type:opt.value}))}>
                      {opt.icon}<span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Brief title of the incident"/>
              </div>

              <div className="form-group">
                <label className="form-label">Severity *</label>
                <div className="severity-selector">
                  {['high','medium','low'].map(s=>(
                    <button key={s} className={`severity-btn ${s} ${form.severity===s?'active':''}`}
                      onClick={()=>setForm(f=>({...f,severity:s}))}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-input" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Ward 3, Dining Room"/>
              </div>

              <div className="form-group">
                <label className="form-label">Incident Date & Time</label>
                <div className="incident-date-row">
                  <input type="date" className="form-input" value={form.incident_date} onChange={e=>setForm(f=>({...f,incident_date:e.target.value}))}/>
                  <input type="time" className="form-input" value={form.incident_time} onChange={e=>setForm(f=>({...f,incident_time:e.target.value}))}/>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe what happened in detail..." rows={4}/>
              </div>

              {/* ── Injured Persons ── */}
              <div className="form-group">
                <div className="subform-header">
                  <MdPerson size={16}/>
                  <label className="form-label" style={{margin:0}}>Injured Persons</label>
                  <span className="subform-optional">optional</span>
                </div>

                {/* Person cards */}
                {injuredPersons.length > 0 && (
                  <div style={{display:'flex', flexDirection:'column', gap:10, marginBottom:10}}>
                    {injuredPersons.map((p, idx) => (
                      <div key={idx} className="subform-body" style={{position:'relative'}}>
                        <button
                          onClick={() => setInjuredPersons(prev => prev.filter((_,i) => i !== idx))}
                          style={{position:'absolute', top:10, right:10, background:'rgba(232,93,74,0.15)', border:'1px solid rgba(232,93,74,0.3)', borderRadius:6, color:'#e85d4a', cursor:'pointer', padding:'3px 7px', fontSize:12, fontFamily:'inherit'}}
                        >
                          <MdClose size={13}/>
                        </button>
                        <div style={{fontSize:12, fontWeight:700, color:'var(--white-50)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em'}}>
                          Person {idx + 1}
                        </div>
                        <div className="subform-row">
                          <div className="form-group" style={{margin:0}}>
                            <label className="form-label">Full Name *</label>
                            <input className="form-input" value={p.name} placeholder="Name"
                              onChange={e => setInjuredPersons(prev => prev.map((x,i) => i===idx ? {...x, name: e.target.value} : x))}/>
                          </div>
                          <div className="form-group" style={{margin:0}}>
                            <label className="form-label">Age</label>
                            <input type="number" className="form-input" value={p.age} placeholder="Age" min={1} max={120}
                              onChange={e => setInjuredPersons(prev => prev.map((x,i) => i===idx ? {...x, age: e.target.value} : x))}/>
                          </div>
                        </div>
                        <div className="form-group" style={{margin:0, marginTop:4}}>
                          <label className="form-label">Gender</label>
                          <div style={{display:'flex', gap:8}}>
                            {['Male','Female','Other'].map(g => (
                              <button key={g} onClick={() => setInjuredPersons(prev => prev.map((x,i) => i===idx ? {...x, gender: g} : x))}
                                style={{flex:1, padding:'8px', borderRadius:8, border:`2px solid ${p.gender===g ? 'var(--blue-brand)' : 'var(--white-10)'}`, background: p.gender===g ? 'rgba(77,166,232,0.12)' : 'transparent', color: p.gender===g ? 'var(--blue-brand)' : 'var(--white-30)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s'}}>
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add button */}
                <button
                  className="btn btn-ghost"
                  style={{width:'100%', justifyContent:'center', borderStyle:'dashed'}}
                  onClick={() => setInjuredPersons(prev => [...prev, { name:'', age:'', gender:'' }])}
                >
                  <MdAdd size={16}/> Add Injured Person
                </button>
              </div>

              {/* Images */}
              <div className="form-group">
                <label className="form-label">Photos ({images.length}/5)</label>
                <div className="img-upload-grid">
                  {images.map((img,idx)=>(
                    <div className="img-thumb" key={idx}>
                      <img src={img.preview} alt={img.name} onError={e=>{e.target.style.display='none';}}/>
                      <button className="img-thumb-remove" onClick={()=>removeImage(idx)}>×</button>
                    </div>
                  ))}
                  {images.length<5&&(
                    <button className="img-upload-btn" onClick={()=>fileInputRef.current?.click()}>
                      <MdImage/><span>Add</span>
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} style={{display:'none'}} accept="image/*" multiple onChange={handleImageSelect}/>
              </div>
            </div>

            <div className="offcanvas-footer">
            <button
                className="btn btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editMode ? 'Update Report' : 'Submit Report'}
              </button>
              <button className="btn btn-ghost" onClick={closeCanvas}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {(deleteTarget||deleteAll)&&(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">Confirm Delete</div>
            <p className="modal-desc">{deleteAll?`Delete ${selected.length} selected reports? This cannot be undone.`:'Delete this report? This cannot be undone.'}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={()=>{setDeleteTarget(null);setDeleteAll(false);}}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}><MdDelete size={15}/> Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
