/**
 * Darwin City Hospital — Web & API Server
 * Fictional Australian Healthcare Web Platform & Educational Portfolio Project
 * Powered by Node.js built-in HTTP module & SQLite Database Core
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const DarwinDB = require('./database/db');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// Central Dispatch Configuration (SMS & Email Gateways)
const HOSPITAL_DISPATCH_CONFIG = {
  resendApiKey: process.env.RESEND_API_KEY || '',
  senderEmail: process.env.SENDER_EMAIL || 'Darwin City Hospital <onboarding@resend.dev>',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
};

function sendResendEmail(to, subject, html) {
  if (!HOSPITAL_DISPATCH_CONFIG.resendApiKey) return Promise.resolve(null);
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      from: HOSPITAL_DISPATCH_CONFIG.senderEmail,
      to: [to],
      subject: subject,
      html: html
    });
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HOSPITAL_DISPATCH_CONFIG.resendApiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

function sendTwilioSms(to, message) {
  if (!HOSPITAL_DISPATCH_CONFIG.twilioAccountSid || !HOSPITAL_DISPATCH_CONFIG.twilioAuthToken) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const sid = HOSPITAL_DISPATCH_CONFIG.twilioAccountSid;
    const auth = Buffer.from(`${sid}:${HOSPITAL_DISPATCH_CONFIG.twilioAuthToken}`).toString('base64');
    const params = new URLSearchParams({
      To: to,
      From: HOSPITAL_DISPATCH_CONFIG.twilioPhoneNumber,
      Body: message
    }).toString();

    const req = https.request({
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${sid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(params)
      }
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(params);
    req.end();
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2e6) { // 2MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // Global Security & CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL & normalize path
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // =========================================================================
  // REST API ROUTING
  // =========================================================================

  // 1. Departments API: GET /api/departments
  if (req.method === 'GET' && pathname === '/api/departments') {
    try {
      const depts = DarwinDB.getAllDepartments();
      return sendJson(res, 200, { success: true, count: depts.length, data: depts });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 2. Doctors API: GET /api/doctors
  if (req.method === 'GET' && pathname === '/api/doctors') {
    try {
      const departmentId = parsedUrl.searchParams.get('department');
      const searchQuery = parsedUrl.searchParams.get('search');
      const docs = DarwinDB.getAllDoctors(departmentId, searchQuery);
      return sendJson(res, 200, { success: true, count: docs.length, data: docs });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 3. Single Doctor API: GET /api/doctors/:id
  if (req.method === 'GET' && pathname.startsWith('/api/doctors/')) {
    try {
      const doctorId = pathname.replace('/api/doctors/', '');
      const doc = DarwinDB.getDoctorById(doctorId);
      if (!doc) {
        return sendJson(res, 404, { success: false, error: 'Doctor not found' });
      }
      return sendJson(res, 200, { success: true, data: doc });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 4. Availability & Slots: GET /api/availability
  if (req.method === 'GET' && pathname === '/api/availability') {
    try {
      const doctorId = parsedUrl.searchParams.get('doctorId');
      const date = parsedUrl.searchParams.get('date');
      if (!doctorId || !date) {
        return sendJson(res, 400, { success: false, error: 'doctorId and date query parameters required' });
      }
      const bookedSlots = DarwinDB.getBookedSlots(doctorId, date);
      const allSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '01:30 PM', '02:00 PM',
        '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
      ];
      const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));
      return sendJson(res, 200, {
        success: true,
        doctorId,
        date,
        allSlots,
        bookedSlots,
        availableSlots
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 5. Book Appointment: POST /api/appointments/book
  if (req.method === 'POST' && pathname === '/api/appointments/book') {
    try {
      const body = await readBody(req);
      if (!body.doctor_id || !body.department_id || !body.appointment_date || !body.time_slot || !body.patient_name || !body.patient_email) {
        return sendJson(res, 400, { success: false, error: 'Missing required appointment fields' });
      }

      // Past date validation
      const today = new Date().toISOString().split('T')[0];
      if (body.appointment_date < today) {
        return sendJson(res, 400, { success: false, error: 'Cannot book an appointment for a past date.' });
      }

      // Check or create patient record for email
      let user = DarwinDB.db.prepare('SELECT id FROM users WHERE email = ?').get(body.patient_email);
      let patientId;
      if (user) {
        let patient = DarwinDB.db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id);
        if (patient) {
          patientId = patient.id;
        } else {
          const mrn = 'DCH-MRN-' + Math.floor(1000 + Math.random() * 9000);
          const ins = DarwinDB.db.prepare('INSERT INTO patients (user_id, mrn) VALUES (?, ?)').run(user.id, mrn);
          patientId = Number(ins.lastInsertRowid);
        }
      } else {
        // Auto-register demo patient
        const tempPass = DarwinDB.hashPassword('DarwinPatient2026!');
        const uIns = DarwinDB.db.prepare(`
          INSERT INTO users (email, password_hash, salt, role, name, phone)
          VALUES (?, ?, ?, 'patient', ?, ?)
        `).run(body.patient_email, tempPass.hash, tempPass.salt, body.patient_name, body.patient_phone || '+61 400 000 000');
        const mrn = 'DCH-MRN-' + Math.floor(1000 + Math.random() * 9000);
        const pIns = DarwinDB.db.prepare('INSERT INTO patients (user_id, mrn) VALUES (?, ?)').run(Number(uIns.lastInsertRowid), mrn);
        patientId = Number(pIns.lastInsertRowid);
      }

      body.patient_id = patientId;
      const refCode = DarwinDB.createAppointment(body);

      // Audit log
      DarwinDB.db.prepare(`
        INSERT INTO audit_logs (action, resource, details, ip_address)
        VALUES ('BOOK_APPOINTMENT', 'appointments', ?, ?)
      `).run(`Reference: ${refCode}, Doctor: ${body.doctor_id}`, req.socket.remoteAddress || '127.0.0.1');

      return sendJson(res, 201, {
        success: true,
        referenceId: refCode,
        message: 'Appointment successfully confirmed and registered at Darwin City Hospital.',
        appointment: {
          reference: refCode,
          doctor_id: body.doctor_id,
          date: body.appointment_date,
          time: body.time_slot,
          consultation_type: body.consultation_type || 'In-Person Consultation',
          fee_aud: body.fee_aud || 220
        }
      });
    } catch (err) {
      return sendJson(res, 409, { success: false, error: err.message });
    }
  }

  // 6. Reschedule Appointment: POST /api/appointments/reschedule
  if (req.method === 'POST' && pathname === '/api/appointments/reschedule') {
    try {
      const body = await readBody(req);
      if (!body.appointmentId || !body.newDate || !body.newTime) {
        return sendJson(res, 400, { success: false, error: 'appointmentId, newDate, and newTime required' });
      }
      DarwinDB.rescheduleAppointment(body.appointmentId, body.newDate, body.newTime);
      return sendJson(res, 200, { success: true, message: `Appointment ${body.appointmentId} rescheduled to ${body.newDate} at ${body.newTime}.` });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 7. Cancel Appointment: POST /api/appointments/cancel
  if (req.method === 'POST' && pathname === '/api/appointments/cancel') {
    try {
      const body = await readBody(req);
      if (!body.appointmentId) {
        return sendJson(res, 400, { success: false, error: 'appointmentId required' });
      }
      DarwinDB.updateAppointmentStatus(body.appointmentId, 'cancelled');
      return sendJson(res, 200, { success: true, message: `Appointment ${body.appointmentId} has been cancelled.` });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 8. Authentication - Register: POST /api/auth/register
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    try {
      const body = await readBody(req);
      if (!body.email || !body.password || !body.name) {
        return sendJson(res, 400, { success: false, error: 'Name, email, and password are required' });
      }
      const existing = DarwinDB.db.prepare('SELECT id FROM users WHERE email = ?').get(body.email);
      if (existing) {
        return sendJson(res, 409, { success: false, error: 'An account with this email address already exists.' });
      }
      const { salt, hash } = DarwinDB.hashPassword(body.password);
      const userIns = DarwinDB.db.prepare(`
        INSERT INTO users (email, password_hash, salt, role, name, phone)
        VALUES (?, ?, ?, 'patient', ?, ?)
      `).run(body.email, hash, salt, body.name, body.phone || '');

      const userId = Number(userIns.lastInsertRowid);
      const mrn = 'DCH-MRN-' + Math.floor(1000 + Math.random() * 9000);
      DarwinDB.db.prepare('INSERT INTO patients (user_id, mrn) VALUES (?, ?)').run(userId, mrn);

      return sendJson(res, 201, {
        success: true,
        user: { id: userId, email: body.email, name: body.name, role: 'patient', mrn }
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 9. Authentication - Login: POST /api/auth/login
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    try {
      const body = await readBody(req);
      if (!body.email || !body.password) {
        return sendJson(res, 400, { success: false, error: 'Email and password required' });
      }
      const user = DarwinDB.db.prepare('SELECT * FROM users WHERE email = ?').get(body.email);
      if (!user) {
        return sendJson(res, 401, { success: false, error: 'Invalid email address or credentials' });
      }
      const isValid = DarwinDB.verifyPassword(body.password, user.salt, user.password_hash);
      if (!isValid) {
        return sendJson(res, 401, { success: false, error: 'Invalid password' });
      }

      // Fetch patient or doctor record if applicable
      let profile = null;
      if (user.role === 'patient') {
        profile = DarwinDB.db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
      } else if (user.role === 'doctor') {
        profile = DarwinDB.db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(user.id);
      }

      return sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          profile
        }
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 10. Patient Dashboard: GET /api/patient/dashboard
  if (req.method === 'GET' && pathname === '/api/patient/dashboard') {
    try {
      let userId = parsedUrl.searchParams.get('userId');
      if (!userId) {
        const defaultPat = DarwinDB.db.prepare("SELECT id FROM users WHERE role = 'patient' LIMIT 1").get();
        userId = defaultPat ? defaultPat.id : 4;
      } else {
        userId = Number(userId);
      }
      const data = DarwinDB.getPatientDashboardData(userId);
      if (!data) return sendJson(res, 404, { success: false, error: 'Patient not found' });
      return sendJson(res, 200, { success: true, data });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 11. Doctor Dashboard: GET /api/doctor/dashboard
  if (req.method === 'GET' && pathname === '/api/doctor/dashboard') {
    try {
      let userId = parsedUrl.searchParams.get('userId');
      if (!userId) {
        const defaultDoc = DarwinDB.db.prepare("SELECT id FROM users WHERE role = 'doctor' LIMIT 1").get();
        userId = defaultDoc ? defaultDoc.id : 2;
      } else {
        userId = Number(userId);
      }
      const data = DarwinDB.getDoctorDashboardData(userId);
      if (!data) return sendJson(res, 404, { success: false, error: 'Doctor not found' });
      return sendJson(res, 200, { success: true, data });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 12. Admin Dashboard: GET /api/admin/dashboard
  if (req.method === 'GET' && pathname === '/api/admin/dashboard') {
    try {
      const data = DarwinDB.getAdminDashboardData();
      return sendJson(res, 200, { success: true, data });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 13. Contact Enquiry: POST /api/contact
  if (req.method === 'POST' && pathname === '/api/contact') {
    try {
      const body = await readBody(req);
      if (!body.fullName || !body.email || !body.subject || !body.message) {
        return sendJson(res, 400, { success: false, error: 'Please provide full name, email, subject, and message.' });
      }
      DarwinDB.submitContactEnquiry(body);
      return sendJson(res, 200, { success: true, message: 'Your enquiry has been received and routed to the clinical team.' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 14. Health Articles: GET /api/articles
  if (req.method === 'GET' && pathname === '/api/articles') {
    try {
      const articles = DarwinDB.getAllArticles();
      return sendJson(res, 200, { success: true, count: articles.length, data: articles });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 15. Send Confirmation (Email / SMS Gateway Dispatch)
  if (req.method === 'POST' && pathname === '/api/send-confirmation') {
    try {
      const payload = await readBody(req);
      const to = payload.to || 'patient';
      const ref = payload.refCode || 'DCH-XXXXXX';
      const doc = payload.doctorName || 'Specialist Physician';
      const date = payload.date || 'Scheduled Date';
      const time = payload.time || 'Scheduled Time';

      console.log('----------------------------------------------------');
      console.log(`[Darwin City Hospital Dispatch] ✉️ OUTGOING CONFIRMATION`);
      console.log(` > Recipient:  ${to}`);
      console.log(` > Subject:    Confirmed: Darwin City Hospital Consultation with ${doc} [${ref}]`);
      console.log(` > Schedule:   ${date} at ${time}`);
      console.log(` > Status:     DISPATCHED (Delivered to SMTP queue)`);
      console.log('----------------------------------------------------');

      const emailSubject = `🩺 Confirmed: Darwin City Hospital Appointment with ${doc} [Ref: ${ref}]`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #bae6fd; border-radius: 8px; overflow: hidden;">
          <div style="background: #005B96; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">🏥 Darwin City Hospital</h2>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Official Clinical Consultation Pass • Darwin, NT</p>
          </div>
          <div style="padding: 24px; color: #0F172A;">
            <p>Dear Patient,</p>
            <p>Your appointment has been confirmed. Below are your clinical consultation details:</p>
            <div style="background: #F4F8FB; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #e0f0fa;">
              <div><strong>Reference ID:</strong> ${ref}</div>
              <div><strong>Specialist:</strong> ${doc}</div>
              <div><strong>Schedule:</strong> ${date} at ${time} (ACST)</div>
              <div><strong>Location:</strong> Darwin City Hospital, Specialist Suites</div>
            </div>
            <p style="font-size: 12px; color: #64748B;">Please arrive 15 minutes before your consultation. Non-Emergency: (08) 8999 0000 | Emergency: 000</p>
          </div>
        </div>
      `;
      sendResendEmail(to, emailSubject, emailHtml);

      return sendJson(res, 200, {
        success: true,
        status: 'dispatched',
        recipient: to,
        reference: ref,
        message: `Appointment confirmation pass dispatched to ${to}.`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 16. Send 2FA OTP: POST /api/send-otp
  if (req.method === 'POST' && pathname === '/api/send-otp') {
    try {
      const payload = await readBody(req);
      const to = payload.to || 'patient';
      const otp = payload.otp || '000000';

      console.log('----------------------------------------------------');
      console.log(`[Darwin City Hospital Gateway] 🔒 2FA VERIFICATION CODE`);
      console.log(` > Recipient:  ${to}`);
      console.log(` > 6-Digit Code: ${otp}`);
      console.log(` > Status:     DISPATCHED (Delivered via SMS/Email)`);
      console.log('----------------------------------------------------');

      if (to.includes('@')) {
        const otpSubject = `🔒 Darwin City Hospital Security Code: ${otp}`;
        const otpHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #005B96; margin-top: 0;">🏥 Darwin City Hospital</h2>
            <p>Your one-time 6-digit security verification code is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #005B96; background: #f0f7fc; padding: 12px; border-radius: 6px; text-align: center; font-family: monospace;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 12px;">Valid for 10 minutes. If you did not request this, please disregard.</p>
          </div>
        `;
        sendResendEmail(to, otpSubject, otpHtml);
      } else if (to.replace(/\D/g, '').length >= 8) {
        sendTwilioSms(to, `Darwin City Hospital Security: Your verification code is ${otp}. Valid for 10 minutes.`);
      }

      return sendJson(res, 200, {
        success: true,
        status: 'dispatched',
        recipient: to,
        otp: otp,
        message: `Security code has been dispatched to ${to}.`
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Custom 404 HTML
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 — Page Not Found | Darwin City Hospital</title>
          <link rel="stylesheet" href="/css/styles.css">
          <style>
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F4F8FB; font-family: 'Inter', sans-serif; text-align: center; padding: 2rem; }
            .error-card { background: white; border-radius: 16px; padding: 3rem 2rem; max-width: 500px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
            .error-code { font-size: 5rem; font-weight: 800; color: #005B96; line-height: 1; margin-bottom: 1rem; }
            .error-title { font-size: 1.5rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem; }
            .error-desc { color: #64748B; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.6; }
            .btn-home { display: inline-block; background: #005B96; color: white; padding: 0.75rem 1.75rem; border-radius: 9999px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
            .btn-home:hover { background: #004675; }
          </style>
        </head>
        <body>
          <div class="error-card">
            <div class="error-code">404</div>
            <h1 class="error-title">Clinical Page Not Found</h1>
            <p class="error-desc">The medical directory, clinic service, or portal page you are looking for is unavailable or has been relocated.</p>
            <a href="/" class="btn-home">Return to Darwin City Hospital</a>
          </div>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 1 hour cache for assets, no-cache for index.html
    const cacheControl = (ext === '.html') ? 'no-cache, must-revalidate' : 'public, max-age=3600';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': cacheControl
    });

    const readStream = fs.createReadStream(safePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 Darwin City Hospital Web Platform`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📍 Location: Darwin, Northern Territory, Australia`);
  console.log(`🕒 Local Timezone: ACST (UTC+9:30)`);
  console.log(`🚨 Emergency: 000 | Hospital Dispatch: (08) 8999 0000`);
  console.log(`====================================================`);
});

module.exports = server;
