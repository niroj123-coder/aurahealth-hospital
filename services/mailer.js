/**
 * Darwin City Hospital — Mailer Service
 * Powered by Nodemailer with Gmail SMTP
 * Fully configurable via environment variables (.env)
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@darwinhospital.gov.au'
};

function isSmtpConfigured() {
  const user = SMTP_CONFIG.user ? SMTP_CONFIG.user.trim() : '';
  const pass = SMTP_CONFIG.pass ? SMTP_CONFIG.pass.trim() : '';
  if (!user || !pass) return false;
  if (user === 'your-email@gmail.com' || pass === 'your-google-app-password') return false;
  if (user.includes('example.com') || pass.includes('your-')) return false;
  return true;
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    throw new Error(
      'Gmail SMTP credentials missing or unconfigured. Please configure SMTP_USER and SMTP_PASS (Google App Password) in your .env file.'
    );
  }

  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: SMTP_CONFIG.user,
      pass: SMTP_CONFIG.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Send 6-Digit OTP Email Verification
 */
async function sendVerificationOtpEmail(toEmail, otp) {
  if (!isSmtpConfigured()) {
    throw new Error(
      'Gmail SMTP credentials are not configured. Please set your Gmail address (SMTP_USER) and 16-character Google App Password (SMTP_PASS) in the .env file to enable real email dispatch.'
    );
  }

  const transporter = getTransporter();

  const textBody = 
`Dear Customer,

Your email verification code is: ${otp}

This code is valid for five minutes.
Please do not share this code with anyone.

Darwin City Hospital – Demonstration Project`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F8FB; margin: 0; padding: 20px; color: #0F172A; }
        .email-container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(15,23,42,0.06); }
        .header { background: #005B96; color: #FFFFFF; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 4px 0 0; font-size: 13px; color: #E0F2FE; }
        .content { padding: 32px 28px; }
        .otp-box { background: #F0F7FC; border: 2px dashed #005B96; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #005B96; font-family: 'Consolas', monospace; }
        .expiry-note { font-size: 13px; color: #DC2626; font-weight: 600; margin-top: 8px; }
        .footer { background: #F8FAFC; padding: 18px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏥 Darwin City Hospital</h1>
          <p>Premier Healthcare & Level-1 Trauma Centre • Darwin NT Australia</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-top: 0;">Dear Customer,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            You have initiated an email verification request for your Darwin City Hospital clinical consultation or enquiry. Please enter the one-time verification code below:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry-note">⏱️ This verification code is valid for exactly 5 minutes.</div>
          </div>
          <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
            Please do not share this code with anyone. If you did not make this request, you can safely disregard this email.
          </p>
        </div>
        <div class="footer">
          Darwin City Hospital – Demonstration Project • Rocklands Drive, Tiwi NT 0810, Darwin Australia<br>
          For genuine Australian medical emergencies, dial <strong>000</strong> immediately.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Darwin City Hospital" <${SMTP_CONFIG.user}>`,
    to: toEmail,
    subject: 'Darwin City Hospital – Email Verification',
    text: textBody,
    html: htmlBody
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Send Official Appointment Confirmation Email
 */
async function sendAppointmentConfirmationEmail(appt) {
  if (!isSmtpConfigured()) {
    throw new Error(
      'Gmail SMTP credentials are not configured. Cannot dispatch appointment confirmation email.'
    );
  }

  const transporter = getTransporter();

  const textBody = 
`Dear ${appt.patient_name},

Your appointment has been officially confirmed at Darwin City Hospital.

Consultation Details:
- Reference Number: ${appt.id}
- Doctor: ${appt.doctor_name}
- Department: ${appt.department_name}
- Date: ${appt.appointment_date}
- Time: ${appt.time_slot} (ACST)
- Status: Confirmed
- Consultation Mode: ${appt.consultation_type || 'In-Person Consultation'}
- Location: ${appt.doctor_room || 'Wing A, Specialist Suites'}

Cancellation / Rescheduling:
If you need to reschedule or cancel your consultation, please visit our online Patient Portal or call (08) 8999 0000 at least 24 hours in advance.

Darwin City Hospital – Demonstration Project
Rocklands Drive, Tiwi NT 0810, Darwin Australia`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F8FB; margin: 0; padding: 20px; color: #0F172A; }
        .email-container { max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(15,23,42,0.06); }
        .header { background: #005B96; color: #FFFFFF; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 4px 0 0; font-size: 13px; color: #E0F2FE; }
        .content { padding: 30px 24px; }
        .badge { display: inline-block; background: #DCFCE7; color: #16A34A; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; }
        .summary-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748B; font-weight: 600; }
        .value { color: #0F172A; font-weight: 700; text-align: right; }
        .instruction-box { background: #F0FDF4; border-left: 4px solid #16A34A; padding: 14px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #166534; line-height: 1.5; }
        .footer { background: #F8FAFC; padding: 18px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏥 Darwin City Hospital</h1>
          <p>Official Specialist Consultation Confirmation Pass</p>
        </div>
        <div class="content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <p style="font-size: 16px; margin: 0;">Dear <strong>${appt.patient_name}</strong>,</p>
            <span class="badge">✓ Confirmed</span>
          </div>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 16px;">
            Your clinical consultation at Darwin City Hospital has been officially scheduled. Please present this reference number or pass upon arrival.
          </p>

          <div class="summary-card">
            <div class="row">
              <span class="label">Appointment Reference</span>
              <span class="value" style="color: #005B96; font-size: 15px;">${appt.id}</span>
            </div>
            <div class="row">
              <span class="label">Attending Specialist</span>
              <span class="value">${appt.doctor_name}</span>
            </div>
            <div class="row">
              <span class="label">Medical Department</span>
              <span class="value" style="color: #009688;">${appt.department_name}</span>
            </div>
            <div class="row">
              <span class="label">Date & Time</span>
              <span class="value">${appt.appointment_date} at ${appt.time_slot} (ACST)</span>
            </div>
            <div class="row">
              <span class="label">Consultation Mode</span>
              <span class="value">${appt.consultation_type || 'In-Person Consultation'}</span>
            </div>
            <div class="row">
              <span class="label">Clinical Location</span>
              <span class="value">${appt.doctor_room || 'Wing A, Specialist Suites'}</span>
            </div>
            <div class="row">
              <span class="label">Consultation Fee</span>
              <span class="value">$${appt.fee_aud || 220} AUD</span>
            </div>
          </div>

          <div class="instruction-box">
            <strong>📋 Instructions for Your Visit:</strong><br>
            • Please arrive 15 minutes prior to your scheduled time.<br>
            • Bring photo ID, Medicare card, or private health insurance details.<br>
            • <strong>Rescheduling or Cancellation:</strong> You may reschedule or cancel your visit through the Darwin City Hospital Patient Portal or by calling our Outpatient Desk on (08) 8999 0000 at least 24 hours in advance.
          </div>
        </div>
        <div class="footer">
          Darwin City Hospital – Demonstration Project • Rocklands Drive, Tiwi NT 0810, Darwin Australia<br>
          Non-Emergency: (08) 8999 0000 • In a medical emergency in Australia, dial <strong>000</strong>.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Darwin City Hospital" <${SMTP_CONFIG.user}>`,
    to: appt.patient_email,
    subject: `Darwin City Hospital – Appointment Confirmation [Ref: ${appt.id}]`,
    text: textBody,
    html: htmlBody
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Send General Enquiry Acknowledgement Email to Customer
 */
async function sendEnquiryAcknowledgementEmail(enquiry) {
  if (!isSmtpConfigured()) {
    throw new Error('Gmail SMTP credentials are not configured.');
  }

  const transporter = getTransporter();

  const textBody = 
`Dear ${enquiry.full_name},

Thank you for contacting Darwin City Hospital. We have received your general enquiry.

Enquiry Reference: ${enquiry.id}
Category: ${enquiry.enquiry_category}
Subject: ${enquiry.subject}

Our hospital concierge and administrative team will review your message and respond within 1-2 business days.

Darwin City Hospital – Demonstration Project
Rocklands Drive, Tiwi NT 0810, Darwin Australia`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F8FB; margin: 0; padding: 20px; color: #0F172A; }
        .email-container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; }
        .header { background: #005B96; color: #FFFFFF; padding: 24px; text-align: center; }
        .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #334155; }
        .ref-box { background: #F0F7FC; border: 1px solid #BAE6FD; padding: 14px; border-radius: 6px; margin: 18px 0; }
        .footer { background: #F8FAFC; padding: 16px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h2 style="margin: 0; font-size: 20px;">🏥 Darwin City Hospital</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #E0F2FE;">General Enquiry Acknowledgement</p>
        </div>
        <div class="content">
          <p>Dear <strong>${enquiry.full_name}</strong>,</p>
          <p>Thank you for reaching out to Darwin City Hospital. We have received your enquiry and our outpatient concierge team is reviewing it.</p>
          <div class="ref-box">
            <div><strong>Enquiry Reference:</strong> ${enquiry.id}</div>
            <div><strong>Category:</strong> ${enquiry.enquiry_category}</div>
            <div><strong>Subject:</strong> ${enquiry.subject}</div>
          </div>
          <p>Our team aims to respond to all general enquiries within 1 to 2 business days. If your query is urgent, please call our Outpatient Reception desk at (08) 8999 0000.</p>
        </div>
        <div class="footer">
          Darwin City Hospital – Demonstration Project • Rocklands Drive, Tiwi NT 0810, Darwin Australia
        </div>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"Darwin City Hospital" <${SMTP_CONFIG.user}>`,
    to: enquiry.email,
    subject: `Darwin City Hospital – General Enquiry Received [Ref: ${enquiry.id}]`,
    text: textBody,
    html: htmlBody
  });
}

/**
 * Send Enquiry Alert to Hospital Administration Email
 */
async function sendAdminEnquiryAlertEmail(enquiry) {
  if (!isSmtpConfigured()) return Promise.resolve(null);

  const transporter = getTransporter();
  const adminTarget = SMTP_CONFIG.adminEmail;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
      <h2 style="color: #005B96; margin-top: 0;">🏥 [Admin Alert] New Patient General Enquiry</h2>
      <p>A new enquiry was submitted via the Darwin City Hospital website:</p>
      <div style="background: #F8FAFC; padding: 14px; border-radius: 6px; margin: 12px 0;">
        <div><strong>Reference:</strong> ${enquiry.id}</div>
        <div><strong>Sender:</strong> ${enquiry.full_name}</div>
        <div><strong>Email:</strong> ${enquiry.email}</div>
        <div><strong>Phone:</strong> ${enquiry.phone || 'Not provided'}</div>
        <div><strong>Category:</strong> ${enquiry.enquiry_category}</div>
        <div><strong>Subject:</strong> ${enquiry.subject}</div>
      </div>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #F1F5F9; border-left: 3px solid #005B96; padding: 10px 14px; margin: 0; font-style: italic;">
        ${enquiry.message}
      </blockquote>
      <p style="font-size: 12px; color: #64748B; margin-top: 20px;">
        You can review and update this enquiry directly in the Darwin City Hospital Admin Console.
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"Darwin Hospital Dispatch" <${SMTP_CONFIG.user}>`,
    to: adminTarget,
    subject: `[Admin Alert] New Enquiry: ${enquiry.subject} [Ref: ${enquiry.id}]`,
    html: htmlBody
  });
}

/**
 * Send Admin Response to Customer Enquiry
 */
async function sendAdminResponseEmail(enquiry, responseMessage) {
  if (!isSmtpConfigured()) {
    throw new Error('Gmail SMTP credentials are not configured.');
  }

  const transporter = getTransporter();

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
      <div style="background: #005B96; color: white; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">🏥 Darwin City Hospital</h2>
        <p style="margin: 4px 0 0; font-size: 13px;">Outpatient Administration Response</p>
      </div>
      <p>Dear <strong>${enquiry.full_name}</strong>,</p>
      <p>This is an official reply to your clinical enquiry <strong>[${enquiry.id}]</strong> regarding <em>"${enquiry.subject}"</em>:</p>
      <div style="background: #F0F7FC; border-left: 4px solid #005B96; padding: 14px 18px; margin: 18px 0; border-radius: 4px; line-height: 1.6; color: #0F172A;">
        ${responseMessage.replace(/\n/g, '<br>')}
      </div>
      <p style="font-size: 13px; color: #64748B;">
        For further questions or to schedule a specialist consultation, please visit our website or contact our Outpatient Reception desk on (08) 8999 0000.
      </p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
      <p style="font-size: 11px; color: #94A3B8; text-align: center;">
        Darwin City Hospital • Rocklands Drive, Tiwi NT 0810, Darwin Australia
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"Darwin City Hospital" <${SMTP_CONFIG.user}>`,
    to: enquiry.email,
    subject: `Darwin City Hospital – Response to Your Enquiry [Ref: ${enquiry.id}]`,
    html: htmlBody
  });
}

module.exports = {
  isSmtpConfigured,
  sendVerificationOtpEmail,
  sendAppointmentConfirmationEmail,
  sendEnquiryAcknowledgementEmail,
  sendAdminEnquiryAlertEmail,
  sendAdminResponseEmail,
  SMTP_CONFIG
};
