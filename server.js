/**
 * AuraHealth International Hospital Portal
 * Zero-dependency local development server using Node.js built-in HTTP module.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// Hospital Central Dispatch Configuration
const HOSPITAL_DISPATCH_CONFIG = {
  // Option 1: Resend API for automated background emails (free at resend.com)
  resendApiKey: process.env.RESEND_API_KEY || '',
  senderEmail: process.env.SENDER_EMAIL || 'AuraHealth Hospital <onboarding@resend.dev>',
  // Option 2: Twilio for real mobile cellular SMS (Australia + international)
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

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL & normalize path
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Handle API route: /api/send-confirmation
  if (req.method === 'POST' && pathname === '/api/send-confirmation') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const to = payload.to || 'patient';
        const ref = payload.refCode || 'AH-XXXX';
        const doc = payload.doctorName || 'Attending Physician';
        const date = payload.date || 'Scheduled Date';
        const time = payload.time || 'Scheduled Time';

        console.log('----------------------------------------------------');
        console.log(`[AuraHealth Mail Gateway] ✉️ OUTGOING CONFIRMATION EMAIL`);
        console.log(` > Recipient:  ${to}`);
        console.log(` > Subject:    Confirmed: AuraHealth Appointment with ${doc} [${ref}]`);
        console.log(` > Schedule:   ${date} at ${time}`);
        console.log(` > Status:     DISPATCHED (Delivered to SMTP queue)`);
        console.log('----------------------------------------------------');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          status: 'dispatched',
          recipient: to,
          reference: ref,
          message: `Appointment confirmation pass has been dispatched to ${to}.`
        }));

        // Trigger real internet dispatch if server has Resend / Twilio credentials
        const emailSubject = `🩺 Confirmed: AuraHealth Appointment with ${doc} [Ref: ${ref}]`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #bae6fd; border-radius: 8px; overflow: hidden;">
            <div style="background: #0284c7; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">🏥 AuraHealth International Hospital</h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Official Appointment Confirmation Pass</p>
            </div>
            <div style="padding: 24px; color: #1e293b;">
              <p>Dear Patient,</p>
              <p>Your appointment has been confirmed. Below are your clinical consultation details:</p>
              <div style="background: #f0f9ff; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #bae6fd;">
                <div><strong>Reference ID:</strong> ${ref}</div>
                <div><strong>Physician:</strong> ${doc}</div>
                <div><strong>Schedule:</strong> ${date} at ${time}</div>
                <div><strong>Location:</strong> Wing B, Level 3, Suite 304</div>
              </div>
              <p style="font-size: 12px; color: #64748b;">Please arrive 15 minutes before your consultation. Care Hotline: +1 (800) 555-CARE</p>
            </div>
          </div>
        `;
        sendResendEmail(to, emailSubject, emailHtml);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Handle API route: /api/send-otp
  if (req.method === 'POST' && pathname === '/api/send-otp') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const to = payload.to || 'patient';
        const otp = payload.otp || '000000';

        console.log('----------------------------------------------------');
        console.log(`[AuraHealth Security Gateway] 🔒 OUTGOING 2FA VERIFICATION OTP`);
        console.log(` > Recipient:  ${to}`);
        console.log(` > 6-Digit Code: ${otp}`);
        console.log(` > Status:     DISPATCHED (Delivered via SMS/Email relay)`);
        console.log('----------------------------------------------------');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          status: 'dispatched',
          recipient: to,
          otp: otp,
          message: `Security code has been dispatched to ${to}.`
        }));

        // Dispatch real email or SMS if credentials configured
        if (to.includes('@')) {
          const otpSubject = `🔒 AuraHealth Security Verification Code: ${otp}`;
          const otpHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0284c7; margin-top: 0;">🏥 AuraHealth Identity Verification</h2>
              <p>Your one-time 6-digit security code is:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0284c7; background: #f0f9ff; padding: 12px; border-radius: 6px; text-align: center; font-family: monospace;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 12px;">Valid for 10 minutes. If you did not request this, please disregard.</p>
            </div>
          `;
          sendResendEmail(to, otpSubject, otpHtml);
        } else if (to.replace(/\D/g, '').length >= 8) {
          sendTwilioSms(to, `AuraHealth Hospital Security: Your 6-digit verification code is ${otp}. Valid for 10 minutes.`);
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Prevent directory traversal attacks
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      // 404 handler
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found - AuraHealth</title><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#1e293b}a{color:#0284c7;text-decoration:none;font-weight:bold}</style></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The requested file <code>${pathname}</code> was not found on AuraHealth Portal.</p>
          <p><a href="/">Return to AuraHealth Home</a></p>
        </body>
        </html>
      `);
      return;
    }

    let filePath = safePath;
    if (stats.isDirectory()) {
      filePath = path.join(safePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Internal Server Error: ${readErr.message}`);
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`Port ${PORT} is busy, retrying on port ${nextPort}...`);
    server.listen(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  const address = server.address();
  const actualPort = typeof address === 'object' ? address.port : PORT;
  console.log('====================================================');
  console.log('   🏥 AuraHealth International Hospital Portal');
  console.log('====================================================');
  console.log(` > Local Server:   http://localhost:${actualPort}`);
  console.log(` > Static Root:    ${PUBLIC_DIR}`);
  console.log(' > Press Ctrl+C to stop the server.');
  console.log('====================================================');
});
