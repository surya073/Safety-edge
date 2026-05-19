import React from 'react';
import {
  MdSecurity,
  MdWarning,
  MdAssessment,
  MdTask,
  MdBarChart,
  MdArrowForward,
  MdLogin,
  MdPersonAdd,
  MdVerifiedUser,
  MdAdminPanelSettings,
  MdSearch,
} from 'react-icons/md';
import '../styles/landing.css';
import logo from '../assets/logo.png';

const CATALYST_LOGIN_URL = '/__catalyst/auth/login';
const CATALYST_SIGNUP_URL = '/__catalyst/auth/signup';

const features = [
  {
    icon: <MdWarning />,
    name: 'Incident Reporting',
    desc: 'Log incidents, near misses, and hazards instantly with severity classification and photo attachments.',
  },
  {
    icon: <MdSecurity />,
    name: 'Hazard Management',
    desc: 'Identify and track workplace hazards before they escalate. Assign corrective actions in real time.',
  },
  {
    icon: <MdSearch />,
    name: 'Investigation Tools',
    desc: 'Conduct root cause analysis, document findings, and close cases with full audit trails.',
  },
  {
    icon: <MdAssessment />,
    name: 'Risk Assessment',
    desc: 'AI-assisted severity scoring helps prioritise high-risk incidents for immediate response.',
  },
  {
    icon: <MdTask />,
    name: 'Task Management',
    desc: 'Assign corrective actions, set deadlines, and track completion across your entire team.',
  },
  {
    icon: <MdBarChart />,
    name: 'Reporting & Analytics',
    desc: 'Visual dashboards and exportable reports keep leadership informed and compliant.',
  },
];

const roles = [
  {
    type: 'employee',
    icon: <MdVerifiedUser />,
    name: 'Employee',
    desc: 'Report incidents and track the status of your own submissions from anywhere.',
    perms: [
      'Submit incident / near miss / hazard',
      'Attach photos and location',
      'Track your report status',
      'Receive notifications',
    ],
  },
  {
    type: 'admin',
    icon: <MdAdminPanelSettings />,
    name: 'Admin',
    desc: 'Full oversight of all reports, users, and analytics across the organisation.',
    perms: [
      'View and manage all reports',
      'Assign cases to investigators',
      'Manage employee accounts',
      'Access analytics & exports',
    ],
  },
  {
    type: 'investigator',
    icon: <MdSearch />,
    name: 'Investigator',
    desc: 'Investigate assigned cases, document root causes, and close corrective actions.',
    perms: [
      'View assigned cases',
      'Submit root cause analysis',
      'Log corrective actions',
      'Update case status',
    ],
  },
];

export default function LandingPage() {

const handleSignIn = () => {
  localStorage.clear();
  window.location.href = CATALYST_LOGIN_URL;
};

const handleSignUp = () => {
  localStorage.clear();
  window.location.href = CATALYST_SIGNUP_URL;
};

  return (
    <div className="landing-root">

      <div className="landing-bg">
        <div className="bg-blob-2" />
      </div>

      <nav className="landing-nav">
        <div className="nav-logo">
          <img src={logo} alt="SafetyEdge logo" className="nav-logo-img" />
          <span className="nav-logo-text">SAFETY EDGE</span>
        </div>
        <span className="nav-badge">Incident Management System</span>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={handleSignIn}>
            <MdLogin size={16} />
            Sign in
          </button>
          <button className="btn btn-primary" onClick={handleSignUp}>
            <MdPersonAdd size={16} />
            Sign up
          </button>
        </div>
      </nav>

      <section className="hero z1">
        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          Aged Care Safety Platform
        </div>

        <div className="hero-logo-wrap">
          <img src={logo} alt="SafetyEdge" className="hero-logo" />
        </div>

        <h1 className="hero-title">
          SAFETY<br />
          <span>EDGE</span>
        </h1>

        <p className="hero-subtitle-line">Incident Management System</p>

        <p className="hero-desc">
          Report incidents, identify hazards, and close investigations faster.
          Built for aged care teams who need clarity when it matters most.
        </p>

        <div className="hero-cta-group">
          <button className="btn-primary-lg btn" onClick={handleSignUp}>
            <MdPersonAdd size={18} />
            Get started free
          </button>
          <span className="hero-divider">or</span>
          <button className="btn-outline-lg" onClick={handleSignIn}>
            <MdLogin size={18} />
            Sign in to your account
          </button>
        </div>
      </section>

      <div className="stats-strip z1">
        <div className="stat-item">
          <div className="stat-number">3</div>
          <div className="stat-label">User Roles</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">AI</div>
          <div className="stat-label">Severity Scoring</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">100%</div>
          <div className="stat-label">Audit Trail</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">Live</div>
          <div className="stat-label">Notifications</div>
        </div>
      </div>

      <section className="features-section z1">
        <p className="section-label">Platform Features</p>
        <h2 className="section-title">Everything your team needs</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.name}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-name">{f.name}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="roles-section z1">
        <p className="section-label">Access Control</p>
        <h2 className="section-title">Three roles, one platform</h2>
        <div className="roles-grid">
          {roles.map((r) => (
            <div className={`role-card ${r.type}`} key={r.type}>
              <div className="role-icon">{r.icon}</div>
              <div className="role-name">{r.name}</div>
              <p className="role-desc">{r.desc}</p>
              <ul className="role-perms">
                {r.perms.map((p) => (
                  <li key={p}>
                    <span className="perm-dot" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section z1">
        <h2 className="cta-title">
          Ready to make your<br />
          workplace <span>safer?</span>
        </h2>
        <p className="cta-desc">
          Join your team on SafetyEdge — sign up in seconds.
        </p>
        <div className="hero-cta-group">
          <button className="btn-primary-lg btn" onClick={handleSignUp}>
            <MdPersonAdd size={18} />
            Create your account
            <MdArrowForward size={16} />
          </button>
          <button className="btn-outline-lg" onClick={handleSignIn}>
            <MdLogin size={18} />
            Already have an account?
          </button>
        </div>
      </section>

      <footer className="landing-footer z1">
        <div className="footer-logo">
          <img src={logo} alt="" />
          SAFETY EDGE
        </div>
        <span>© {new Date().getFullYear()} SafetyEdge. Incident Management System.</span>
        <span>Powered by techie63</span>
      </footer>

    </div>
  );
}