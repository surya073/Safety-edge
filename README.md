# 🛡️ SafetyEdge — Incident Management System

<div align="center">

![SafetyEdge](https://img.shields.io/badge/SafetyEdge-IMS-4da6e8?style=for-the-badge&logo=shield&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Zoho Catalyst](https://img.shields.io/badge/Zoho-Catalyst-E42527?style=for-the-badge&logo=zoho&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A full-stack AI-powered workplace safety incident management platform built for aged care facilities.**

[🌐 Live Demo](https://safetyedge-60069659585.development.catalystserverless.in/app/) • [🐛 Report Bug](https://github.com/yourusername/safety-edge/issues) • [✨ Request Feature](https://github.com/yourusername/safety-edge/issues)

</div>

---

## 📸 Screenshots

| Login Page | Employee Dashboard | Admin Dashboard |
|---|---|---|
| <img width="1238" height="785" alt="Screenshot 2026-05-18 174826" src="https://github.com/user-attachments/assets/7b19744d-50fc-4a31-8acb-3172d675a2b7" />|
| <img width="1864" height="887" alt="Screenshot 2026-05-18 175802" src="https://github.com/user-attachments/assets/6b2625e6-1034-4852-a55e-7f30a73fe2d5" />
 | ![Admin](https://via.placeholder.com/280x160/0a1628/4da6e8?text=Admin+Panel) |

| Report Incident | Investigation | AI Chatbot |
|---|---|---|
| ![Report](https://via.placeholder.com/280x160/0a1628/f5a623?text=Report+Form) | ![Investigation](https://via.placeholder.com/280x160/0a1628/e85d4a?text=Investigation) | ![Chatbot](https://via.placeholder.com/280x160/0a1628/4da6e8?text=AI+Chatbot) |

---

## ✨ Features

### 🏢 Three Role Panels
| Role | Capabilities |
|------|-------------|
| 👷 **Employee** | Submit incidents, near misses & hazards · Track report status · View personal dashboard |
| 🔧 **Admin** | Full report management · Assign investigators · User role management · Analytics & charts |
| 🔍 **Investigator** | View assigned cases · Root cause analysis · Corrective actions · Case status updates |

### 🤖 AI-Powered Features
- **Groq AI Chatbot** — Role-aware safety assistant available across all panels
- **AI Form Fill** — Auto-suggest incident title, type, severity and description
- **AI Investigation** — Suggest root cause and corrective actions from incident details
- **Voice Input** — Speak to fill the description field

### 📊 Analytics & Reporting
- Real-time dashboard with charts (bar, pie) using Recharts
- Monthly trend analysis
- Reports by type and severity breakdown
- Export to CSV / PDF

### 📧 Email Notifications
- Report submitted → notify employee + all admins
- Case assigned → notify investigator
- Investigation updated → notify admin + reporter

### 🎨 UI/UX
- Dark / Light theme toggle
- Mobile-responsive sidebar with hamburger toggle
- Offcanvas report form (slide-in)
- GLightbox photo viewer
- Animated preloader
- Corporate-grade design system

---

## 🛠️ Tech Stack

**Frontend**
- React 18 (Create React App)
- React Router DOM v6 (HashRouter)
- Recharts (analytics charts)
- React Icons (MD icons)
- GLightbox (photo lightbox)
- External CSS only (no CSS-in-JS)

**Backend**
- Node.js 18 + Express
- Zoho Catalyst Cloud Functions
- Zoho Catalyst DataStore (4 tables)
- Zoho Catalyst File Store (image upload)
- Zoho Catalyst Auth (hosted authentication)

**AI**
- Groq API (LLaMA 3.1 8B Instant) — chatbot + form fill
- Google Gemini API — image analysis

**Email**
- Zoho Catalyst Mail (SMTP via Gmail)

---

## 🗄️ Database Schema

```
Reports         — title, type, severity, description, location, status,
                  reported_by, assigned_to, photo_url, incident_date,
                  incident_time, injured_persons

Investigations  — report_id, root_cause, corrective_actions,
                  investigator, status, updated_time

Users           — user_id, name, email, role, status

Notifications   — user_id, message, report_id, is_read, created_time
```

---

## 🚀 Getting Started

### Prerequisites
```bash
node -v    # v18.x
npm -v     # 10.x
catalyst -v # 1.25.x
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/safety-edge.git
cd safety-edge

# 2. Install Catalyst CLI
npm install -g zcatalyst-cli

# 3. Login to Catalyst
catalyst login

# 4. Install function dependencies
cd functions/safetyedge_function
npm install

# 5. Install frontend dependencies
cd ../../safetyedge-client
npm install

# 6. Deploy
cd ..
catalyst deploy
```

### Environment Setup

Add your API keys in `functions/safetyedge_function/index.js`:

```js
const GROQ_API_KEY = 'your_groq_api_key';      // console.groq.com
const GEMINI_API_KEY = 'your_gemini_api_key';   // aistudio.google.com
```

Configure SMTP in Catalyst Console:
```
Console → Email → SMTP Configuration
Host: smtp.gmail.com | Port: 465 | Security: SSL
```

---

## 📁 Project Structure

```
safety-edge/
├── functions/
│   └── safetyedge_function/
│       └── index.js              ← All API routes (Express)
├── safetyedge-client/
│   └── src/
│       ├── App.js                ← Role-based routing
│       ├── assets/
│       │   └── logo.png
│       ├── pages/
│       │   └── LandingPage.jsx   ← Public landing page
│       ├── components/
│       │   ├── Layout.jsx        ← Shared layout wrapper
│       │   ├── Sidebar.jsx       ← Navigation + theme toggle
│       │   └── Chatbot.jsx       ← AI chatbot (Groq)
│       ├── employee/
│       │   ├── MyDashboard.jsx   ← Charts & stats
│       │   ├── Dashboard.jsx     ← Report incident + table
│       │   └── MyReports.jsx     ← View own reports
│       ├── admin/
│       │   ├── Dashboard.jsx     ← Analytics overview
│       │   ├── Reports.jsx       ← All reports management
│       │   └── Users.jsx         ← User role management
│       ├── investigator/
│       │   ├── Dashboard.jsx     ← Assigned cases
│       │   └── Investigation.jsx ← Root cause + actions
│       └── styles/
│           ├── main.css
│           ├── sidebar.css
│           ├── landing.css
│           ├── admin.css
│           ├── investigator.css
│           ├── employee-dashboard.css
│           ├── mydashboard.css
│           └── chatbot.css
└── catalyst.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/userinfo` | Get current user + role |
| GET | `/api/users` | All users (admin) |
| PUT | `/api/users/:id/role` | Update user role |
| POST | `/api/reports` | Submit new report |
| GET | `/api/reports` | Get reports |
| PUT | `/api/reports/:id` | Update report |
| DELETE | `/api/reports/:id` | Delete report |
| PUT | `/api/reports/:id/assign` | Assign to investigator |
| POST | `/api/investigations` | Submit investigation |
| PUT | `/api/investigations/:id` | Update investigation |
| GET | `/api/investigations/:reportId` | Get investigation |
| POST | `/api/upload` | Upload image to File Store |
| GET | `/api/file/:fileId` | Download image |
| POST | `/api/ai-fill` | AI form fill (Groq) |
| POST | `/api/chat` | AI chatbot (Groq) |
| GET | `/api/analytics` | Dashboard stats |
| GET | `/api/sync-roles` | Sync roles from Catalyst Auth |

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/AmazingFeature

# Commit your changes
git commit -m 'Add AmazingFeature'

# Push to the branch
git push origin feature/AmazingFeature

# Open a Pull Request
```

---

## ☕ Support the Project

If SafetyEdge helped you or saved you time, consider supporting the development!

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-☕-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://www.buymeacoffee.com/techie63)

[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/yourusername)

**Every coffee keeps the code flowing! ☕**

</div>

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Surya** — [@techie63](https://github.com/techie63)

> Built with ❤️ using Zoho Catalyst + React + Groq AI

---

<div align="center">

⭐ **Star this repo if you found it helpful!** ⭐

![GitHub stars](https://img.shields.io/github/stars/yourusername/safety-edge?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/safety-edge?style=social)

</div>
