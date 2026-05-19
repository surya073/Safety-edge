'use strict';

const express = require('express');
const cors = require('cors');
const catalyst = require('zcatalyst-sdk-node');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const FOLDER_ID = '37148000000066285';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
}));

// ── HELPER ──
async function getCurrentUser(req, catalystApp) {
  try {
    const userManagement = catalystApp.userManagement();
    return await userManagement.getCurrentUser();
  } catch (e) {
    return null;
  }
}


// ── EMAIL HELPER ──
async function sendEmail(catalystApp, to, subject, htmlBody) {
  try {
    const mail = catalystApp.email();
    const toEmail = Array.isArray(to) ? to[0] : to;
    const result = await mail.sendMail({
      from_email: 'suryastillz073@gmail.com',
      to_email: toEmail,
      subject: subject,
      content: htmlBody,
      html_mode: true,        // ← ADD THIS
    });
    console.log('Email sent to:', toEmail);
    return result;
  } catch (e) {
    console.error('Email failed:', e.message);
  }
}

// ── EMAIL TEMPLATES ──
function reportCreatedEmail(report, reporterName) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#4da6e8;padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:22px;letter-spacing:2px;">SAFETY EDGE</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">Incident Management System</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#4da6e8;margin:0 0 16px;">New Report Submitted</h2>
        <p style="color:#aaa;margin:0 0 24px;">A new safety report has been submitted and requires attention.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px;background:#0f1f3d;border-radius:6px 6px 0 0;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Title</td>
            <td style="padding:10px;background:#0f1f3d;border-radius:6px 6px 0 0;color:#fff;font-weight:600;">${report.title}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#162952;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Type</td>
            <td style="padding:10px;background:#162952;color:#fff;">${report.type?.replace('_', ' ')}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#0f1f3d;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Severity</td>
            <td style="padding:10px;background:#0f1f3d;color:${report.severity === 'high' ? '#e85d4a' : report.severity === 'medium' ? '#f5a623' : '#3ecf8e'};font-weight:700;text-transform:uppercase;">${report.severity}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#162952;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Location</td>
            <td style="padding:10px;background:#162952;color:#fff;">${report.location}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#0f1f3d;border-radius:0 0 6px 6px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reported By</td>
            <td style="padding:10px;background:#0f1f3d;border-radius:0 0 6px 6px;color:#fff;">${reporterName}</td>
          </tr>
        </table>
        <div style="margin-top:24px;padding:16px;background:#162952;border-radius:8px;border-left:3px solid #4da6e8;">
          <p style="margin:0;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Description</p>
          <p style="margin:8px 0 0;color:#fff;">${report.description}</p>
        </div>
        <p style="margin:24px 0 0;color:#aaa;font-size:12px;">Please log in to SafetyEdge to review and take action on this report.</p>
      </div>
      <div style="padding:16px;text-align:center;background:#0f1f3d;color:#aaa;font-size:12px;">
        SafetyEdge Incident Management System
      </div>
    </div>
  `;
}

function assignedEmail(report, investigatorEmail) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#f5a623;padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:22px;letter-spacing:2px;color:#0a1628;">SAFETY EDGE</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;color:#0a1628;">Case Assigned to You</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#f5a623;margin:0 0 16px;">You have been assigned a case</h2>
        <p style="color:#aaa;margin:0 0 24px;">Please log in to SafetyEdge to begin your investigation.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px;background:#0f1f3d;border-radius:6px 6px 0 0;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Title</td>
            <td style="padding:10px;background:#0f1f3d;border-radius:6px 6px 0 0;color:#fff;font-weight:600;">${report.title}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#162952;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Type</td>
            <td style="padding:10px;background:#162952;color:#fff;">${report.type?.replace('_', ' ')}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#0f1f3d;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Severity</td>
            <td style="padding:10px;background:#0f1f3d;color:${report.severity === 'high' ? '#e85d4a' : report.severity === 'medium' ? '#f5a623' : '#3ecf8e'};font-weight:700;text-transform:uppercase;">${report.severity}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#162952;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Location</td>
            <td style="padding:10px;background:#162952;color:#fff;">${report.location}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#0f1f3d;border-radius:0 0 6px 6px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reported By</td>
            <td style="padding:10px;background:#0f1f3d;border-radius:0 0 6px 6px;color:#fff;">${report.reported_by}</td>
          </tr>
        </table>
        <p style="margin:24px 0 0;color:#aaa;font-size:12px;">Log in to SafetyEdge to view full details and begin your investigation.</p>
      </div>
      <div style="padding:16px;text-align:center;background:#0f1f3d;color:#aaa;font-size:12px;">
        SafetyEdge Incident Management System
      </div>
    </div>
  `;
}

function investigationUpdatedEmail(report, investigation) {
  const actions = (investigation.corrective_actions || '').split('\n').filter(Boolean);
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#3ecf8e;padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:22px;letter-spacing:2px;color:#0a1628;">SAFETY EDGE</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;color:#0a1628;">Investigation Updated</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#3ecf8e;margin:0 0 16px;">Investigation Report Updated</h2>
        <p style="color:#aaa;margin:0 0 8px;">Report: <strong style="color:#fff;">${report.title || 'Report #' + investigation.report_id}</strong></p>
        <p style="color:#aaa;margin:0 0 24px;">Status: <strong style="color:${investigation.status === 'closed' ? '#3ecf8e' : '#f5a623'};">${investigation.status?.replace('_', ' ').toUpperCase()}</strong></p>
        <div style="margin-bottom:20px;padding:16px;background:#0f1f3d;border-radius:8px;border-left:3px solid #3ecf8e;">
          <p style="margin:0 0 8px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Root Cause</p>
          <p style="margin:0;color:#fff;">${investigation.root_cause || 'Not specified'}</p>
        </div>
        ${actions.length > 0 ? `
        <div style="padding:16px;background:#0f1f3d;border-radius:8px;">
          <p style="margin:0 0 12px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Corrective Actions</p>
          ${actions.map((a, i) => `
            <div style="display:flex;gap:10px;margin-bottom:8px;">
              <span style="background:#162952;color:#4da6e8;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${i + 1}</span>
              <span style="color:#fff;">${a}</span>
            </div>
          `).join('')}
        </div>` : ''}
        <p style="margin:24px 0 0;color:#aaa;font-size:12px;">Log in to SafetyEdge to view the full investigation details.</p>
      </div>
      <div style="padding:16px;text-align:center;background:#0f1f3d;color:#aaa;font-size:12px;">
        SafetyEdge Incident Management System
      </div>
    </div>
  `;
}


// ── USER INFO ──
// app.get('/api/userinfo', async (req, res) => {
//   try {
//     const catalystApp = catalyst.initialize(req);
//     const user = await getCurrentUser(req, catalystApp);
//     if (!user) return res.status(401).json({ error: 'Not authenticated' });

//     // Check DataStore for custom role ONLY if Catalyst role is generic
//     const catalystRole = user.role_details?.role_name;
    
//     if (!catalystRole || catalystRole === 'App User' || catalystRole === 'App Administrator') {
//       // Catalyst has generic role — check DataStore
//       try {
//         const zcql = catalystApp.zcql();
//         const rows = await zcql.executeZCQLQuery(
//           `SELECT * FROM Users WHERE user_id = '${user.user_id}'`
//         );
//         if (rows && rows.length > 0) {
//           const dbUser = rows[0].Users || rows[0];
//           if (dbUser.role) {
//             user.role_details = {
//               ...user.role_details,
//               role_name: dbUser.role,
//             };
//           }
//         }
//       } catch (e) {
//         console.log('DataStore role check failed:', e.message);
//       }
//     }
//     // If Catalyst has custom role (admin/employee/investigator) — use it directly

//     res.json({ user });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });


app.get('/api/userinfo', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);

    const user = await getCurrentUser(req, catalystApp);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    try {
      const zcql = catalystApp.zcql();

      const result = await zcql.executeZCQLQuery(
        `SELECT role FROM Users WHERE user_id = '${user.user_id}'`
      );

      if (result && result.length > 0) {
        const dbUser = result[0].Users || result[0];

        if (dbUser.role) {
          user.role_details = {
            ...user.role_details,
            role_name: dbUser.role,
          };
        }
      }
    } catch (e) {
      console.log('Role fetch skipped:', e.message);
    }

    return res.json({
      success: true,
      user,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message,
    });
  }
});

// ── UPLOAD ──
app.post('/api/upload', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = catalystApp.filestore().folder(FOLDER_ID);
    const file = req.files.file;
    const stream = fs.createReadStream(file.tempFilePath);

    const uploaded = await folder.uploadFile({ code: stream, name: file.name });

    const fileId =
      uploaded.id || uploaded.file_id || uploaded.fileId ||
      uploaded.file_details?.id || uploaded.file_details?.file_id;

    if (!fileId) {
      return res.status(500).json({ success: false, message: 'No fileId returned' });
    }

    res.json({ success: true, fileId: String(fileId) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET FILE ── (replace existing)
app.get('/api/file/:fileId', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const folder = catalystApp.filestore().folder(FOLDER_ID);
    const fileData = await folder.downloadFile(req.params.fileId);
    
    const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData.data || fileData);
    
    // ← Detect image type from buffer magic bytes
    let contentType = 'image/jpeg'; // default
    if (buffer[0] === 0x89 && buffer[1] === 0x50) contentType = 'image/png';
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) contentType = 'image/gif';
    else if (buffer[0] === 0x52 && buffer[1] === 0x49) contentType = 'image/webp';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (e) {
    console.error('File download error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── AI FILL (for report form) ──
app.post('/api/ai-fill', async (req, res) => {
  try {
    const { prompt, imageBase64, imageMimeType } = req.body;

    const userPrompt = imageBase64
      ? `Analyze this workplace safety incident and provide details. Context: ${prompt || ''}`
      : prompt || 'analyze incident';

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a workplace safety expert for aged care facilities.
Always respond with ONLY a valid JSON object, no markdown, no backticks, no explanation.
JSON format: {"title":"short incident title max 10 words","type":"incident or near_miss or hazard","severity":"high or medium or low","description":"detailed 2-3 sentence description"}`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await groqRes.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.choices?.[0]?.message?.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return res.json(JSON.parse(match[0]));
    res.status(500).json({ error: 'AI parse failed', raw: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ── REPORTS ──
app.post('/api/reports', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Reports');
    const row = await table.insertRow({
      title: req.body.title,
      type: req.body.type,
      severity: req.body.severity,
      description: req.body.description,
      location: req.body.location,
      status: 'open',
      reported_by: user.email_id,
      assigned_to: '',
      created_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      photo_url: req.body.photo_url || '',
      incident_date: req.body.incident_date || '',
      incident_time: req.body.incident_time || '',
      injured_persons: req.body.injured_persons || '[]',

    });

    // ── Send emails ──
    const reportData = req.body;
    const reporterName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email_id;
    const emailHtml = reportCreatedEmail(reportData, reporterName);

    // Get all admin emails
    try {
      const userManagement = catalystApp.userManagement();
      const allUsers = await userManagement.getAllUsers();
      const adminEmails = allUsers
        .filter(u => u.role_details?.role_name === 'admin')
        .map(u => u.email_id);

      // Send to reporter
      await sendEmail(catalystApp, user.email_id,
        `✅ Report Submitted: ${reportData.title}`, emailHtml);

      // Send to all admins
      for (const email of adminEmails) {
        if (email !== user.email_id) {
          await sendEmail(catalystApp, email,
            `🚨 New Report: ${reportData.title}`, emailHtml);
        }
      }
    } catch (e) {
      console.error('Email send error:', e.message);
    }

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const zcql = catalystApp.zcql();
    let query = req.query.role === 'employee'
      ? `SELECT * FROM Reports WHERE reported_by = '${user.email_id}' ORDER BY ROWID DESC`
      : `SELECT * FROM Reports ORDER BY ROWID DESC`;

    const rows = await zcql.executeZCQLQuery(query);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.delete('/api/file/:fileId/delete', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const folder = catalystApp.filestore().folder(FOLDER_ID);
    await folder.deleteFile(req.params.fileId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/reports/:id', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Reports');
    const row = await table.getRow(req.params.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Reports');
    const row = await table.updateRow({ ROWID: req.params.id, ...req.body });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/reports/:id/assign', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Reports');
    const row = await table.updateRow({
      ROWID: req.params.id,
      assigned_to: req.body.assigned_to,
      status: 'in_progress',
    });

    // ── Send email to investigator ──
    try {
      const report = await table.getRow(req.params.id);
      const emailHtml = assignedEmail(report, req.body.assigned_to);
      await sendEmail(catalystApp, req.body.assigned_to,
        `📋 Case Assigned: ${report.title}`, emailHtml);
    } catch (e) {
      console.error('Assignment email error:', e.message);
    }

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Reports');

    // ← Get report first to find photo_url
    const report = await table.getRow(req.params.id);
    
    // ← Delete images from filestore if any
    if (report && report.photo_url) {
      const fileIds = report.photo_url.split(',').filter(Boolean);
      const folder = catalystApp.filestore().folder(FOLDER_ID);
      for (const fileId of fileIds) {
        try {
          await folder.deleteFile(fileId);
          console.log('Deleted file:', fileId);
        } catch (e) {
          console.log('File delete failed (may not exist):', fileId, e.message);
        }
      }
    }

    // ← Now delete the report row
    await table.deleteRow(req.params.id);
    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ── INVESTIGATIONS ──
app.post('/api/investigations', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Investigations');
    const row = await table.insertRow({
      report_id: req.body.report_id,
      root_cause: req.body.root_cause,
      corrective_actions: req.body.corrective_actions,
      investigator: user.email_id,
      status: req.body.status || 'in_progress',
      updated_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    // ── Send emails to admin + reporter ──
    try {
      const reportsTable = datastore.table('Reports');
      const report = await reportsTable.getRow(req.body.report_id);
      const emailHtml = investigationUpdatedEmail(report, req.body);

      // Send to reporter
      if (report?.reported_by) {
        await sendEmail(catalystApp, report.reported_by,
          `🔍 Investigation Update: ${report.title}`, emailHtml);
      }

      // Send to admins
      const userManagement = catalystApp.userManagement();
      const allUsers = await userManagement.getAllUsers();
      const adminEmails = allUsers
        .filter(u => u.role_details?.role_name === 'admin')
        .map(u => u.email_id);

      for (const email of adminEmails) {
        await sendEmail(catalystApp, email,
          `🔍 Investigation Update: ${report?.title}`, emailHtml);
      }
    } catch (e) {
      console.error('Investigation email error:', e.message);
    }

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/investigations/:reportId', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const zcql = catalystApp.zcql();
    const rows = await zcql.executeZCQLQuery(
      `SELECT * FROM Investigations WHERE report_id = ${req.params.reportId}`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/investigations/:id', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Investigations');
    const row = await table.updateRow({
      ROWID: req.params.id,
      root_cause: req.body.root_cause,
      corrective_actions: req.body.corrective_actions,
      status: req.body.status || 'in_progress',
      updated_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    // ── Send emails ──
    try {
      const reportsTable = datastore.table('Reports');
      const report = await reportsTable.getRow(req.body.report_id);
      const emailHtml = investigationUpdatedEmail(report, req.body);

      if (report?.reported_by) {
        await sendEmail(catalystApp, report.reported_by,
          `🔍 Investigation Update: ${report.title}`, emailHtml);
      }

      const userManagement = catalystApp.userManagement();
      const allUsers = await userManagement.getAllUsers();
      const adminEmails = allUsers
        .filter(u => u.role_details?.role_name === 'admin')
        .map(u => u.email_id);

      for (const email of adminEmails) {
        await sendEmail(catalystApp, email,
          `🔍 Investigation Update: ${report?.title}`, emailHtml);
      }
    } catch (e) {
      console.error('Update email error:', e.message);
    }

    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── USERS ──
app.get('/api/users', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const currentUser = await getCurrentUser(req, catalystApp);
    if (!currentUser) return res.status(401).json({ error: 'Not authenticated' });

    const userManagement = catalystApp.userManagement();
    const zcql = catalystApp.zcql();

    // Get all users from Catalyst Auth
    const allUsers = await userManagement.getAllUsers();

    // Get all roles from DataStore
    let dbRoles = {};
    try {
      const rows = await zcql.executeZCQLQuery(`SELECT * FROM Users`);
      rows.forEach(r => {
        const u = r.Users || r;
        if (u.user_id) dbRoles[u.user_id] = u.role;
      });
    } catch (e) {}

    const formattedUsers = allUsers.map(u => ({
      ROWID: u.user_id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
      email: u.email_id,
      // Use DataStore role if exists, else Catalyst role
      role: dbRoles[u.user_id] || u.role_details?.role_name || 'employee',
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.put('/api/users/:id/role', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const currentUser = await getCurrentUser(req, catalystApp);
    if (!currentUser) return res.status(401).json({ error: 'Not authenticated' });

    const validRoles = ['admin', 'employee', 'investigator'];
    if (!validRoles.includes(req.body.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const zcql = catalystApp.zcql();
    const datastore = catalystApp.datastore();
    const table = datastore.table('Users');

    const existing = await zcql.executeZCQLQuery(
      `SELECT * FROM Users WHERE user_id = '${req.params.id}'`
    );

    if (existing && existing.length > 0) {
      // ← Use actual DataStore ROWID
      const actualRowId = (existing[0].Users || existing[0]).ROWID;
      await table.updateRow({
        ROWID: actualRowId,
        role: req.body.role,
      });
    } else {
      const userManagement = catalystApp.userManagement();
      const userDetails = await userManagement.getUserDetails(req.params.id);
      await table.insertRow({
        user_id: req.params.id,
        name: `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim(),
        email: userDetails.email_id,
        role: req.body.role,
        status: 'active',
      });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ── NOTIFICATIONS ──
app.get('/api/notifications', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const zcql = catalystApp.zcql();
    const rows = await zcql.executeZCQLQuery(
      `SELECT * FROM Notifications WHERE user_id = '${user.user_id}' ORDER BY ROWID DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notifications/:id', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const datastore = catalystApp.datastore();
    const table = datastore.table('Notifications');
    const row = await table.updateRow({ ROWID: req.params.id, is_read: true });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ANALYTICS ──
app.get('/api/analytics', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const zcql = catalystApp.zcql();

    // ← Use single query instead of multiple parallel queries
    let allReports = [];
    let invs = [];

    try {
      const rows = await zcql.executeZCQLQuery(`SELECT * FROM Reports ORDER BY ROWID DESC`);
      allReports = rows.map(r => r.Reports || r);
    } catch (e) {
      console.log('Reports query failed:', e.message);
    }

    try {
      const rows = await zcql.executeZCQLQuery(`SELECT * FROM Investigations ORDER BY ROWID DESC`);
      invs = rows.map(r => r.Investigations || r);
    } catch (e) {
      console.log('Investigations query failed:', e.message);
    }

    const byType = {
      incident: allReports.filter(r => r.type === 'incident').length,
      near_miss: allReports.filter(r => r.type === 'near_miss').length,
      hazard: allReports.filter(r => r.type === 'hazard').length,
    };

    const bySeverity = {
      high: allReports.filter(r => r.severity === 'high').length,
      medium: allReports.filter(r => r.severity === 'medium').length,
      low: allReports.filter(r => r.severity === 'low').length,
    };

    const byStatus = {
      open: allReports.filter(r => r.status === 'open').length,
      in_progress: allReports.filter(r => r.status === 'in_progress').length,
      closed: allReports.filter(r => r.status === 'closed').length,
    };

    res.json({
      success: true,
      data: {
        total: allReports.length,
        open: byStatus.open,
        in_progress: byStatus.in_progress,
        closed: byStatus.closed,
        high_severity: bySeverity.high,
        investigations: invs.length,
        by_type: byType,
        by_severity: bySeverity,
        by_status: byStatus,
      },
    });
  } catch (e) {
    console.error('Analytics error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ── CHATBOT ──
// Add this route to index.js before module.exports = app

app.post('/api/chat', async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const user = await getCurrentUser(req, catalystApp);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { message, history = [] } = req.body;

    const systemPrompt = `You are SafetyEdge AI Assistant, an expert in workplace safety management for aged care facilities.
You help users with incident reporting, severity classification (high/medium/low), investigation guidance, corrective actions, safety best practices and navigating the SafetyEdge platform.
Current user: ${user.first_name} ${user.last_name} (Role: ${user.role_details?.role_name || 'employee'})
Platform roles - Employee: report incidents, view own reports. Admin: view all reports, assign investigators, manage users. Investigator: investigate cases, document root cause and corrective actions.
Keep responses concise and practical. Use bullet points where helpful. Return plain conversational text only.`;

    const messages_payload = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(h => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages_payload,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    const data = await groqRes.json();
    console.log('Groq response:', JSON.stringify(data));

    if (data.error) {
      return res.status(500).json({ 
        reply: 'I am temporarily unavailable. Please try again.',
        error: data.error.message,
      });
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return res.status(500).json({ reply: 'Sorry, no response. Please try again.' });
    }

    res.json({ reply: text });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ reply: 'Sorry, I encountered an error. Please try again.' });
  }
});



// ── EXPORT ──
module.exports = app;