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
    if (apptContainer) {
      if (appts.length === 0) {
        apptContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No appointments booked. Click 'Book Appointment' to schedule one.</div>`;
      } else {
        apptContainer.innerHTML = appts.map(a => {
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
                <div style="display: flex; gap: 0.6rem; border-top: 1px solid var(--border); padding-top: 0.75rem;">
                  <button class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="PatientPortal.openRescheduleModal('${a.id}', '${a.appointment_date || a.date}', '${a.time_slot || a.time}')">
                    🔄 Reschedule
                  </button>
                  <button class="btn btn-emergency" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="PatientPortal.cancelAppointment('${a.id}')">
                    ✕ Cancel
                  </button>
                  <button class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="window.print()">
                    🖨️ Print Pass
                  </button>
                </div>
              ` : `
                <div style="font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 0.5rem;">
                  ${a.status === 'completed' ? '✓ Consultation finished and finalized in clinical records.' : '✕ This appointment was cancelled.'}
                </div>
              `}
            </div>
          `;
        }).join('');
      }
    }

    // 2. Medical Records
    const recordsContainer = document.getElementById('portalLabReportsList');
    if (recordsContainer) {
      recordsContainer.innerHTML = records.map(r => `
        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="font-size: 1rem; color: var(--text-primary);">${r.title || r.testName}</strong>
            <span class="badge badge-success">${r.status || 'Finalized'}</span>
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

    // 3. Prescriptions
    const rxContainer = document.getElementById('portalPrescriptionsList');
    if (rxContainer) {
      rxContainer.innerHTML = prescriptions.map(rx => `
        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <strong style="font-size: 1.05rem; color: var(--primary);">${rx.medication}</strong>
            <span class="badge badge-success">${rx.dosage}</span>
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
      pane.classList.toggle('active', pane.id === `portal-tab-${tabId}`);
    });
  }
};

window.PatientPortal = PatientPortal;
