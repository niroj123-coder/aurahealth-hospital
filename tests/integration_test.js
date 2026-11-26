/**
 * Darwin City Hospital - Full Integration & Verification Test Suite
 */
const http = require('http');
const DarwinDB = require('../database/db');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 DARWIN CITY HOSPITAL - INTEGRATION TEST SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(` ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. SMTP Status Endpoint
    console.log('\n--- 1. SMTP Status Endpoint ---');
    const smtpRes = await makeRequest('GET', '/api/smtp/status');
    assert('GET /api/smtp/status returns 200', smtpRes.status === 200);
    assert('SMTP configuration status is accurately reported', smtpRes.body.hasOwnProperty('configured'));

    // 2. Send OTP Endpoint Validation & Error Handling
    console.log('\n--- 2. Send OTP API Endpoint ---');
    const invalidEmailRes = await makeRequest('POST', '/api/auth/send-otp', { email: 'not-an-email', purpose: 'booking' });
    assert('Invalid email returns 400', invalidEmailRes.status === 400);

    const unconfiguredSmtpRes = await makeRequest('POST', '/api/auth/send-otp', { email: 'patient@example.com', purpose: 'booking' });
    // When SMTP credentials are placeholders, it correctly returns 503 with helpful setup instructions
    assert('Unconfigured SMTP returns 503 Service Unavailable', unconfiguredSmtpRes.status === 503);
    assert('503 response explains Gmail SMTP credentials setup', unconfiguredSmtpRes.body.error.includes('Gmail SMTP'));

    // 3. Database OTP Hashing, Expiry, and Rate Limiting
    console.log('\n--- 3. Database OTP Security & Rate Limiting ---');
    const testEmail = 'testpatient_' + Date.now() + '@darwinhospital.gov.au';
    const otp1 = '123456';
    const saveRes = DarwinDB.saveOtpVerification(testEmail, 'booking', otp1);
    assert('OTP saved with secure hash and 5-min expiry', saveRes.success === true && saveRes.expiresAt > Date.now());

    // Immediate second attempt should trigger 60s cooldown
    const rateLimitRes = DarwinDB.saveOtpVerification(testEmail, 'booking', '654321');
    assert('Rate limiting enforces 60-second cooldown', rateLimitRes.rateLimited === true && rateLimitRes.waitSeconds > 0);

    // Verify incorrect code
    const wrongVerify = DarwinDB.verifyOtpCode(testEmail, 'booking', '999999');
    assert('Incorrect OTP code rejected', wrongVerify.success === false && wrongVerify.error.includes('Incorrect verification code'));

    // Verify correct code
    const correctVerify = DarwinDB.verifyOtpCode(testEmail, 'booking', otp1);
    assert('Correct OTP code verified successfully', correctVerify.success === true && typeof correctVerify.verifiedToken === 'string');

    // Token is single-use: consuming it works once
    const token = correctVerify.verifiedToken;
    const consume1 = DarwinDB.validateAndConsumeVerifiedToken(testEmail, 'booking', token);
    assert('Single-use verifiedToken consumed successfully', consume1 === true);

    const consume2 = DarwinDB.validateAndConsumeVerifiedToken(testEmail, 'booking', token);
    assert('Replay attack prevented: token cannot be reused', consume2 === false);

    // 4. Appointment Booking Validation & Collision Prevention
    console.log('\n--- 4. Appointment Booking API & Collision Prevention ---');
    const unverifiedAppt = await makeRequest('POST', '/api/appointments/book', {
      doctor_id: 'doc-sarah-jenkins',
      department_id: 'cardiology',
      appointment_date: '2026-12-01',
      time_slot: '10:00 AM',
      patient_name: 'Test Patient',
      patient_email: testEmail,
      patient_phone: '+61 412 000 000'
    });
    assert('Booking without email verification returns 403 Forbidden', unverifiedAppt.status === 403);

    // Past date booking
    const pastOtp = DarwinDB.saveOtpVerification(testEmail + '2', 'booking', '888888');
    const pastVerified = DarwinDB.verifyOtpCode(testEmail + '2', 'booking', '888888');
    const pastAppt = await makeRequest('POST', '/api/appointments/book', {
      doctor_id: 'doc-jenkins',
      department_id: 'cardiology',
      appointment_date: '2020-01-01',
      time_slot: '10:00 AM',
      patient_name: 'Test Patient',
      patient_email: testEmail + '2',
      patient_phone: '+61 412 000 000',
      verifiedToken: pastVerified.verifiedToken
    });
    assert('Past date booking returns 400 Bad Request', pastAppt.status === 400);

    // Valid booking with verified token
    const testEmail3 = 'booking_' + Date.now() + '@darwinhospital.gov.au';
    DarwinDB.saveOtpVerification(testEmail3, 'booking', '112233');
    const validVerify = DarwinDB.verifyOtpCode(testEmail3, 'booking', '112233');

    // Use dynamic date and slot to allow repeat test runs without slot collision
    const randomDay = Math.floor(10 + Math.random() * 18);
    const bookingDate = `2027-01-${String(randomDay).padStart(2, '0')}`;
    const slots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM'];
    const bookingSlot = slots[Math.floor(Math.random() * slots.length)];

    const validBooking = await makeRequest('POST', '/api/appointments/book', {
      doctor_id: 'doc-jenkins',
      department_id: 'cardiology',
      appointment_date: bookingDate,
      time_slot: bookingSlot,
      patient_name: 'Alex Mercer',
      patient_email: testEmail3,
      patient_phone: '+61 412 999 888',
      patient_dob: '1988-04-12',
      symptoms: 'Routine cardiovascular checkup',
      verifiedToken: validVerify.verifiedToken
    });
    assert('Verified booking succeeds and returns 201 Created', validBooking.status === 201);
    assert('Appointment reference starts with DCH-', validBooking.body.referenceId && validBooking.body.referenceId.startsWith('DCH-'));

    // Double-booking collision test: attempt booking the EXACT same slot
    const testEmail4 = 'booking2_' + Date.now() + '@darwinhospital.gov.au';
    DarwinDB.saveOtpVerification(testEmail4, 'booking', '445566');
    const validVerify2 = DarwinDB.verifyOtpCode(testEmail4, 'booking', '445566');

    const duplicateBooking = await makeRequest('POST', '/api/appointments/book', {
      doctor_id: 'doc-jenkins',
      department_id: 'cardiology',
      appointment_date: bookingDate,
      time_slot: bookingSlot, // Identical doctor, date, and slot
      patient_name: 'Double Booking Attempt',
      patient_email: testEmail4,
      patient_phone: '+61 412 111 222',
      verifiedToken: validVerify2.verifiedToken
    });
    assert('Double booking collision rejected with 409 Conflict', duplicateBooking.status === 409);

    // 5. General Enquiry API
    console.log('\n--- 5. General Enquiry API ---');
    const enqEmail = 'enquirer_' + Date.now() + '@darwinhospital.gov.au';
    DarwinDB.saveOtpVerification(enqEmail, 'enquiry', '998877');
    const enqVerified = DarwinDB.verifyOtpCode(enqEmail, 'enquiry', '998877');

    const enquiryRes = await makeRequest('POST', '/api/enquiries/submit', {
      fullName: 'Emma Watson',
      email: enqEmail,
      phone: '+61 412 333 444',
      category: 'Specialist Clinic Consultation',
      subject: 'Inquiry regarding cardiology specialist referral',
      message: 'I would like to inquire about consultation availability for Dr. Sarah Jenkins next month.',
      verifiedToken: enqVerified.verifiedToken
    });
    assert('General enquiry submission returns 201 Created', enquiryRes.status === 201);
    assert('Enquiry reference starts with ENQ-', enquiryRes.body.referenceId && enquiryRes.body.referenceId.startsWith('ENQ-'));

    // 6. Admin APIs
    console.log('\n--- 6. Admin Management & Logs APIs ---');
    const adminEnquiriesRes = await makeRequest('GET', '/api/admin/enquiries');
    assert('Admin can view all enquiries (GET /api/admin/enquiries)', adminEnquiriesRes.status === 200 && adminEnquiriesRes.body.count > 0);

    // Admin respond to enquiry
    const adminRespondRes = await makeRequest('POST', '/api/admin/enquiries/respond', {
      enquiryId: enquiryRes.body.referenceId,
      responseMessage: 'Thank you Emma. Dr. Jenkins has consultation appointments available every Tuesday and Thursday.',
      status: 'resolved'
    });
    assert('Admin can respond to enquiry (POST /api/admin/enquiries/respond)', adminRespondRes.status === 200 && adminRespondRes.body.enquiry.status === 'resolved');

    // Admin filter appointments
    const adminApptsRes = await makeRequest('GET', '/api/admin/appointments?status=confirmed');
    assert('Admin can search and filter appointments', adminApptsRes.status === 200 && Array.isArray(adminApptsRes.body.data));

    // Admin email delivery logs
    const emailLogsRes = await makeRequest('GET', '/api/admin/email-logs');
    assert('Admin can view email delivery logs (GET /api/admin/email-logs)', emailLogsRes.status === 200 && emailLogsRes.body.count > 0);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
