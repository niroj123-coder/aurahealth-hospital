/**
 * AuraHealth International Hospital
 * Interactive Patient Portal with 2FA Verification Code (OTP) & Personalized Booking Management
 */

const PatientPortal = {
  activeTab: 'overview',
  currentPatient: null,
  generatedOtp: '',
  pendingIdentifier: '',

  init() {
    this.loadSession();
    this.bindEvents();
    this.renderAll();
  },

  loadSession() {
    try {
      const stored = localStorage.getItem('aurahealth_active_session');
      if (stored) {
        this.currentPatient = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Session load error:', e);
    }

    if (!this.currentPatient) {
      this.currentPatient = HOSPITAL_DATA.patientPortal.profile;
    }
  },

  renderAll() {
    this.renderOverview();
    this.renderAppointments();
    this.renderLabReports();
    this.renderPrescriptions();
    this.renderInvoices();
  },

  bindEvents() {
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
  },

  renderOverview() {
    const profile = this.currentPatient || HOSPITAL_DATA.patientPortal.profile;

    const nameEl = document.getElementById('portalPatientName');
    const idEl = document.getElementById('portalPatientId');
    const insuranceEl = document.getElementById('portalInsuranceBadge');
    const avatarEl = document.getElementById('portalUserAvatar');

    // Generate Initials
    const initials = profile.name
      ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'PT';

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = profile.name;
    if (idEl) idEl.textContent = `ID: ${profile.id} • ${profile.bloodGroup || 'Patient'}`;
    if (insuranceEl) {
      insuranceEl.textContent = profile.insurance && profile.insurance.provider
        ? profile.insurance.provider
        : 'Verified 2FA';
    }

    // Update Nav Button in Header
    const navBtn = document.getElementById('portalAuthNavBtn');
    if (navBtn) {
      navBtn.innerHTML = `👤 ${profile.name.split(' ')[0]} (Portal)`;
    }
  },

  getAppointments() {
    let allAppts = [];
    try {
      const stored = localStorage.getItem('aurahealth_patient_appts');
      allAppts = stored ? JSON.parse(stored) : [...HOSPITAL_DATA.patientPortal.appointments];
    } catch (e) {
      allAppts = [...HOSPITAL_DATA.patientPortal.appointments];
    }

    // Filter appointments for the currently active patient session
    if (this.currentPatient && this.currentPatient.isPersonal) {
      const myEmail = (this.currentPatient.email || '').toLowerCase().trim();
      const myPhone = (this.currentPatient.phone || '').replace(/\D/g, '');
      const myName = (this.currentPatient.name || '').toLowerCase().trim();

      const userAppts = allAppts.filter(a => {
        const aEmail = (a.patientEmail || '').toLowerCase().trim();
        const aPhone = (a.patientPhone || '').replace(/\D/g, '');
        const aName = (a.patientName || '').toLowerCase().trim();
        return (myEmail && aEmail === myEmail) ||
               (myPhone && aPhone === myPhone) ||
               (myName && aName === myName) ||
               (this.currentPatient.bookingRef && a.id === this.currentPatient.bookingRef);
      });

      return userAppts.length > 0 ? userAppts : allAppts;
    }

    return allAppts;
  },

  renderAppointments() {
    const container = document.getElementById('portalApptsList');
    if (!container) return;

    const appts = this.getAppointments();

    if (appts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: white; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div>
          <h4 style="font-size: 1.15rem; color: var(--text-primary); font-weight: 700;">No upcoming appointments found</h4>
          <p style="font-size: 0.88rem; margin: 0.5rem 0 1.25rem;">Would you like to schedule a consultation with our specialists?</p>
          <button class="btn btn-primary" onclick="BookingWizard.open()">Schedule an Appointment</button>
        </div>
      `;
      return;
    }

    container.innerHTML = appts.map(a => `
      <div style="background: white; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-xs);">
        <div style="flex: 1; min-width: 260px;">
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
            <span class="badge ${a.status === 'Confirmed' ? 'badge-success' : 'badge-primary'}">${a.status}</span>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">${a.department}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">[${a.id}]</span>
          </div>

          <h4 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">${a.doctorName}</h4>

          <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.35rem; display: flex; flex-wrap: wrap; gap: 1rem;">
            <span>📅 <strong>${a.date}</strong> at <strong>${a.time}</strong></span>
            <span>📍 ${a.room || a.type}</span>
            <span>💵 Fee: <strong>$${a.fee || 150}</strong></span>
          </div>

          ${a.patientName ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Patient: <strong>${a.patientName}</strong> (${a.patientEmail || ''})</p>` : ''}
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.4rem; background: var(--bg-subtle); padding: 0.4rem 0.75rem; border-radius: 4px;">
            Clinical Reason: ${a.notes || 'Routine consultation'}
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px;">
          <button class="btn btn-outline" style="font-size: 0.82rem; padding: 0.45rem 0.85rem;" onclick="PatientPortal.printSlip('${a.id}')">
            🖨️ View Pass Slip
          </button>
          <button class="btn btn-secondary" style="font-size: 0.82rem; padding: 0.45rem 0.85rem;" onclick="BookingWizard.openEmailPreview()">
            📬 View Email
          </button>
          <button class="btn btn-outline" style="font-size: 0.82rem; padding: 0.45rem 0.85rem; color: var(--emergency); border-color: #fca5a5;" onclick="PatientPortal.cancelAppt('${a.id}')">
            Cancel Visit
          </button>
        </div>
      </div>
    `).join('');
  },

  cancelAppt(id) {
    if (!confirm('Are you sure you want to cancel this appointment? This slot will be released back to the clinical schedule.')) return;
    let appts = [];
    try {
      const stored = localStorage.getItem('aurahealth_patient_appts');
      appts = stored ? JSON.parse(stored) : [...HOSPITAL_DATA.patientPortal.appointments];
    } catch (e) {
      appts = [...HOSPITAL_DATA.patientPortal.appointments];
    }

    appts = appts.filter(a => a.id !== id);
    try {
      localStorage.setItem('aurahealth_patient_appts', JSON.stringify(appts));
    } catch (e) {}

    this.renderAppointments();
    App.showToast(`Appointment ${id} has been cancelled successfully.`, 'warning');
  },

  printSlip(id) {
    const appts = this.getAppointments();
    const appt = appts.find(a => a.id === id);
    if (!appt) return;

    alert(
      `🏥 [AURAHEALTH HOSPITAL OFFICIAL APPOINTMENT PASS]\n` +
      `--------------------------------------------------\n` +
      `Reference ID: ${appt.id}\n` +
      `Patient Name: ${appt.patientName || this.currentPatient.name}\n` +
      `Attending Physician: ${appt.doctorName}\n` +
      `Department: ${appt.department}\n` +
      `Date & Time: ${appt.date} at ${appt.time}\n` +
      `Room / Wing: ${appt.room || 'Wing B, Level 3, Suite 304'}\n` +
      `Consultation Fee: $${appt.fee || 150}\n` +
      `Status: Confirmed\n` +
      `--------------------------------------------------\n` +
      `Please present this pass at Gate 2 reception upon arrival.`
    );
  },

  renderLabReports() {
    const container = document.getElementById('portalLabList');
    if (!container) return;

    const reports = HOSPITAL_DATA.patientPortal.labReports;

    container.innerHTML = reports.map(r => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <div>
            <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${r.testName}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Report Date: ${r.date} • Ordering Physician: ${r.doctor}</span>
          </div>
          <button class="btn btn-secondary" style="font-size: 0.82rem;" onclick="PatientPortal.downloadReport('${r.id}')">
            📥 Download Official PDF
          </button>
        </div>

        <table class="medical-table">
          <thead>
            <tr>
              <th>Biological Biomarker</th>
              <th>Observed Result</th>
              <th>Clinical Reference Range</th>
              <th>Diagnostic Status</th>
            </tr>
          </thead>
          <tbody>
            ${r.results.map(row => `
              <tr>
                <td style="font-weight: 600;">${row.parameter}</td>
                <td style="font-weight: 700; color: var(--primary-dark);">${row.value}</td>
                <td style="color: var(--text-muted);">${row.refRange}</td>
                <td><span class="badge badge-success">${row.status.toUpperCase()}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="font-size: 0.82rem; color: var(--text-secondary); background: var(--bg-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md); border-left: 3px solid var(--primary);">
          <strong>Pathologist Clinical Interpretation:</strong> ${r.notes}
        </div>
      </div>
    `).join('');
  },

  downloadReport(reportId) {
    App.showToast(`Downloading official validated medical report [${reportId}]...`, 'success');
  },

  renderPrescriptions() {
    const container = document.getElementById('portalRxList');
    if (!container) return;

    const rxList = HOSPITAL_DATA.patientPortal.prescriptions;

    container.innerHTML = rxList.map(rx => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
            <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">${rx.medication}</h4>
            <span class="badge badge-success">${rx.status}</span>
          </div>
          <p style="font-size: 0.88rem; font-weight: 600; color: var(--primary);">
            ${rx.dosage} — ${rx.frequency}
          </p>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
            Prescribed by ${rx.prescribedBy} • ${rx.pharmacyInstructions}
          </p>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">
            Refills Left: <strong>${rx.refillsRemaining}</strong>
          </div>
          <button class="btn btn-outline" style="font-size: 0.82rem; padding: 0.4rem 0.8rem;" onclick="PatientPortal.requestRefill('${rx.id}', '${rx.medication}')">
            💊 1-Click Refill
          </button>
        </div>
      </div>
    `).join('');
  },

  requestRefill(rxId, medName) {
    App.showToast(`Refill request for ${medName} submitted to AuraHealth Hospital Pharmacy.`, 'success');
  },

  renderInvoices() {
    const container = document.getElementById('portalBillingList');
    if (!container) return;

    const invoices = HOSPITAL_DATA.patientPortal.invoices;

    container.innerHTML = invoices.map(inv => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
            <span style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">${inv.description}</span>
            <span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${inv.status}</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted);">
            Invoice #${inv.id} • Date: ${inv.date} • Total Billed: $${inv.totalAmount}
          </p>
          <p style="font-size: 0.8rem; color: var(--secondary); font-weight: 600;">
            Insurance Covered: $${inv.insuranceCovered} • Patient Responsibility: <strong>$${inv.patientDue}</strong>
          </p>
        </div>

        <div>
          ${inv.status === 'Paid' ? `
            <button class="btn btn-outline" style="font-size: 0.82rem;" onclick="App.showToast('Official receipt printed.', 'success')">
              🧾 Download Receipt
            </button>
          ` : `
            <button class="btn btn-primary" style="font-size: 0.82rem;" onclick="PatientPortal.payInvoice('${inv.id}', ${inv.patientDue})">
              💳 Pay Co-Pay ($${inv.patientDue})
            </button>
          `}
        </div>
      </div>
    `).join('');
  },

  payInvoice(invId, amount) {
    if (confirm(`Authorize copay settlement of $${amount} via insurance linked account?`)) {
      const inv = HOSPITAL_DATA.patientPortal.invoices.find(i => i.id === invId);
      if (inv) {
        inv.status = 'Paid';
        inv.patientDue = 0;
      }
      this.renderInvoices();
      App.showToast(`Invoice #${invId} settled successfully! Official receipt generated.`, 'success');
    }
  },

  // =========================================================================
  // Authentication & 2FA Verification Code (OTP) Logic
  // =========================================================================

  openLoginModal() {
    const modal = document.getElementById('patientLoginModal');
    if (!modal) return;

    this.switchAuthTab('otp');
    this.backToOtpStep1();

    // Check if there is a recent booking made in this session
    const lastBookedContainer = document.getElementById('lastBookedQuickLink');
    let appts = [];
    try {
      const stored = localStorage.getItem('aurahealth_patient_appts');
      if (stored) appts = JSON.parse(stored);
    } catch (e) {}

    if (lastBookedContainer) {
      if (appts.length > 0 && appts[0].patientEmail) {
        const email = appts[0].patientEmail;
        lastBookedContainer.innerHTML = `
          • <button type="button" style="color: var(--secondary); font-weight: 700; text-decoration: underline;" onclick="PatientPortal.fillQuickIdentifier('${email}')">
            Recent Booking: ${email}
          </button>
        `;
      } else {
        lastBookedContainer.innerHTML = '';
      }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeLoginModal() {
    const modal = document.getElementById('patientLoginModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  switchAuthTab(tab) {
    const otpBtn = document.getElementById('authTabOtpBtn');
    const lookupBtn = document.getElementById('authTabLookupBtn');
    const otpPane = document.getElementById('authPaneOtp');
    const lookupPane = document.getElementById('authPaneLookup');

    if (tab === 'otp') {
      if (otpBtn) otpBtn.classList.add('active');
      if (lookupBtn) lookupBtn.classList.remove('active');
      if (otpPane) otpPane.style.display = 'block';
      if (lookupPane) lookupPane.style.display = 'none';
    } else {
      if (lookupBtn) lookupBtn.classList.add('active');
      if (otpBtn) otpBtn.classList.remove('active');
      if (lookupPane) lookupPane.style.display = 'block';
      if (otpPane) otpPane.style.display = 'none';
    }
  },

  fillQuickIdentifier(val) {
    const input = document.getElementById('loginIdentifier');
    if (input) {
      input.value = val;
      input.focus();
    }
  },

  otpTimerInterval: null,

  async sendOtpCode() {
    const input = document.getElementById('loginIdentifier');
    const errorBox = document.getElementById('loginIdentifierError');
    const sendBtn = document.getElementById('sendOtpSubmitBtn');
    const val = input ? input.value.trim() : '';

    if (!val) {
      if (errorBox) {
        errorBox.textContent = 'Please enter your email or phone number.';
        errorBox.classList.add('active');
      }
      return;
    }

    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.remove('active');
    }

    this.pendingIdentifier = val;

    // Generate genuine 6-digit random code
    this.generatedOtp = String(Math.floor(100000 + Math.random() * 900000));

    // Show loading indicator
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span>⏳ Dispatching to Gmail & SMS...</span>';
    }

    // Call Universal Gateway for multi-channel dispatch (Gmail, SMS, OS Push, Local Server)
    let dispatchReport = null;
    if (window.EmailGateway) {
      try {
        dispatchReport = await EmailGateway.sendOtp(val, this.generatedOtp);
      } catch (e) {
        console.warn('Dispatch error:', e);
      }
    }

    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span>📲 Send 6-Digit Verification Code</span>';
    }

    // Show Step 2
    const step1 = document.getElementById('otpStep1');
    const step2 = document.getElementById('otpStep2');
    const codeDisplay = document.getElementById('simulatedOtpCodeText');
    const sentToDisplay = document.getElementById('otpSentToDisplay');
    const otpInput = document.getElementById('loginOtpInput');
    const statusContainer = document.getElementById('otpDeliveryStatusBox');

    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'block';
    if (codeDisplay) codeDisplay.textContent = `${this.generatedOtp.substring(0, 3)}-${this.generatedOtp.substring(3)}`;
    if (sentToDisplay) sentToDisplay.textContent = val;
    if (otpInput) {
      otpInput.value = '';
      setTimeout(() => otpInput.focus(), 150);
    }

    // Render detailed delivery status
    if (statusContainer) {
      const isEmail = val.includes('@');
      statusContainer.innerHTML = `
        <div style="background: #eff6ff; border: 1.5px solid #93c5fd; border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 0.85rem; font-size: 0.82rem; color: #1e3a8a;">
          <div style="font-weight: 800; display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; color: #1d4ed8; font-size: 0.88rem;">
            <span>${isEmail ? '✉️ Security Code for: ' + val : '📱 Security Code for: ' + val}</span>
            <span class="badge badge-primary">2FA Active</span>
          </div>
          <p style="margin: 0.35rem 0 0.5rem; line-height: 1.45; color: #1e40af;">
            Your one-time 6-digit security code is ready. <strong>You don't need to wait for email delivery</strong>—use the instant code displayed on-screen below, or deliver it to your Gmail:
          </p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${isEmail ? `
              <button type="button" class="btn btn-primary" style="font-size: 0.78rem; padding: 0.35rem 0.75rem; background: #ea4335; border-color: #ea4335;" onclick="PatientPortal.openOtpInGmail('${val}', '${this.generatedOtp}')">
                🚀 Open in Gmail (1-Click)
              </button>
            ` : ''}
            <button type="button" class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="EmailGateway.downloadOtpEml('${val}', '${this.generatedOtp}')">
              📥 Open in Outlook (.eml)
            </button>
          </div>
        </div>
      `;
    }

    // Start 10-minute visual countdown timer
    this.startOtpTimer(600);

    App.showToast(`🔒 Security Code dispatched to ${val}! Check inbox or use instant code below.`, 'success');
  },

  startOtpTimer(durationSeconds) {
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);
    let remaining = durationSeconds;
    const timerEl = document.getElementById('otpCountdownTimer');

    const updateDisplay = () => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (timerEl) {
        timerEl.innerHTML = `Code valid for: <strong>${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</strong>`;
      }
      if (remaining <= 0) {
        clearInterval(this.otpTimerInterval);
        if (timerEl) {
          timerEl.innerHTML = `<span style="color: #dc2626; font-weight: bold;">⚠️ Code expired. Please click Resend Code.</span>`;
        }
      }
      remaining--;
    };

    updateDisplay();
    this.otpTimerInterval = setInterval(updateDisplay, 1000);
  },

  autofillOtp() {
    const input = document.getElementById('loginOtpInput');
    if (input && this.generatedOtp) {
      input.value = this.generatedOtp;
      input.focus();
      App.showToast(`Code ${this.generatedOtp} filled! Verifying session...`, 'success');
      setTimeout(() => {
        this.verifyOtpCode();
      }, 350);
    }
  },

  openOtpInGmail(email, otp) {
    const to = encodeURIComponent(email || '');
    const subject = encodeURIComponent(`🔒 AuraHealth Verification Code: ${otp}`);
    const body = encodeURIComponent(
      `🏥 AURAHEALTH INTERNATIONAL HOSPITAL - PATIENT PORTAL\n` +
      `====================================================\n\n` +
      `Your 6-digit one-time verification code is:\n\n` +
      `👉  ${otp}  👈\n\n` +
      `This code is valid for 10 minutes.\n` +
      `Enter this code in the login window to access your medical records.\n\n` +
      `If you did not request this code, please disregard this notice.\n` +
      `====================================================`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank');
    App.showToast('🚀 Opened Gmail with your verification code!', 'success');
  },

  backToOtpStep1() {
    const step1 = document.getElementById('otpStep1');
    const step2 = document.getElementById('otpStep2');
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
  },

  verifyOtpCode() {
    const input = document.getElementById('loginOtpInput');
    const errorBox = document.getElementById('loginOtpError');
    const entered = input ? input.value.trim().replace(/[-\s]/g, '') : '';

    if (!entered || entered !== this.generatedOtp) {
      if (errorBox) {
        errorBox.textContent = `❌ Invalid verification code. Please enter the 6-digit code (${this.generatedOtp}).`;
        errorBox.classList.add('active');
      }
      App.showToast('Invalid verification code entered.', 'error');
      return;
    }

    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.remove('active');
    }

    // Lookup matching profile or create authenticated session
    let allAppts = [];
    try {
      const stored = localStorage.getItem('aurahealth_patient_appts');
      if (stored) allAppts = JSON.parse(stored);
    } catch (e) {}

    const cleanId = this.pendingIdentifier.toLowerCase().trim();
    const cleanDigits = this.pendingIdentifier.replace(/\D/g, '');

    const matchedAppt = allAppts.find(a => {
      const aEmail = (a.patientEmail || '').toLowerCase().trim();
      const aPhone = (a.patientPhone || '').replace(/\D/g, '');
      return (aEmail && aEmail === cleanId) || (cleanDigits.length >= 8 && aPhone === cleanDigits);
    });

    if (matchedAppt) {
      this.currentPatient = {
        id: 'AH-PT-' + matchedAppt.id.replace('AH-', ''),
        name: matchedAppt.patientName || 'Verified Patient',
        email: matchedAppt.patientEmail || cleanId,
        phone: matchedAppt.patientPhone || '',
        dob: matchedAppt.patientDob || '',
        bloodGroup: 'Verified',
        bookingRef: matchedAppt.id,
        insurance: {
          provider: matchedAppt.insurance || 'Verified',
          status: 'Active'
        },
        isPersonal: true
      };
    } else if (cleanId.includes('alexander') || cleanId.includes('vance')) {
      this.currentPatient = HOSPITAL_DATA.patientPortal.profile;
      this.currentPatient.isPersonal = false;
    } else {
      // New verified patient account
      const inferredName = cleanId.includes('@')
        ? cleanId.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim()
        : 'Patient ' + cleanDigits.slice(-4);

      this.currentPatient = {
        id: 'AH-PT-' + Math.floor(10000 + Math.random() * 90000),
        name: inferredName.charAt(0).toUpperCase() + inferredName.slice(1) || 'Verified Patient',
        email: cleanId,
        phone: cleanDigits,
        bloodGroup: 'O+',
        insurance: {
          provider: 'Self-Pay / Standard',
          status: 'Active'
        },
        isPersonal: true
      };
    }

    try {
      localStorage.setItem('aurahealth_active_session', JSON.stringify(this.currentPatient));
    } catch (e) {}

    this.renderAll();
    this.closeLoginModal();

    App.showToast(`✅ Welcome, ${this.currentPatient.name}! Identity verified via 2FA.`, 'success');

    // Scroll to portal
    const portalSec = document.getElementById('patient-portal');
    if (portalSec) {
      portalSec.scrollIntoView({ behavior: 'smooth' });
    }
  },

  lookupBooking() {
    const input = document.getElementById('lookupRefInput');
    const errorBox = document.getElementById('lookupRefError');
    const ref = input ? input.value.trim().toUpperCase() : '';

    if (!ref) {
      if (errorBox) {
        errorBox.textContent = 'Please enter a booking reference (e.g. AH-829104).';
        errorBox.classList.add('active');
      }
      return;
    }

    let allAppts = [];
    try {
      const stored = localStorage.getItem('aurahealth_patient_appts');
      allAppts = stored ? JSON.parse(stored) : [...HOSPITAL_DATA.patientPortal.appointments];
    } catch (e) {
      allAppts = [...HOSPITAL_DATA.patientPortal.appointments];
    }

    const found = allAppts.find(a => a.id.toUpperCase() === ref || a.id.toUpperCase().includes(ref));

    if (!found) {
      if (errorBox) {
        errorBox.textContent = `❌ No booking found with reference ID "${ref}". Please check your confirmation pass.`;
        errorBox.classList.add('active');
      }
      App.showToast(`No booking matching "${ref}" found.`, 'error');
      return;
    }

    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.remove('active');
    }

    // Set as active session
    this.currentPatient = {
      id: 'AH-PT-' + found.id.replace('AH-', ''),
      name: found.patientName || 'Verified Patient',
      email: found.patientEmail || '',
      phone: found.patientPhone || '',
      bloodGroup: 'Verified',
      bookingRef: found.id,
      insurance: {
        provider: found.insurance || 'Self-Pay',
        status: 'Active'
      },
      isPersonal: true
    };

    try {
      localStorage.setItem('aurahealth_active_session', JSON.stringify(this.currentPatient));
    } catch (e) {}

    this.renderAll();
    this.switchTab('appointments');
    this.closeLoginModal();

    App.showToast(`✅ Booking ${found.id} found! Loaded your appointment details.`, 'success');

    const portalSec = document.getElementById('patient-portal');
    if (portalSec) {
      portalSec.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

window.PatientPortal = PatientPortal;
