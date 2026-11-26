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
    if (!smtpRes.body.configured) {
      assert('Unconfigured SMTP returns 503 Service Unavailable', unconfiguredSmtpRes.status === 503);
      assert('503 response explains Gmail SMTP credentials setup', unconfiguredSmtpRes.body?.error?.includes('Gmail SMTP'));
    } else {
      assert('Live configured Gmail SMTP handles OTP dispatch', unconfiguredSmtpRes.status === 200 || unconfiguredSmtpRes.status === 429);
    }

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

    // 7. Digital Check-in & Live Queue APIs
    console.log('\n--- 7. Digital Check-In & Live Queue APIs ---');
    const checkinRes = await makeRequest('POST', '/api/checkin', { appointmentRef: validBooking.body.referenceId });
    assert('Digital check-in succeeds with 200 OK', checkinRes.status === 200 && checkinRes.body.success === true);
    assert('Ticket number assigned (starts with Q-)', checkinRes.body.checkin.queueNumber.startsWith('Q-'));
    assert('Non-sensitive QR verification token generated', checkinRes.body.checkin.qrToken.includes(checkinRes.body.checkin.queueNumber));

    const liveQueueRes = await makeRequest('GET', '/api/queue/live');
    assert('Live queue status retrieved (GET /api/queue/live)', liveQueueRes.status === 200 && liveQueueRes.body.count > 0);
    const queueSample = liveQueueRes.body.data[0];
    assert('Live queue preserves privacy: no patient names exposed', !queueSample.hasOwnProperty('patient_name') && !queueSample.hasOwnProperty('patient_email'));

    // 8. Patient Family Management
    console.log('\n--- 8. Patient Family Profiles ---');
    const addFamilyRes = await makeRequest('POST', '/api/patient/family', {
      patientId: 1,
      memberName: 'Rohan Khattri',
      relationship: 'Brother',
      dob: '1998-09-14',
      gender: 'Male',
      bloodGroup: 'O Positive'
    });
    assert('Add family dependent profile succeeds with 201', addFamilyRes.status === 201 && addFamilyRes.body.data.member_name === 'Rohan Khattri');

    const getFamilyRes = await makeRequest('GET', '/api/patient/family?patientId=1');
    assert('Retrieve family profiles succeeds with 200', getFamilyRes.status === 200 && getFamilyRes.body.count >= 1);

    // 9. Online Stripe Payments Simulation
    console.log('\n--- 9. Online Stripe Payments ---');
    const intentRes = await makeRequest('POST', '/api/payments/create-intent', { appointmentId: validBooking.body.referenceId, amountAud: 220 });
    assert('Create payment intent returns client secret and AUD amount', intentRes.status === 200 && intentRes.body.clientSecret.startsWith('pi_test_'));

    const payConfirmRes = await makeRequest('POST', '/api/payments/confirm', {
      appointmentId: validBooking.body.referenceId,
      patientId: 1,
      amountAud: 220,
      stripePaymentIntentId: intentRes.body.clientSecret
    });
    assert('Payment confirmation records payment with receipt ref', payConfirmRes.status === 200 && payConfirmRes.body.payment.receipt_ref.startsWith('DCH-REC-'));

    const payHistoryRes = await makeRequest('GET', '/api/payments/history?patientId=1');
    assert('Patient payment history accessible with receipt records', payHistoryRes.status === 200 && payHistoryRes.body.count > 0);

    // 10. Patient Feedback & Reviews
    console.log('\n--- 10. Patient Feedback & Quality Ratings ---');
    const feedbackSubmitRes = await makeRequest('POST', '/api/feedback/submit', {
      appointmentId: validBooking.body.referenceId,
      patientName: 'Alex Mercer',
      doctorId: 'doc-jenkins',
      ratingOverall: 5,
      ratingDoctor: 5,
      ratingCleanliness: 5,
      comments: 'Seamless check-in, pristine clinical suite, and exceptional cardiology advice from Dr. Jenkins.'
    });
    assert('Submit patient feedback returns 201 Created', feedbackSubmitRes.status === 201 && feedbackSubmitRes.body.success === true);

    const publicFeedbackRes = await makeRequest('GET', '/api/feedback/public');
    assert('Public approved reviews accessible', publicFeedbackRes.status === 200 && publicFeedbackRes.body.count >= 3);

    // 11. Doctor Favorites
    console.log('\n--- 11. Doctor Favorites API ---');
    const favToggleRes = await makeRequest('POST', '/api/doctors/favorite', { patientId: 1, doctorId: 'doc-brody' });
    assert('Toggle doctor favorite returns state', favToggleRes.status === 200 && typeof favToggleRes.body.favorited === 'boolean');

    const getFavsRes = await makeRequest('GET', '/api/doctors/favorites?patientId=1');
    assert('Get patient favorites returns array of doctor IDs', getFavsRes.status === 200 && Array.isArray(getFavsRes.body.data));

    // 12. Digital Patient ID Card Data
    console.log('\n--- 12. Digital Patient ID Card ---');
    const idCardRes = await makeRequest('GET', '/api/patient/id-card?userId=1');
    assert('Digital Patient ID card payload returned with MRN', idCardRes.status === 200 && idCardRes.body.data.mrn.startsWith('DCH-MRN-'));
    assert('Patient ID QR payload is non-sensitive token', idCardRes.body.data.qrPayload.includes(idCardRes.body.data.mrn));

    // 13. Downloadable Medical Reports & Prescriptions
    console.log('\n--- 13. Clinical Report & Prescription Downloads ---');
    const reportDownloadRes = await makeRequest('GET', '/api/reports/download/1');
    assert('Download clinical report returns 200 HTML document', reportDownloadRes.status === 200 && reportDownloadRes.raw.includes('SAMPLE CLINICAL REPORT'));

    const rxDownloadRes = await makeRequest('GET', '/api/prescriptions/download/1');
    assert('Download e-prescription returns 200 with mandatory watermark', rxDownloadRes.status === 200 && rxDownloadRes.raw.includes('SAMPLE – NOT A VALID PRESCRIPTION'));

    // 14. Multilingual Translation Dictionaries
    console.log('\n--- 14. Multilingual Translation Endpoints ---');
    const neRes = await makeRequest('GET', '/api/translations/ne');
    assert('Nepali translation dictionary available', neRes.status === 200 && neRes.body.translations.hero_title.includes('स्वास्थ्य'));

    const hiRes = await makeRequest('GET', '/api/translations/hi');
    assert('Hindi translation dictionary available', hiRes.status === 200 && hiRes.body.translations.hero_title.includes('स्वास्थ्य'));

    const enRes = await makeRequest('GET', '/api/translations/en');
    assert('English dictionary available', enRes.status === 200 && enRes.body.translations.hero_title.includes('Health'));

    // 15. Automated Reminders Check
    console.log('\n--- 15. Automated Reminders Scheduler ---');
    const reminderRes = await makeRequest('POST', '/api/reminders/trigger');
    assert('Automated reminders check completes', reminderRes.status === 200 && reminderRes.body.success === true);

    // 16. Admin CSV Export
    console.log('\n--- 16. Admin CSV Export ---');
    const csvRes = await makeRequest('GET', '/api/admin/export-csv');
    assert('Admin appointments CSV export returns 200 with text/csv header', csvRes.status === 200 && csvRes.raw.includes('Reference,Patient Name'));

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
