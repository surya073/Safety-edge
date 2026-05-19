import React, { useState, useRef, useEffect } from 'react';
import {
  MdClose, MdSend, MdAutoAwesome,
  MdSmartToy, MdMinimize,
} from 'react-icons/md';
import '../styles/chatbot.css';

const API_BASE = '/server/safetyedge_function';

const getWelcome = (role, name) => {
  const greetings = {
    admin: `Hi ${name}! 👋 I'm your SafetyEdge AI Assistant.

I can help you with:
- Viewing and managing all reports
- Assigning cases to investigators
- Understanding analytics & trends
- Managing user roles
- Safety compliance guidance

How can I assist you today?`,

    investigator: `Hi ${name}! 👋 I'm your SafetyEdge AI Assistant.

I can help you with:
- Investigating assigned cases
- Writing root cause analysis
- Suggesting corrective actions
- WHS investigation guidelines
- Closing and updating cases

How can I assist you today?`,

    employee: `Hi ${name}! 👋 I'm your SafetyEdge AI Assistant.

I can help you with:
- Reporting incidents, near misses & hazards
- Understanding severity levels
- Tracking your report status
- Safety best practices
- Navigating the platform

How can I assist you today?`,
  };
  return greetings[role] || greetings.employee;
};

const getQuickReplies = (role) => {
  const quick = {
    admin: [
      'How do I assign a case to investigator?',
      'How to change a user role?',
      'What does high severity mean?',
      'How to export reports?',
    ],
    investigator: [
      'How do I write a root cause analysis?',
      'What are corrective actions?',
      'How to close a case?',
      'What is the 5 Whys method?',
    ],
    employee: [
      'How do I report an incident?',
      'What is a near miss?',
      'What is high severity?',
      'How to track my report?',
    ],
  };
  return quick[role] || quick.employee;
};

export default function Chatbot({ user }) {
  const role = user?.role_details?.role_name || 'employee';
  const name = user?.first_name || 'there';

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: getWelcome(role, name) },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8),
        }),
      });
      const data = await res.json();
      const replyText = data.reply || 'Sorry, I could not process that. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
      if (!open) setUnread(u => u + 1);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
      }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.startsWith('•') || line.startsWith('-') || line.startsWith('*')
          ? <span className="chat-bullet">{line}</span>
          : line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const roleColor = role === 'admin' ? '#4da6e8' : role === 'investigator' ? '#e85d4a' : '#3ecf8e';
  const roleLabel = role === 'admin' ? 'Admin AI' : role === 'investigator' ? 'Investigator AI' : 'Safety AI';

  return (
    <>
      {open && (
        <div className={`chatbot-window ${minimized ? 'chatbot-minimized' : ''}`}>

          {/* Header */}
          <div className="chatbot-header" style={{
            background: `linear-gradient(135deg, ${roleColor}22, ${roleColor}08)`,
            borderBottom: `1px solid ${roleColor}30`,
          }}>
            <div className="chatbot-header-info">
              <div className="chatbot-avatar" style={{
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
              }}>
                <MdSmartToy size={18} />
              </div>
              <div>
                <div className="chatbot-title">SafetyEdge {roleLabel}</div>
                <div className="chatbot-status">
                  <span className="chatbot-status-dot" style={{ background: roleColor }} />
                  {loading ? 'Thinking...' : 'Online'}
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-icon-btn" onClick={() => setMinimized(p => !p)}>
                <MdMinimize size={16} />
              </button>
              <button className="chatbot-icon-btn" onClick={() => setOpen(false)}>
                <MdClose size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Role badge */}
              <div style={{
                padding: '6px 16px',
                background: `${roleColor}10`,
                borderBottom: `1px solid ${roleColor}15`,
                fontSize: 11,
                color: roleColor,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {role} mode — context-aware assistant
              </div>

              {/* Messages */}
              <div className="chatbot-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-msg-wrap ${msg.role}`}>
                    {msg.role === 'assistant' && (
                      <div className="chat-msg-avatar" style={{
                        background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
                      }}>
                        <MdSmartToy size={14} />
                      </div>
                    )}
                    <div className={`chat-bubble ${msg.role}`} style={
                      msg.role === 'user' ? {
                        background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`,
                      } : {}
                    }>
                      {formatText(msg.text)}
                    </div>
                    {msg.role === 'user' && (
                      <div className="chat-msg-avatar user">
                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="chat-msg-wrap assistant">
                    <div className="chat-msg-avatar" style={{
                      background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
                    }}>
                      <MdSmartToy size={14} />
                    </div>
                    <div className="chat-bubble assistant">
                      <div className="chat-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies — show only on first message */}
              {messages.length <= 1 && (
                <div className="chatbot-quick">
                  {getQuickReplies(role).map((q, i) => (
                    <button
                      key={i}
                      className="chatbot-quick-btn"
                      style={{
                        borderColor: `${roleColor}40`,
                        color: roleColor,
                        background: `${roleColor}0d`,
                      }}
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="chatbot-input-wrap">
                <textarea
                  ref={inputRef}
                  className="chatbot-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={
                    role === 'admin' ? 'Ask about reports, users, analytics...' :
                    role === 'investigator' ? 'Ask about investigations, root cause...' :
                    'Ask about safety reporting...'
                  }
                  rows={1}
                />
                <button
                  className="chatbot-send"
                  style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)` }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                >
                  <MdSend size={16} />
                </button>
              </div>

              <div className="chatbot-footer">
                Powered by SafetyEdge AI • Press Enter to send
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        className={`chatbot-fab ${open ? 'chatbot-fab-open' : ''}`}
        style={!open ? {
          background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`,
          boxShadow: `0 4px 20px ${roleColor}66`,
        } : {}}
        onClick={() => { setOpen(p => !p); setMinimized(false); }}
        title="SafetyEdge AI Assistant"
      >
        {open ? <MdClose size={24} /> : <MdAutoAwesome size={24} />}
        {!open && unread > 0 && (
          <span className="chatbot-badge">{unread}</span>
        )}
      </button>
    </>
  );
}