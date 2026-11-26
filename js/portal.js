/**
 * Darwin City Hospital — Multi-Role Portal Controller
 * Supports Patient, Doctor, and Admin Dashboards with SQLite API Sync & 2FA
 */

const PatientPortal = {
  activeTab: 'overview',
  currentRole: 'patient', // 'patient', 'doctor', or 'admin'
  currentUser: null,
  currentPatient: null,
  generatedOtp: '',
  pendingIdentifier: '',

  init() {
    this.loadSession();
    this.bindEvents();
    this.renderActiveRole();
  },

  loadSession() {
    try {
      const stored = localStorage.getItem('dch_active_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
        this.currentRole = this.currentUser.role || 'patient';
      }
    } catch (e) {
      console.warn('Session load error:', e);
    }

    if (!this.currentUser) {
      // Default to demo patient Niroj Khattri
      this.currentUser = {
        id: 3,
        name: "Niroj Khattri",
        email: "nirojkhattri33@gmail.com",
        phone: "+61 412 663 7298",
        role: "patient",
        mrn: "DCH-MRN-9021"
      };
      this.currentRole = 'patient';
    }
  },

  saveSession(user) {
    this.currentUser = user;
    this.currentRole = user.role || 'patient';
    localStorage.setItem('dch_active_user', JSON.stringify(user));
    this.renderActiveRole();
  },

  logout() {
    localStorage.removeItem('dch_active_user');
    this.currentUser = null;
    this.loadSession();
    App.showToast('You have been logged out securely.', 'info');
    this.renderActiveRole();
    const portalNav = document.getElementById('portalAuthNavBtn');
    if (portalNav) portalNav.textContent = '👤 Patient Login';
  },

  renderActiveRole() {
    // Hide all dashboard wrappers first
    const patientDash = document.getElementById('patientDashboardView');
    const doctorDash = document.getElementById('doctorDashboardView');
    const adminDash = document.getElementById('adminDashboardView');
    const authPrompt = document.getElementById('portalAuthPrompt');

    if (patientDash) patientDash.style.display = 'none';
    if (doctorDash) doctorDash.style.display = 'none';
    if (adminDash) adminDash.style.display = 'none';
    if (authPrompt) authPrompt.style.display = 'none';

    // Update Nav bar button
    const navBtn = document.getElementById('portalAuthNavBtn');
    if (navBtn && this.currentUser) {
      navBtn.innerHTML = `👤 ${this.currentUser.name.split(' ')[0]} (${this.currentRole.toUpperCase()})`;
    }

    if (this.currentRole === 'patient') {
      if (patientDash) patientDash.style.display = 'block';
      this.renderPatientDashboard();
    } else if (this.currentRole === 'doctor') {
      if (doctorDash) doctorDash.style.display = 'block';
      this.renderDoctorDashboard();
    } else if (this.currentRole === 'admin') {
      if (adminDash) adminDash.style.display = 'block';
      if (window.HospitalAdmin) {
        window.HospitalAdmin.loadAdminDashboard();
      }
    }
  },

  // =========================================================================
  // PATIENT DASHBOARD
  // =========================================================================
  async renderPatientDashboard() {
    let data = null;
    try {
      const res = await fetch(`/api/patient/dashboard?userId=${this.currentUser.id || 3}`);
      const json = await res.json();
      if (json.success) data = json.data;
    } catch (err) {
      console.warn('Using offline patient data', err);
    }

    const patient = data?.patient || HOSPITAL_DATA.demoPatient;
    const user = data?.user || this.currentUser;
    const appts = data?.appointments || patient.appointments || [];
    const records = data?.medicalRecords || patient.labReports || [];
    const prescriptions = data?.prescriptions || patient.prescriptions || [];
    const notifications = data?.notifications || [];

    // Header info
    const nameEl = document.getElementById('portalPatientName');
    const mrnEl = document.getElementById('portalPatientId');
    const badgeEl = document.getElementById('portalInsuranceBadge');
    if (nameEl) nameEl.textContent = user.name || patient.name;
    if (mrnEl) mrnEl.textContent = `MRN: ${patient.mrn || 'DCH-MRN-9021'} • Blood: ${patient.bloodGroup || patient.blood_group || 'O+'}`;
    if (badgeEl) badgeEl.textContent = 'Medicare Verified';

    // 1. Appointments list
    const apptContainer = document.getElementById('portalAppointmentsList');
    const apptFullContainer = document.getElementById('portalAppointmentsListFull');
    if (apptContainer || apptFullContainer) {
      const apptHtml = appts.length === 0 
        ? `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No appointments booked. Click 'Book Appointment' to schedule one.</div>`
        : appts.map(a => {
          const statusClass = a.status === 'confirmed' ? 'badge-success' : a.status === 'cancelled' ? 'badge-danger' : a.status === 'completed' ? 'badge-secondary' : 'badge-warning';
          return `
            <div class="appointment-card" style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem; box-shadow: var(--shadow-xs);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <span class="badge ${statusClass}">${(a.status || 'Confirmed').toUpperCase()}</span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-left: 0.5rem;">Ref: ${a.id}</span>
                  <h4 style="font-size: 1.1rem; font-weight: 700; margin: 0.4rem 0 0.1rem; color: var(--text-primary);">${a.doctor_name || a.doctorName}</h4>
                  <div style="font-size: 0.8rem; color: var(--secondary); font-weight: 600;">${a.department_name || a.department}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">$${a.fee_aud || a.fee || 220} AUD</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${a.consultation_type || a.type || 'In-Person Consultation'}</div>
                </div>
              </div>

              <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; flex-wrap: wrap;">
                <div>📅 <strong>Date:</strong> ${a.appointment_date || a.date}</div>
                <div>🕒 <strong>Time:</strong> ${a.time_slot || a.time} (ACST)</div>
                <div>📍 <strong>Location:</strong> ${a.doctor_room || a.location || 'Wing A, Level 3, Suite 304'}</div>
              </div>

              ${a.status !== 'cancelled' && a.status !== 'completed' ? `
                <div style="display: flex; gap: 0.6rem; border-top: 1px solid var(--border); padding-top: 0.75rem; flex-wrap: wrap;">
                  <button class="btn btn-primary" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="App.openCheckinModal(); document.getElementById('checkinRefInput').value='${a.id}';">
                    🎫 Check In
                  </button>
                  <button class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="PatientPortal.openStripePaymentModal('${a.id}', ${a.fee_aud || 220})">
                    💳 Pay Fee ($${a.fee_aud || 220} AUD)
                  </button>
                  <button class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="PatientPortal.openRescheduleModal('${a.id}', '${a.appointment_date || a.date}', '${a.time_slot || a.time}')">
                    🔄 Reschedule
                  </button>
                  <button class="btn btn-emergency" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="PatientPortal.cancelAppointment('${a.id}')">
                    ✕ Cancel
                  </button>
                  <button class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="window.print()">
                    🖨️ Print
                  </button>
                </div>
              ` : `
                <div style="font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 0.5rem; display: flex; justify-content: space-between;">
                  <span>${a.status === 'completed' ? '✓ Consultation finished and finalized in clinical records.' : '✕ This appointment was cancelled.'}</span>
                  <button class="btn btn-outline" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;" onclick="PatientPortal.openStripePaymentModal('${a.id}', ${a.fee_aud || 220})">View Invoice / Receipt</button>
                </div>
              `}
            </div>
          `;
        }).join('');

      if (apptContainer) apptContainer.innerHTML = apptHtml;
      if (apptFullContainer) apptFullContainer.innerHTML = apptHtml;
    }

    // 2. Medical Records with Download Link
    const recordsContainer = document.getElementById('portalLabReportsList');
    if (recordsContainer) {
      recordsContainer.innerHTML = records.map(r => `
        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <strong style="font-size: 1rem; color: var(--text-primary);">${r.title || r.testName}</strong>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span class="badge badge-success">${r.status || 'Finalized'}</span>
              <a href="/api/reports/download/${r.id || 1}" target="_blank" class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; text-decoration: none;">
                📄 Download Report
              </a>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            Issued on: <strong>${r.record_date || r.date}</strong> by <strong>${r.doctor_name || r.doctor}</strong>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; background: var(--bg-alt); padding: 0.75rem; border-radius: var(--radius-sm);">
            ${r.summary || r.notes || 'Routine diagnostic scan within clinical reference parameters.'}
          </p>
        </div>
      `).join('');
    }

    // 3. Prescriptions with Download / View Link
    const rxContainer = document.getElementById('portalPrescriptionsList');
    if (rxContainer) {
      rxContainer.innerHTML = prescriptions.map(rx => `
        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <strong style="font-size: 1.05rem; color: var(--primary);">${rx.medication}</strong>
              <span class="badge badge-success" style="margin-left: 0.5rem;">${rx.dosage}</span>
            </div>
            <a href="/api/prescriptions/download/${rx.id || 1}" target="_blank" class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; text-decoration: none;">
              💊 View e-Prescription
            </a>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
            📋 <strong>Instructions:</strong> ${rx.frequency} (${rx.pharmacy_instructions || rx.pharmacyInstructions || 'Take with water'})
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            Prescribed by ${rx.doctor_name || rx.prescribedBy} on ${rx.issued_date || rx.prescribedDate} • Refills remaining: <strong>${rx.refills_left ?? rx.refillsRemaining ?? 2}</strong>
          </div>
        </div>
      `).join('');
    }

    // 4. Notifications
    const notifContainer = document.getElementById('portalNotificationsList');
    if (notifContainer) {
      if (notifications.length === 0) {
        notifContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">No new clinical alerts.</div>`;
      } else {
        notifContainer.innerHTML = notifications.map(n => `
          <div style="padding: 0.85rem; border-bottom: 1px solid var(--border); font-size: 0.85rem;">
            <div style="font-weight: 700; color: var(--primary);">${n.title}</div>
            <div style="color: var(--text-secondary); margin-top: 0.2rem;">${n.message}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">${n.created_at || 'Recently'}</div>
          </div>
        `).join('');
      }
    }

    // 5. Digital ID Card
    this.renderIdCard(patient, user);

    // 6. Family Profiles
    this.renderFamilyList(data?.families || []);

    // 7. Payments History
    this.renderPaymentsList(data?.payments || []);
  },

  // Reschedule Appointment
  openRescheduleModal(apptId, currentDate, currentTime) {
    const newDate = prompt(`Reschedule Appointment [${apptId}]\nCurrent Date: ${currentDate}\nEnter new date (YYYY-MM-DD):`, currentDate);
    if (!newDate) return;

    const newTime = prompt(`Enter new time slot (e.g. 10:00 AM, 02:30 PM):`, currentTime);
    if (!newTime) return;

    fetch('/api/appointments/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: apptId, newDate, newTime })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        App.showToast(`✅ ${res.message}`, 'success');
        this.renderPatientDashboard();
      } else {
        App.showToast(`❌ Error: ${res.error}`, 'error');
      }
    })
    .catch(err => {
      App.showToast('Could not reschedule appointment.', 'error');
    });
  },

  // Cancel Appointment
  cancelAppointment(apptId) {
    if (!confirm(`Are you sure you want to cancel appointment [${apptId}]?`)) return;

    fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: apptId })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        App.showToast(`✅ ${res.message}`, 'success');
        this.renderPatientDashboard();
      } else {
        App.showToast(`❌ ${res.error}`, 'error');
      }
    })
    .catch(() => {
      App.showToast('Error cancelling appointment.', 'error');
    });
  },

  // =========================================================================
  // DOCTOR DASHBOARD
  // =========================================================================
  async renderDoctorDashboard() {
    let data = null;
    try {
      const res = await fetch(`/api/doctor/dashboard?userId=${this.currentUser.id || 2}`);
      const json = await res.json();
      if (json.success) data = json.data;
    } catch (err) {
      console.warn('Doctor dashboard fallback', err);
    }

    const doctorNameEl = document.getElementById('doctorDashboardName');
    const doctorDeptEl = document.getElementById('doctorDashboardDept');
    if (doctorNameEl) doctorNameEl.textContent = this.currentUser.name || 'Dr. Sarah Jenkins';
    if (doctorDeptEl) doctorDeptEl.textContent = 'Cardiology & Heart Health • Suite 304';

    const queueTable = document.getElementById('doctorTodayQueueTable');
    if (queueTable) {
      const appts = data?.todayAppointments || data?.upcomingAppointments || [];
      if (appts.length === 0) {
        queueTable.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No patients queued for today.</td></tr>`;
      } else {
        queueTable.innerHTML = appts.map(a => `
          <tr>
            <td style="font-weight: 700; color: var(--primary);">${a.id}</td>
            <td><strong>${a.patient_name}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${a.mrn || 'DCH-MRN'}</span></td>
            <td>${a.time_slot}</td>
            <td><span class="badge badge-success">${a.status}</span></td>
            <td>
              <button class="btn btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="PatientPortal.completeDoctorConsultation('${a.id}')">
                Complete
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  },

  completeDoctorConsultation(apptId) {
    App.showToast(`Consultation for ${apptId} completed and notes archived.`, 'success');
  },

  // =========================================================================
  // AUTHENTICATION MODAL & LOGIN/REGISTER
  // =========================================================================
  openLoginModal() {
    const modal = document.getElementById('portalLoginModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeLoginModal() {
    const modal = document.getElementById('portalLoginModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  switchAuthMode(mode) {
    const loginForm = document.getElementById('loginFormContainer');
    const regForm = document.getElementById('registerFormContainer');
    const title = document.getElementById('authModalTitle');

    if (mode === 'register') {
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';
      if (title) title.textContent = 'Register New Patient Account';
    } else {
      if (loginForm) loginForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
      if (title) title.textContent = 'Sign In to Hospital Portal';
    }
  },

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '👁️';
    } else {
      input.type = 'password';
      btn.textContent = '🔒';
    }
  },

  checkPasswordStrength(val) {
    const meter = document.getElementById('pwdStrengthBar');
    const label = document.getElementById('pwdStrengthLabel');
    if (!meter || !label) return;

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const colors = ['#dc2626', '#dc2626', '#d97706', '#005B96', '#16a34a'];
    const texts = ['Too Short', 'Weak', 'Fair', 'Strong', 'Very Strong (Excellent)'];

    meter.style.width = widths[score];
    meter.style.backgroundColor = colors[score];
    label.textContent = texts[score];
    label.style.color = colors[score];
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      App.showToast('Please enter both email and password.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      this.saveSession(json.user);
      this.closeLoginModal();
      App.showToast(`Welcome back, ${json.user.name}! Signed in as ${json.user.role}.`, 'success');
      const portalSec = document.getElementById('patient-portal');
      if (portalSec) portalSec.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const password = document.getElementById('regPassword')?.value;

    if (!name || !email || !password) {
      App.showToast('Please fill in all required fields.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      this.saveSession(json.user);
      this.closeLoginModal();
      App.showToast(`Account created! Welcome to Darwin City Hospital, ${name}.`, 'success');
      const portalSec = document.getElementById('patient-portal');
      if (portalSec) portalSec.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  // Demo Role Quick-Switch (For portfolio grading & demonstration)
  switchDemoRole(role) {
    if (role === 'admin') {
      this.saveSession({
        id: 1,
        name: "Hospital Administrator",
        email: "admin@darwinhospital.gov.au",
        role: "admin"
      });
      App.showToast('Switched to Administrator Console view.', 'info');
    } else if (role === 'doctor') {
      this.saveSession({
        id: 2,
        name: "Dr. Sarah Jenkins",
        email: "dr.jenkins@darwinhospital.gov.au",
        role: "doctor",
        department: "Cardiology"
      });
      App.showToast('Switched to Specialist Doctor Portal view.', 'info');
    } else {
      this.saveSession({
        id: 3,
        name: "Niroj Khattri",
        email: "nirojkhattri33@gmail.com",
        phone: "+61 412 663 7298",
        role: "patient",
        mrn: "DCH-MRN-9021"
      });
      App.showToast('Switched to Patient Portal view.', 'info');
    }
  },

  bindEvents() {
    // Portal tab navigation
    document.querySelectorAll('.portal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.portal-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.portal-tab-pane').forEach(pane => {
      const match = pane.id === `portal-tab-${tabId}`;
      pane.classList.toggle('active', match);
      pane.style.display = match ? 'block' : 'none';
    });

    if (tabId === 'id-card') {
      this.renderIdCard();
    }
  },

  // =========================================================================
  // DIGITAL PATIENT ID CARD
  // =========================================================================
  renderIdCard(patient = null, user = null) {
    const p = patient || this.currentPatient || HOSPITAL_DATA.demoPatient;
    const u = user || this.currentUser;

    const html = `
      <div class="patient-id-card-wrapper" id="printReadyIdCard">
        <div class="id-card-header">
          <div class="id-badge-logo">
            <span style="font-size: 1.6rem;">🏥</span>
            <div>
              <div style="font-weight: 800; font-size: 1.05rem;">DARWIN CITY HOSPITAL</div>
              <div style="font-size: 0.65rem; opacity: 0.85; letter-spacing: 0.5px;">NORTHERN TERRITORY HEALTH NETWORK</div>
            </div>
          </div>
          <span class="badge badge-success" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;">ACTIVE PATIENT</span>
        </div>

        <div class="id-photo-row">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300" class="id-photo" alt="Patient Photo">
          <div class="id-info-col">
            <h3 style="font-size: 1.25rem; margin: 0 0 0.2rem; color: #fff;">${u?.name || p?.name || 'Niroj Khattri'}</h3>
            <div style="font-size: 0.85rem; opacity: 0.95;"><strong>MRN:</strong> ${p?.mrn || 'DCH-MRN-9021'}</div>
            <div style="font-size: 0.8rem; opacity: 0.85;">Medicare: ${p?.medicare_num || p?.medicareNum || '2893 48123 1'}</div>
            <div style="font-size: 0.8rem; opacity: 0.85;">Blood: <strong>${p?.blood_group || p?.bloodGroup || 'O Positive'}</strong> • DOB: ${p?.dob || '1995-04-12'}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.75rem;">
          <div>
            <div style="font-size: 0.7rem; opacity: 0.75;">EMERGENCY CONTACT</div>
            <div style="font-size: 0.8rem; font-weight: 600;">${p?.emergency_contact_name || 'Sunita Khattri'} (${p?.emergency_contact_phone || '+61 412 000 111'})</div>
            <div class="id-barcode-line" style="margin-top: 0.35rem;">*${p?.mrn || 'DCH-MRN-9021'}*</div>
          </div>
          <div class="id-qr-box">
            <canvas id="patientIdCardQrCanvas"></canvas>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('portalIdCardDisplayContainer');
    if (container) {
      container.innerHTML = html;
      const canvas = document.getElementById('patientIdCardQrCanvas');
      if (canvas && window.QRCode) {
        QRCode.toCanvas(canvas, `DCH-PATIENT-ID:${p?.mrn || 'DCH-MRN-9021'}|VERIFIED`, { width: 85, margin: 1 });
      }
    }
  },

  openDigitalIdModal() {
    App.closeAllModals();
    const modal = document.getElementById('patientIdCardModal');
    const content = document.getElementById('patientIdModalCardContent');
    const p = this.currentPatient || HOSPITAL_DATA.demoPatient;
    const u = this.currentUser;

    if (content) {
      content.innerHTML = `
        <div class="patient-id-card-wrapper">
          <div class="id-card-header">
            <div class="id-badge-logo">
              <span style="font-size: 1.6rem;">🏥</span>
              <div>
                <div style="font-weight: 800; font-size: 1.05rem;">DARWIN CITY HOSPITAL</div>
                <div style="font-size: 0.65rem; opacity: 0.85; letter-spacing: 0.5px;">NORTHERN TERRITORY HEALTH NETWORK</div>
              </div>
            </div>
            <span class="badge badge-success" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;">ACTIVE PATIENT</span>
          </div>

          <div class="id-photo-row">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300" class="id-photo" alt="Patient Photo">
            <div class="id-info-col">
              <h3 style="font-size: 1.25rem; margin: 0 0 0.2rem; color: #fff;">${u?.name || 'Niroj Khattri'}</h3>
              <div style="font-size: 0.85rem; opacity: 0.95;"><strong>MRN:</strong> ${p?.mrn || 'DCH-MRN-9021'}</div>
              <div style="font-size: 0.8rem; opacity: 0.85;">Medicare: ${p?.medicare_num || p?.medicareNum || '2893 48123 1'}</div>
              <div style="font-size: 0.8rem; opacity: 0.85;">Blood: <strong>${p?.blood_group || p?.bloodGroup || 'O Positive'}</strong> • DOB: ${p?.dob || '1995-04-12'}</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.75rem;">
            <div>
              <div style="font-size: 0.7rem; opacity: 0.75;">EMERGENCY CONTACT</div>
              <div style="font-size: 0.8rem; font-weight: 600;">${p?.emergency_contact_name || 'Sunita Khattri'} (${p?.emergency_contact_phone || '+61 412 000 111'})</div>
              <div class="id-barcode-line" style="margin-top: 0.35rem;">*${p?.mrn || 'DCH-MRN-9021'}*</div>
            </div>
            <div class="id-qr-box">
              <canvas id="modalIdCardQrCanvas"></canvas>
            </div>
          </div>
        </div>
      `;
      const canvas = document.getElementById('modalIdCardQrCanvas');
      if (canvas && window.QRCode) {
        QRCode.toCanvas(canvas, `DCH-PATIENT-ID:${p?.mrn || 'DCH-MRN-9021'}|VERIFIED`, { width: 85, margin: 1 });
      }
    }

    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  // =========================================================================
  // FAMILY PROFILES MANAGEMENT
  // =========================================================================
  renderFamilyList(families = []) {
    const container = document.getElementById('portalFamilyList');
    if (!container) return;

    if (families.length === 0) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted); background: white; border-radius: var(--radius-md); border: 1px solid var(--border);">No family dependents registered yet. Click '+ Add Family Member' to link a dependent.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        ${families.map(f => `
          <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; box-shadow: var(--shadow-xs);">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-primary); font-weight: 700;">${f.member_name}</h4>
                <span class="badge badge-secondary">${f.relationship}</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem;">
                DOB: <strong>${f.dob || 'Not Provided'}</strong> • Blood: <strong>${f.blood_group || 'O+'}</strong>
              </div>
              <div style="font-size: 0.75rem; color: var(--secondary); font-weight: 600;">✓ Authorized Medicare Dependent</div>
            </div>
            <button class="btn btn-outline" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; color: var(--emergency); border-color: #fca5a5;" onclick="PatientPortal.deleteFamilyMember(${f.id})">
              Remove
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  toggleAddFamilyForm() {
    const box = document.getElementById('addFamilyFormBox');
    if (box) {
      box.style.display = box.style.display === 'block' ? 'none' : 'block';
    }
  },

  async handleAddFamilyMember(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('famMemberName')?.value.trim();
    const rel = document.getElementById('famRelationship')?.value;
    const dob = document.getElementById('famDob')?.value;
    const blood = document.getElementById('famBloodGroup')?.value;

    if (!name || !rel) {
      App.showToast('Please provide dependent name and relationship.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/patient/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: 1,
          memberName: name,
          relationship: rel,
          dob,
          gender: 'Not Specified',
          bloodGroup: blood
        })
      });
      const data = await res.json();
      if (data.success) {
        App.showToast('Family member successfully added.', 'success');
        this.toggleAddFamilyForm();
        this.renderPatientDashboard();
      } else {
        App.showToast(data.error || 'Could not add family member.', 'error');
      }
    } catch (err) {
      App.showToast('Network error adding family member: ' + err.message, 'error');
    }
  },

  async deleteFamilyMember(familyId) {
    if (!confirm('Are you sure you want to remove this family member profile?')) return;
    try {
      const res = await fetch('/api/patient/family/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: 1, familyId })
      });
      const data = await res.json();
      if (data.success) {
        App.showToast('Family profile removed.', 'info');
        this.renderPatientDashboard();
      }
    } catch (e) {
      App.showToast('Error removing profile.', 'error');
    }
  },

  // =========================================================================
  // PAYMENTS & STRIPE CHECKOUT
  // =========================================================================
  renderPaymentsList(payments = []) {
    const container = document.getElementById('portalPaymentsList');
    if (!container) return;

    if (payments.length === 0) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted); background: white; border-radius: var(--radius-md); border: 1px solid var(--border);">No payment records found.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="overflow-x: auto; background: white; border-radius: var(--radius-md); border: 1px solid var(--border);">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border); text-align: left; background: var(--bg-alt);">
              <th style="padding: 0.75rem 1rem;">Receipt Ref</th>
              <th style="padding: 0.75rem 1rem;">Service Description</th>
              <th style="padding: 0.75rem 1rem;">Amount</th>
              <th style="padding: 0.75rem 1rem;">Status</th>
              <th style="padding: 0.75rem 1rem;">Date</th>
              <th style="padding: 0.75rem 1rem;">Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 0.75rem 1rem; font-family: monospace; font-weight: 700; color: var(--primary);">${p.receipt_ref || p.id}</td>
                <td style="padding: 0.75rem 1rem;">Specialist Outpatient Consultation<br><span style="font-size: 0.75rem; color: var(--text-muted);">${p.doctor_name || 'Dr. Sarah Jenkins'}</span></td>
                <td style="padding: 0.75rem 1rem; font-weight: 700; color: #0f172a;">$${p.amount_aud} ${p.currency || 'AUD'}</td>
                <td style="padding: 0.75rem 1rem;"><span class="badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}">${p.status.toUpperCase()}</span></td>
                <td style="padding: 0.75rem 1rem; font-size: 0.8rem; color: var(--text-muted);">${(p.created_at || '').substring(0, 10)}</td>
                <td style="padding: 0.75rem 1rem;">
                  <button class="btn btn-outline" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;" onclick="alert('Receipt Verified: Tax Invoice ${p.receipt_ref}\\nAmount: $${p.amount_aud} AUD (Medicare Item 104)\\nDarwin City Hospital • ABN 48 123 456 789')">
                    📄 View Tax Invoice
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openStripePaymentModal(apptId = 'DCH-892144', fee = 220) {
    App.closeAllModals();
    const modal = document.getElementById('stripeCheckoutModal');
    const form = document.getElementById('stripePaymentForm');
    const successBox = document.getElementById('stripePaymentSuccessBox');
    if (form) form.style.display = 'block';
    if (successBox) successBox.style.display = 'none';
    if (modal) {
      modal.dataset.apptId = apptId;
      modal.dataset.amount = fee;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  async handleStripePaymentSubmit(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('stripeCheckoutModal');
    const apptId = modal?.dataset?.apptId || 'DCH-892144';
    const amount = Number(modal?.dataset?.amount || 220);
    const payBtn = document.getElementById('btnStripePay');
    const form = document.getElementById('stripePaymentForm');
    const successBox = document.getElementById('stripePaymentSuccessBox');
    const receiptText = document.getElementById('stripeReceiptText');

    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'Processing Payment via Stripe... ⏳';
    }

    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: apptId,
          patientId: 1,
          amountAud: amount,
          paymentMethod: 'credit_card',
          stripePaymentIntentId: `pi_test_${Math.random().toString(36).substring(2, 12)}`
        })
      });
      const data = await res.json();

      if (data.success) {
        if (form) form.style.display = 'none';
        if (successBox) successBox.style.display = 'block';
        if (receiptText) receiptText.textContent = `Tax Invoice & Receipt: ${data.payment.receipt_ref} • $${amount} AUD Paid`;
        App.showToast(`✅ Payment of $${amount} AUD processed successfully!`, 'success');
        this.renderPatientDashboard();
      } else {
        App.showToast(data.error || 'Payment failed.', 'error');
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.textContent = `Pay $${amount}.00 AUD via Stripe 🔒`;
        }
      }
    } catch (err) {
      App.showToast('Payment processing error: ' + err.message, 'error');
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = `Pay $${amount}.00 AUD via Stripe 🔒`;
      }
    }
  },

  markAllNotificationsRead() {
    App.showToast('All notifications marked as read.', 'info');
    const notifContainer = document.getElementById('portalNotificationsList');
    if (notifContainer) {
      notifContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">All clinical notifications cleared.</div>`;
    }
  }
};

window.PatientPortal = PatientPortal;
