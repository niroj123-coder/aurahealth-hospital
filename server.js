/**
 * Darwin City Hospital — Web & API Server
 * Fictional Australian Healthcare Web Platform & Educational Portfolio Project
 * Powered by Node.js built-in HTTP module & SQLite Database Core
 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DarwinDB = require('./database/db');
const Mailer = require('./services/mailer');

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
  if (req.method === 'GET' && pathname.startsWith('/api/doctors/') && pathname !== '/api/doctors/favorites') {
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
        return sendJson(res, 400, { success: false, error: 'Missing required appointment fields.' });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.patient_email)) {
        return sendJson(res, 400, { success: false, error: 'Please enter a valid patient email address.' });
      }

      // Past date validation
      const today = new Date().toISOString().split('T')[0];
      if (body.appointment_date < today) {
        return sendJson(res, 400, { success: false, error: 'Cannot book an appointment for a past date.' });
      }

      // Verify OTP verification token
      const isVerified = DarwinDB.validateAndConsumeVerifiedToken(body.patient_email, 'booking', body.verifiedToken);
      if (!isVerified) {
        return sendJson(res, 403, {
          success: false,
          error: 'Email verification required. Please verify your email with the 6-digit verification code before booking.'
        });
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

      // 1. Save Appointment in SQLite Database FIRST (Collision-safe transaction)
      const refCode = DarwinDB.createAppointment(body);

      // Audit log
      DarwinDB.db.prepare(`
        INSERT INTO audit_logs (action, resource, details, ip_address)
        VALUES ('BOOK_APPOINTMENT', 'appointments', ?, ?)
      `).run(`Reference: ${refCode}, Doctor: ${body.doctor_id}`, req.socket.remoteAddress || '127.0.0.1');

      // 2. Fetch Doctor & Department details for the official confirmation email
      const doc = DarwinDB.getDoctorById(body.doctor_id);
      const dept = DarwinDB.getDepartmentById(body.department_id);

      const apptEmailData = {
        id: refCode,
        patient_name: body.patient_name,
        patient_email: body.patient_email,
        patient_phone: body.patient_phone,
        doctor_name: doc ? doc.name : body.doctor_id,
        doctor_room: doc ? doc.room : 'Wing A, Specialist Suites',
        department_name: dept ? dept.name : body.department_id,
        appointment_date: body.appointment_date,
        time_slot: body.time_slot,
        consultation_type: body.consultation_type || 'In-Person Consultation',
        fee_aud: body.fee_aud || (doc ? doc.fee_aud : 220)
      };

      // 3. Dispatch Professional Confirmation Email via Nodemailer Gmail SMTP
      let emailDispatched = false;
      let emailMessage = 'Confirmation email dispatched.';
      try {
        if (Mailer.isSmtpConfigured()) {
          // 1. Send Confirmation Email to Client (Patient)
          await Mailer.sendAppointmentConfirmationEmail(apptEmailData);
          emailDispatched = true;
          DarwinDB.logEmailDelivery(
            body.patient_email,
            'appointment_confirmation',
            `Darwin City Hospital – Appointment Confirmation [Ref: ${refCode}]`,
            'sent',
            null,
            refCode
          );

          // 2. Send Alert Email to Hospital Gmail (Admin / Clinical Concierge)
          try {
            await Mailer.sendAdminNewAppointmentAlertEmail(apptEmailData);
            DarwinDB.logEmailDelivery(
              Mailer.SMTP_CONFIG.adminEmail || Mailer.SMTP_CONFIG.user,
              'admin_appointment_alert',
              `🏥 [Hospital Notice] New Appointment: ${apptEmailData.patient_name} [Ref: ${refCode}]`,
              'sent',
              null,
              refCode
            );
          } catch (adminEmailErr) {
            console.error('[Darwin Mailer] Hospital alert email error:', adminEmailErr.message);
          }
        } else {
          emailMessage = 'Gmail SMTP credentials are not configured in .env. Email delivery was skipped.';
          DarwinDB.logEmailDelivery(
            body.patient_email,
            'appointment_confirmation',
            `Darwin City Hospital – Appointment Confirmation [Ref: ${refCode}]`,
            'failed',
            'Gmail SMTP credentials unconfigured in .env',
            refCode
          );
        }
      } catch (emailErr) {
        console.error('[Darwin Mailer] Confirmation email error:', emailErr.message);
        emailMessage = 'Appointment saved in database, but confirmation email could not be sent: ' + emailErr.message;
        DarwinDB.logEmailDelivery(
          body.patient_email,
          'appointment_confirmation',
          `Darwin City Hospital – Appointment Confirmation [Ref: ${refCode}]`,
          'failed',
          emailErr.message,
          refCode
        );
      }

      return sendJson(res, 201, {
        success: true,
        referenceId: refCode,
        message: 'Appointment successfully confirmed and registered at Darwin City Hospital.',
        emailStatus: {
          dispatched: emailDispatched,
          info: emailMessage
        },
        appointment: {
          reference: refCode,
          doctor_id: body.doctor_id,
          doctor_name: doc ? doc.name : body.doctor_id,
          department_id: body.department_id,
          department_name: dept ? dept.name : body.department_id,
          date: body.appointment_date,
          time: body.time_slot,
          consultation_type: body.consultation_type || 'In-Person Consultation',
          fee_aud: body.fee_aud || (doc ? doc.fee_aud : 220)
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

  // 15. Send OTP Email Verification: POST /api/auth/send-otp
  if (req.method === 'POST' && pathname === '/api/auth/send-otp') {
    try {
      const body = await readBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const purpose = body.purpose || 'booking'; // 'booking' or 'enquiry'

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { success: false, error: 'A valid email address is required.' });
      }

      if (!['booking', 'enquiry'].includes(purpose)) {
        return sendJson(res, 400, { success: false, error: 'Invalid verification purpose.' });
      }

      // Check if SMTP is configured with Gmail credentials
      if (!Mailer.isSmtpConfigured()) {
        return sendJson(res, 503, {
          success: false,
          error: 'Gmail SMTP credentials are not configured on the server. Please set your Gmail address (SMTP_USER) and 16-character Google App Password (SMTP_PASS) in the server .env file to enable live verification code emails.'
        });
      }

      // Generate secure 6-digit random code
      const otp = crypto.randomInt(100000, 1000000).toString();

      // Store in SQLite with salt, hash, 5-minute expiry, and 60-second rate-limiting cooldown
      const dbResult = DarwinDB.saveOtpVerification(email, purpose, otp);
      if (!dbResult.success) {
        return sendJson(res, 429, {
          success: false,
          rateLimited: true,
          waitSeconds: dbResult.waitSeconds,
          error: dbResult.error
        });
      }

      // Send real email via Nodemailer Gmail SMTP
      await Mailer.sendVerificationOtpEmail(email, otp);

      // Log successful email delivery
      DarwinDB.logEmailDelivery(
        email,
        'otp_verification',
        'Darwin City Hospital – Email Verification',
        'sent',
        null,
        null
      );

      return sendJson(res, 200, {
        success: true,
        message: `A 6-digit verification code has been dispatched to ${email}. Valid for 5 minutes.`,
        expiresAt: dbResult.expiresAt
      });
    } catch (err) {
      console.error('[Darwin Auth] Error sending verification OTP:', err.message);
      DarwinDB.logEmailDelivery(
        'unknown',
        'otp_verification',
        'Darwin City Hospital – Email Verification',
        'failed',
        err.message,
        null
      );
      return sendJson(res, 500, { success: false, error: 'Failed to dispatch verification code: ' + err.message });
    }
  }

  // 16. Verify OTP Code: POST /api/auth/verify-otp
  if (req.method === 'POST' && pathname === '/api/auth/verify-otp') {
    try {
      const body = await readBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const purpose = body.purpose || 'booking';
      const otp = (body.otp || '').toString().trim();

      if (!email || !otp) {
        return sendJson(res, 400, { success: false, error: 'Email and 6-digit verification code are required.' });
      }

      if (!/^\d{6}$/.test(otp)) {
        return sendJson(res, 400, { success: false, error: 'Verification code must be exactly 6 digits.' });
      }

      const verifyRes = DarwinDB.verifyOtpCode(email, purpose, otp);
      if (!verifyRes.success) {
        return sendJson(res, 400, { success: false, error: verifyRes.error });
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Email address verified successfully.',
        verifiedToken: verifyRes.verifiedToken
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 17. Submit General Enquiry: POST /api/enquiries/submit
  if (req.method === 'POST' && pathname === '/api/enquiries/submit') {
    try {
      const body = await readBody(req);
      if (!body.fullName || !body.email || !body.subject || !body.message) {
        return sendJson(res, 400, { success: false, error: 'Full name, email, subject, and message are required.' });
      }

      // Email format validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return sendJson(res, 400, { success: false, error: 'Please provide a valid email address.' });
      }

      // Check verified token
      const isVerified = DarwinDB.validateAndConsumeVerifiedToken(body.email, 'enquiry', body.verifiedToken);
      if (!isVerified) {
        return sendJson(res, 403, {
          success: false,
          error: 'Email verification is required before submitting your enquiry. Please verify your email with the 6-digit code.'
        });
      }

      // Persist enquiry in SQLite database
      const enquiry = DarwinDB.createGeneralEnquiry(body);

      // Audit log
      DarwinDB.db.prepare(`
        INSERT INTO audit_logs (action, resource, details, ip_address)
        VALUES ('SUBMIT_ENQUIRY', 'general_enquiries', ?, ?)
      `).run(`Reference: ${enquiry.id}, From: ${enquiry.email}`, req.socket.remoteAddress || '127.0.0.1');

      // Send Acknowledgement to Patient and Alert to Admin
      let emailStatus = 'dispatched';
      if (Mailer.isSmtpConfigured()) {
        try {
          await Mailer.sendEnquiryAcknowledgementEmail(enquiry);
          DarwinDB.logEmailDelivery(
            enquiry.email,
            'enquiry_acknowledgement',
            `Darwin City Hospital – General Enquiry Received [Ref: ${enquiry.id}]`,
            'sent',
            null,
            enquiry.id
          );
        } catch (e) {
          console.error('[Darwin Enquiry] Acknowledgement email error:', e.message);
          DarwinDB.logEmailDelivery(
            enquiry.email,
            'enquiry_acknowledgement',
            `Darwin City Hospital – General Enquiry Received [Ref: ${enquiry.id}]`,
            'failed',
            e.message,
            enquiry.id
          );
        }

        try {
          await Mailer.sendAdminEnquiryAlertEmail(enquiry);
          DarwinDB.logEmailDelivery(
            Mailer.SMTP_CONFIG.adminEmail,
            'admin_enquiry_alert',
            `[Admin Alert] New Enquiry: ${enquiry.subject} [Ref: ${enquiry.id}]`,
            'sent',
            null,
            enquiry.id
          );
        } catch (e) {
          console.error('[Darwin Enquiry] Admin alert email error:', e.message);
        }
      } else {
        emailStatus = 'smtp_unconfigured';
        DarwinDB.logEmailDelivery(
          enquiry.email,
          'enquiry_acknowledgement',
          `Darwin City Hospital – General Enquiry Received [Ref: ${enquiry.id}]`,
          'failed',
          'Gmail SMTP credentials unconfigured in .env',
          enquiry.id
        );
      }

      return sendJson(res, 201, {
        success: true,
        referenceId: enquiry.id,
        emailStatus,
        message: `Your enquiry [${enquiry.id}] has been submitted. A confirmation email has been dispatched.`,
        enquiry
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 18. Admin Enquiries List: GET /api/admin/enquiries
  if (req.method === 'GET' && pathname === '/api/admin/enquiries') {
    try {
      const category = parsedUrl.searchParams.get('category');
      const status = parsedUrl.searchParams.get('status');
      const list = DarwinDB.getAllGeneralEnquiries(category, status);
      return sendJson(res, 200, { success: true, count: list.length, data: list });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 19. Admin Respond to Enquiry: POST /api/admin/enquiries/respond
  if (req.method === 'POST' && pathname === '/api/admin/enquiries/respond') {
    try {
      const body = await readBody(req);
      if (!body.enquiryId || !body.responseMessage) {
        return sendJson(res, 400, { success: false, error: 'enquiryId and responseMessage are required.' });
      }

      const updated = DarwinDB.updateGeneralEnquiryStatus(body.enquiryId, body.status || 'resolved', body.responseMessage);
      if (!updated) {
        return sendJson(res, 404, { success: false, error: 'Enquiry not found.' });
      }

      // Send Response Email to Customer
      if (Mailer.isSmtpConfigured()) {
        try {
          await Mailer.sendAdminResponseEmail(updated, body.responseMessage);
          DarwinDB.logEmailDelivery(
            updated.email,
            'admin_response',
            `Darwin City Hospital – Response to Your Enquiry [Ref: ${updated.id}]`,
            'sent',
            null,
            updated.id
          );
        } catch (e) {
          console.error('[Darwin Admin] Response email error:', e.message);
          DarwinDB.logEmailDelivery(
            updated.email,
            'admin_response',
            `Darwin City Hospital – Response to Your Enquiry [Ref: ${updated.id}]`,
            'failed',
            e.message,
            updated.id
          );
        }
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Response recorded and customer notification dispatched.',
        enquiry: updated
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 20. Admin Appointments Filtered List: GET /api/admin/appointments
  if (req.method === 'GET' && pathname === '/api/admin/appointments') {
    try {
      const status = parsedUrl.searchParams.get('status');
      const search = parsedUrl.searchParams.get('search');
      const appointments = DarwinDB.getAllAppointmentsFiltered(status, search);
      return sendJson(res, 200, { success: true, count: appointments.length, data: appointments });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 21. Admin Update Appointment Status: POST /api/admin/appointments/update-status
  if (req.method === 'POST' && pathname === '/api/admin/appointments/update-status') {
    try {
      const body = await readBody(req);
      if (!body.appointmentId || !body.status) {
        return sendJson(res, 400, { success: false, error: 'appointmentId and status required.' });
      }
      DarwinDB.updateAppointmentStatus(body.appointmentId, body.status);
      return sendJson(res, 200, { success: true, message: `Appointment ${body.appointmentId} status updated to ${body.status}.` });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 22. Admin Email Delivery Logs: GET /api/admin/email-logs
  if (req.method === 'GET' && pathname === '/api/admin/email-logs') {
    try {
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10);
      const logs = DarwinDB.getEmailDeliveryLogs(limit);
      return sendJson(res, 200, { success: true, count: logs.length, data: logs });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 23. SMTP Status Check: GET /api/smtp/status
  if (req.method === 'GET' && pathname === '/api/smtp/status') {
    const isConfigured = Mailer.isSmtpConfigured();
    return sendJson(res, 200, {
      success: true,
      configured: isConfigured,
      host: Mailer.SMTP_CONFIG.host,
      port: Mailer.SMTP_CONFIG.port,
      user: Mailer.SMTP_CONFIG.user ? Mailer.SMTP_CONFIG.user.replace(/(.{3})(.*)(@.*)/, '$1***$3') : null,
      adminEmail: Mailer.SMTP_CONFIG.adminEmail,
      note: isConfigured
        ? 'Gmail SMTP is configured and operational.'
        : 'Gmail SMTP credentials are unconfigured. Update SMTP_USER and SMTP_PASS (Google App Password) in your .env file.'
    });
  }

  // =========================================================================
  // 24. Digital Check-In: POST /api/checkin
  // =========================================================================
  if (req.method === 'POST' && pathname === '/api/checkin') {
    try {
      const body = await readBody(req);
      if (!body.appointmentRef) {
        return sendJson(res, 400, { success: false, error: 'Appointment reference code is required.' });
      }
      const checkinResult = DarwinDB.checkinAppointment(body.appointmentRef);
      return sendJson(res, 200, {
        success: true,
        message: checkinResult.alreadyCheckedIn
          ? `You are already checked in with ticket ${checkinResult.queueNumber}.`
          : `Check-in successful! Your ticket number is ${checkinResult.queueNumber}.`,
        checkin: checkinResult
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 25. Live Queue Data: GET /api/queue/live
  if (req.method === 'GET' && pathname === '/api/queue/live') {
    try {
      const queueList = DarwinDB.getPublicQueueData();
      return sendJson(res, 200, {
        success: true,
        count: queueList.length,
        timestamp: new Date().toISOString(),
        data: queueList
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 26. Update Queue Status: POST /api/queue/update-status
  if (req.method === 'POST' && pathname === '/api/queue/update-status') {
    try {
      const body = await readBody(req);
      if (!body.checkinId || !body.status) {
        return sendJson(res, 400, { success: false, error: 'checkinId and status required.' });
      }
      const updated = DarwinDB.updateQueueStatus(body.checkinId, body.status);
      return sendJson(res, 200, { success: true, message: `Queue status updated to ${body.status}.`, data: updated });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 27. Patient Family Profiles: GET & POST /api/patient/family
  if (req.method === 'GET' && pathname === '/api/patient/family') {
    try {
      const patientId = Number(parsedUrl.searchParams.get('patientId') || '1');
      const families = DarwinDB.getPatientFamilies(patientId);
      return sendJson(res, 200, { success: true, count: families.length, data: families });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/patient/family') {
    try {
      const body = await readBody(req);
      const patientId = Number(body.patientId || '1');
      if (!body.memberName || !body.relationship) {
        return sendJson(res, 400, { success: false, error: 'Family member name and relationship are required.' });
      }
      const member = DarwinDB.addPatientFamily(patientId, body);
      return sendJson(res, 201, { success: true, message: 'Family member profile added successfully.', data: member });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/patient/family/delete') {
    try {
      const body = await readBody(req);
      const patientId = Number(body.patientId || '1');
      DarwinDB.deletePatientFamily(body.familyId, patientId);
      return sendJson(res, 200, { success: true, message: 'Family profile removed.' });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 28. Payments (Stripe Checkout Simulation): POST /api/payments/create-intent
  if (req.method === 'POST' && pathname === '/api/payments/create-intent') {
    try {
      const body = await readBody(req);
      const amount = body.amountAud || 220;
      const clientSecret = `pi_test_${crypto.randomBytes(12).toString('hex')}_secret_${crypto.randomBytes(8).toString('hex')}`;
      return sendJson(res, 200, {
        success: true,
        clientSecret,
        amountAud: amount,
        currency: 'aud',
        publishableKey: 'pk_test_darwin_mock_hospital_demo_key',
        paymentMethods: ['card', 'apple_pay', 'google_pay']
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 29. Confirm Payment: POST /api/payments/confirm
  if (req.method === 'POST' && pathname === '/api/payments/confirm') {
    try {
      const body = await readBody(req);
      if (!body.appointmentId) {
        return sendJson(res, 400, { success: false, error: 'Appointment ID required for payment processing.' });
      }
      const paymentRecord = DarwinDB.recordPayment({
        appointmentId: body.appointmentId,
        patientId: body.patientId || 1,
        amountAud: body.amountAud || 220,
        currency: 'AUD',
        status: 'paid',
        paymentMethod: body.paymentMethod || 'credit_card',
        stripePaymentIntentId: body.stripePaymentIntentId
      });
      return sendJson(res, 200, {
        success: true,
        message: 'Payment of $' + paymentRecord.amount_aud + ' AUD processed successfully.',
        payment: paymentRecord
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 30. Patient Payment History: GET /api/payments/history
  if (req.method === 'GET' && pathname === '/api/payments/history') {
    try {
      const patientId = Number(parsedUrl.searchParams.get('patientId') || '1');
      const payments = DarwinDB.getPatientPayments(patientId);
      return sendJson(res, 200, { success: true, count: payments.length, data: payments });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 31. Patient Feedback: POST /api/feedback/submit & GET /api/feedback/public
  if (req.method === 'POST' && pathname === '/api/feedback/submit') {
    try {
      const body = await readBody(req);
      if (!body.patientName || !body.ratingOverall) {
        return sendJson(res, 400, { success: false, error: 'Patient name and overall rating are required.' });
      }
      const feedback = DarwinDB.submitFeedback(body);
      return sendJson(res, 201, {
        success: true,
        message: 'Thank you for your feedback! Your review helps us continuously improve Darwin City Hospital.',
        feedback
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  if (req.method === 'GET' && pathname === '/api/feedback/public') {
    try {
      const reviews = DarwinDB.getPublicFeedback(12);
      return sendJson(res, 200, { success: true, count: reviews.length, data: reviews });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 32. Doctor Favorites: POST /api/doctors/favorite & GET /api/doctors/favorites
  if (req.method === 'POST' && pathname === '/api/doctors/favorite') {
    try {
      const body = await readBody(req);
      const patientId = Number(body.patientId || '1');
      if (!body.doctorId) return sendJson(res, 400, { success: false, error: 'Doctor ID required.' });
      const result = DarwinDB.toggleDoctorFavorite(patientId, body.doctorId);
      return sendJson(res, 200, { success: true, favorited: result.favorited });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  if (req.method === 'GET' && pathname === '/api/doctors/favorites') {
    try {
      const patientId = Number(parsedUrl.searchParams.get('patientId') || '1');
      const favorites = DarwinDB.getDoctorFavorites(patientId);
      return sendJson(res, 200, { success: true, data: favorites });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 33. Digital Patient ID: GET /api/patient/id-card
  if (req.method === 'GET' && pathname === '/api/patient/id-card') {
    try {
      const userId = Number(parsedUrl.searchParams.get('userId') || '1');
      const cardData = DarwinDB.getDigitalPatientId(userId);
      if (!cardData) return sendJson(res, 404, { success: false, error: 'Patient ID profile not found.' });
      return sendJson(res, 200, { success: true, data: cardData });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 34. Download Sample Medical Report: GET /api/reports/download/:id
  if (req.method === 'GET' && pathname.startsWith('/api/reports/download/')) {
    try {
      const reportId = Number(pathname.replace('/api/reports/download/', ''));
      const rec = DarwinDB.getMedicalRecordById(reportId);
      if (!rec) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Medical report not found');
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Darwin_Medical_Report_${reportId}.html"`
      });
      return res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Darwin City Hospital — Clinical Report #${reportId}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 2.5rem; background: #fff; color: #1e293b; }
            .watermark { position: fixed; top: 40%; left: 10%; font-size: 3.5rem; font-weight: 900; color: rgba(220, 38, 38, 0.08); transform: rotate(-30deg); pointer-events: none; text-align: center; line-height: 1.2; }
            .header-bar { display: flex; justify-content: space-between; border-bottom: 3px solid #005B96; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .logo-title { font-size: 1.6rem; font-weight: 800; color: #005B96; margin: 0; }
            .logo-sub { font-size: 0.85rem; color: #009688; font-weight: 700; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 8px; margin-bottom: 2rem; }
            .meta-item { font-size: 0.9rem; }
            .meta-item strong { color: #0f172a; }
            .section-title { font-size: 1.15rem; font-weight: 700; color: #005B96; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-top: 1.5rem; }
            .report-box { background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1.25rem; font-size: 0.95rem; line-height: 1.7; margin-top: 0.75rem; white-space: pre-wrap; }
            .footer-notes { margin-top: 3rem; font-size: 0.8rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 1rem; text-align: center; }
            .btn-print { background: #005B96; color: white; border: none; padding: 0.6rem 1.4rem; font-size: 0.9rem; font-weight: 700; border-radius: 6px; cursor: pointer; margin-bottom: 1.5rem; }
            @media print { .btn-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="watermark">SAMPLE CLINICAL REPORT<br>DEMONSTRATION RECORD ONLY</div>
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
          <div class="header-bar">
            <div>
              <h1 class="logo-title">🏥 Darwin City Hospital</h1>
              <div class="logo-sub">Department of Diagnostic Pathology & Imaging • Level-1 Trauma Centre</div>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.3rem;">Mitchell St & Esplanade, Darwin NT 0800 • Phone: (08) 8999 0000</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">REPORT #${rec.id}</div>
              <div style="font-size: 0.85rem; color: #166534; font-weight: 700;">Status: ${rec.status || 'FINALIZED'}</div>
              <div style="font-size: 0.85rem; color: #64748b;">Date: ${rec.record_date}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><strong>Patient Name:</strong> ${rec.patient_name}</div>
            <div class="meta-item"><strong>Medical Record No (MRN):</strong> ${rec.mrn}</div>
            <div class="meta-item"><strong>Attending Specialist:</strong> ${rec.doctor_name}</div>
            <div class="meta-item"><strong>Clinical Category:</strong> ${rec.record_type}</div>
          </div>

          <div class="section-title">Clinical Report Summary & Diagnostic Findings</div>
          <h3 style="margin: 0.75rem 0 0.25rem; font-size: 1.05rem; color: #0f172a;">${rec.title}</h3>
          <div class="report-box">${rec.summary}</div>

          <div style="margin-top: 2rem; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 0.85rem; color: #64748b;">Accreditation: NATA / RCPA Accredited Laboratory NT-8821</div>
              <div style="font-size: 0.85rem; color: #64748b;">Digital Verification Key: ${crypto.createHash('md5').update(rec.id + rec.record_date).digest('hex').substring(0, 16).toUpperCase()}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: 'Brush Script MT', cursive; font-size: 1.8rem; color: #005B96; margin-bottom: 0.2rem;">${rec.doctor_name}</div>
              <div style="border-top: 1px solid #94a3b8; font-size: 0.8rem; color: #475569; padding-top: 0.2rem;">Electronic Clinical Sign-Off</div>
            </div>
          </div>

          <div class="footer-notes">
            SAMPLE CLINICAL REPORT — Fictional Demonstration Record for Darwin City Hospital Portfolio Project.<br>
            Strictly for testing and academic review. Not a valid diagnostic document. In an emergency dial 000.
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 35. Download Sample Prescription: GET /api/prescriptions/download/:id
  if (req.method === 'GET' && pathname.startsWith('/api/prescriptions/download/')) {
    try {
      const rxId = Number(pathname.replace('/api/prescriptions/download/', ''));
      const rx = DarwinDB.getPrescriptionById(rxId);
      if (!rx) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Prescription record not found');
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Darwin_Prescription_${rxId}.html"`
      });
      return res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Darwin City Hospital — e-Prescription #${rxId}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 2.5rem; background: #fff; color: #1e293b; }
            .watermark { position: fixed; top: 40%; left: 8%; font-size: 3rem; font-weight: 900; color: rgba(220, 38, 38, 0.12); transform: rotate(-25deg); pointer-events: none; text-align: center; line-height: 1.3; }
            .header-bar { border-bottom: 2px solid #005B96; padding-bottom: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
            .rx-symbol { font-size: 2.5rem; font-weight: 900; color: #005B96; font-family: 'Times New Roman', serif; }
            .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.92rem; }
            .rx-box { border: 2px dashed #009688; border-radius: 8px; padding: 1.5rem; background: #f0fdf4; margin-bottom: 1.5rem; }
            .med-name { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 0.4rem; }
            .med-detail { font-size: 0.95rem; color: #334155; margin-bottom: 0.3rem; }
            .btn-print { background: #005B96; color: white; border: none; padding: 0.6rem 1.4rem; font-size: 0.9rem; font-weight: 700; border-radius: 6px; cursor: pointer; margin-bottom: 1.5rem; }
            @media print { .btn-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="watermark">SAMPLE — NOT A VALID PRESCRIPTION<br>EDUCATIONAL PORTFOLIO DEMO</div>
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
          
          <div class="header-bar">
            <div>
              <h2 style="margin: 0; color: #005B96;">🏥 Darwin City Hospital</h2>
              <div style="font-size: 0.85rem; color: #009688; font-weight: 700;">PBS CLINICAL PHARMACY PRESCRIPTION</div>
              <div style="font-size: 0.8rem; color: #64748b;">48 Mitchell St, Darwin NT 0800 • Medicare Provider No: 4921841B</div>
            </div>
            <div style="text-align: right;">
              <span class="rx-symbol">℞</span>
              <div style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">SCRIPT ID: RX-${rx.id}</div>
              <div style="font-size: 0.8rem; color: #64748b;">Date: ${rx.issued_date}</div>
            </div>
          </div>

          <div class="meta-box">
            <div class="meta-row"><span><strong>Patient Name:</strong> ${rx.patient_name}</span><span><strong>MRN:</strong> ${rx.mrn}</span></div>
            <div class="meta-row"><span><strong>Prescribing Doctor:</strong> ${rx.doctor_name}</span><span><strong>Credentials:</strong> ${rx.doctor_credentials || 'Consultant Specialist'}</span></div>
          </div>

          <div class="rx-box">
            <div class="med-name">${rx.medication} (${rx.dosage})</div>
            <div class="med-detail"><strong>Directions:</strong> ${rx.frequency}</div>
            <div class="med-detail"><strong>Course Duration:</strong> ${rx.duration}</div>
            <div class="med-detail"><strong>Refills Authorized:</strong> ${rx.refills_left} repeat(s) remaining</div>
            <div class="med-detail"><strong>Special Pharmacy Instructions:</strong> ${rx.pharmacy_instructions || 'Dispense in accordance with standard PBS guidelines.'}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2rem;">
            <div>
              <div style="font-size: 0.8rem; color: #64748b;">PBS Item Code: 89412M • Australian Digital Health Agency SafeScript NT</div>
              <div style="font-size: 0.8rem; color: #64748b;">Security Barcode Token: ${crypto.createHash('sha256').update(rx.id + rx.medication).digest('hex').substring(0, 24).toUpperCase()}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: 'Brush Script MT', cursive; font-size: 1.8rem; color: #005B96;">${rx.doctor_name}</div>
              <div style="border-top: 1px solid #94a3b8; font-size: 0.8rem; color: #475569; padding-top: 0.2rem;">Doctor's Signature & Stamp</div>
            </div>
          </div>

          <div style="margin-top: 3rem; text-align: center; font-size: 0.8rem; color: #dc2626; font-weight: 700; border-top: 1px solid #fee2e2; padding-top: 1rem;">
            ⚠️ SAMPLE – NOT A VALID PRESCRIPTION. For demonstration and portfolio inspection only. Do not present to a pharmacy.
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 36. Multilingual Translation Dictionary: GET /api/translations/:lang
  if (req.method === 'GET' && pathname.startsWith('/api/translations/')) {
    const lang = pathname.replace('/api/translations/', '').toLowerCase();
    const TRANSLATIONS = {
      en: {
        hospital_name: "Darwin City Hospital",
        tagline: "Northern Territory • Australia",
        nav_home: "Home",
        nav_about: "About Us",
        nav_departments: "Departments",
        nav_doctors: "Our Doctors",
        nav_emergency: "Emergency (000)",
        nav_visitors: "Patient & Visitors",
        nav_health_info: "Health Info",
        nav_contact: "Contact Us",
        nav_portal: "Portal Login",
        nav_book: "Book Appointment",
        hero_title: "Your Health, Our Priority.",
        hero_subtitle: "Darwin's premier tertiary healthcare provider and Level-1 Regional Trauma Centre. World-class medical specialists, 24/7 emergency resuscitation, and digital patient services for the Top End community.",
        btn_book_appointment: "Book Appointment",
        btn_find_doctor: "Find a Specialist",
        btn_live_queue: "Live Wait Times",
        btn_telehealth: "Telehealth Clinic",
        emergency_title: "Australian Medical Emergency: Dial 000 Immediately",
        quick_access_title: "Rapid Clinical Services",
        departments_title: "Specialist Medical Departments",
        doctors_title: "Distinguished Medical Specialists",
        testimonials_title: "Community & Patient Testimonials",
        testimonials_note: "Fictional patient feedback presented for demonstration purposes",
        checkin_title: "Digital Appointment Check-in",
        checkin_btn: "Check In Now",
        queue_title: "Real-Time Clinic Queue Status"
      },
      ne: {
        hospital_name: "डार्विन सिटी अस्पताल",
        tagline: "उत्तरी क्षेत्र • अष्ट्रेलिया",
        nav_home: "गृहपृष्ठ",
        nav_about: "हाम्रोबारे",
        nav_departments: "विभागहरू",
        nav_doctors: "हाम्रा डाक्टरहरू",
        nav_emergency: "आकस्मिक सेवा (०००)",
        nav_visitors: "बिरामी र आगन्तुक",
        nav_health_info: "स्वास्थ्य जानकारी",
        nav_contact: "सम्पर्क",
        nav_portal: "पोर्टल लगइन",
        nav_book: "अपोइन्टमेन्ट लिनुहोस्",
        hero_title: "तपाईंको स्वास्थ्य, हाम्रो पहिलो प्राथमिकता।",
        hero_subtitle: "डार्विनको प्रमुख तृतीयक स्वास्थ्य सेवा प्रदायक र लेभल-१ क्षेत्रीय ट्रमा सेन्टर। विश्वस्तरीय विशेषज्ञ डाक्टरहरू, २४/७ आकस्मिक उपचार, र डिजिटल बिरामी सेवाहरू।",
        btn_book_appointment: "अपोइन्टमेन्ट लिनुहोस्",
        btn_find_doctor: "डाक्टर खोज्नुहोस्",
        btn_live_queue: "प्रत्यक्ष पालो हेर्नुहोस्",
        btn_telehealth: "टेलिहेल्थ परामर्श",
        emergency_title: "अष्ट्रेलियाली आकस्मिक स्वास्थ्य आपतकाल: तुरुन्त ००० मा फोन गर्नुहोस्",
        quick_access_title: "द्रुत क्लिनिकल सेवाहरू",
        departments_title: "विशेषज्ञ चिकित्सा विभागहरू",
        doctors_title: "हाम्रा प्रतिष्ठित विशेषज्ञ डाक्टरहरू",
        testimonials_title: "बिरामी प्रतिक्रिया तथा अनुभव",
        testimonials_note: "प्रदर्शन उद्देश्यका लागि काल्पनिक बिरामी प्रतिक्रिया",
        checkin_title: "डिजिटल अपोइन्टमेन्ट चेक-इन",
        checkin_btn: "अहिले चेक-इन गर्नुहोस्",
        queue_title: "प्रत्यक्ष अस्पताल लाम (Queue) स्थिति"
      },
      hi: {
        hospital_name: "डार्विन सिटी अस्पताल",
        tagline: "उत्तरी क्षेत्र • ऑस्ट्रेलिया",
        nav_home: "मुख्य पृष्ठ",
        nav_about: "हमारे बारे में",
        nav_departments: "चिकित्सा विभाग",
        nav_doctors: "हमारे डॉक्टर्स",
        nav_emergency: "आपातकालीन (000)",
        nav_visitors: "रोगी एवं आगंतुक",
        nav_health_info: "स्वास्थ्य जानकारी",
        nav_contact: "संपर्क करें",
        nav_portal: "पोर्टल लॉगिन",
        nav_book: "अपॉइंटमेंट बुक करें",
        hero_title: "आपका स्वास्थ्य, हमारी सर्वोच्च प्राथमिकता।",
        hero_subtitle: "डार्विन का प्रमुख तृतीयक स्वास्थ्य सेवा प्रदाता और लेवल-1 ट्रॉमा सेंटर। विश्व स्तरीय चिकित्सा विशेषज्ञ, 24/7 आपातकालीन सेवाएं और उन्नत डिजिटल रोगी सुविधाएं।",
        btn_book_appointment: "अपॉइंटमेंट बुक करें",
        btn_find_doctor: "विशेषज्ञ खोजें",
        btn_live_queue: "लाइव प्रतीक्षा समय",
        btn_telehealth: "टेलीहेल्थ क्लिनिक",
        emergency_title: "ऑस्ट्रेलियाई आपातकालीन चिकित्सा सहायता: तुरंत 000 डायल करें",
        quick_access_title: "त्वरित नैदानिक सेवाएं",
        departments_title: "विशेषज्ञ चिकित्सा विभाग",
        doctors_title: "हमारे प्रतिष्ठित चिकित्सा विशेषज्ञ",
        testimonials_title: "रोगी समीक्षाएं एवं अनुभव",
        testimonials_note: "प्रदर्शन उद्देश्य के लिए काल्पनिक रोगी प्रतिक्रिया",
        checkin_title: "डिजिटल अपॉइंटमेंट चेक-इन",
        checkin_btn: "अभी चेक-इन करें",
        queue_title: "लाइव क्लिनिक कतार स्थिति"
      }
    };

    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return sendJson(res, 200, { success: true, lang, translations: dict });
  }

  // 37. Automated Reminders: POST /api/reminders/trigger
  if (req.method === 'POST' && pathname === '/api/reminders/trigger') {
    try {
      const result = DarwinDB.runAppointmentReminderCheck();
      return sendJson(res, 200, { success: true, message: 'Automated reminders check completed.', data: result });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 38. Admin CSV Export: GET /api/admin/export-csv
  if (req.method === 'GET' && pathname === '/api/admin/export-csv') {
    try {
      const appointments = DarwinDB.getAllAppointmentsFiltered(null, null);
      let csv = 'Reference,Patient Name,Email,Phone,Doctor,Department,Date,Time,Status,Fee AUD\n';
      appointments.forEach(a => {
        csv += `"${a.id}","${a.patient_name}","${a.patient_email}","${a.patient_phone || ''}","${a.doctor_name}","${a.department_name}","${a.appointment_date}","${a.time_slot}","${a.status}","${a.fee_aud}"\n`;
      });
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="darwin_appointments_export.csv"'
      });
      return res.end(csv);
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
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
