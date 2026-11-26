/**
 * Darwin City Hospital — Master Application Controller
 * High-performance UI rendering, CareBot Assistant, Accessibility, and Modals
 */

const App = {
  currentDoctorFilter: 'all',
  currentSearchQuery: '',
  fontSizeLevel: 100, // percentage
  enquiryVerifiedEmail: '',
  enquiryVerifiedToken: null,
  enquiryOtpTimer: null,
  enquiryOtpSeconds: 0,

  init() {
    this.renderDepartments();
    this.renderDoctors();
    this.renderTestimonials();
    this.renderArticles();
    this.renderFaqs();
    this.initAnimatedCounters();
    this.bindGlobalEvents();

    // Initialize submodules
    if (window.BookingWizard) window.BookingWizard.init();
    if (window.PatientPortal) window.PatientPortal.init();
    if (window.HospitalAdmin) window.HospitalAdmin.init();

    console.log('🏥 Darwin City Hospital Web Platform initialized successfully.');
  },

  bindGlobalEvents() {
    // Keyboard shortcut for search (Ctrl+K or Cmd+K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        App.openSearchModal();
      }
      if (e.key === 'Escape') {
        App.closeAllModals();
      }
    });

    // Mobile nav toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileNavDrawer');
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        mobileDrawer.style.display = mobileDrawer.style.display === 'block' ? 'none' : 'block';
      });
    }

    // Doctor filters
    const searchInput = document.getElementById('doctorSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentSearchQuery = e.target.value.toLowerCase().trim();
        this.renderDoctors();
      });
    }

    const deptFilter = document.getElementById('doctorDeptFilter');
    if (deptFilter) {
      deptFilter.addEventListener('change', (e) => {
        this.currentDoctorFilter = e.target.value;
        this.renderDoctors();
      });
    }

    // Dark/Light Mode Preference Init
    const savedTheme = localStorage.getItem('dch_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  },

  onEnquiryEmailChanged() {
    const email = document.getElementById('contactEmail')?.value.trim().toLowerCase() || '';
    if (this.enquiryVerifiedEmail && email !== this.enquiryVerifiedEmail) {
      this.enquiryVerifiedToken = null;
      this.enquiryVerifiedEmail = '';
      const badge = document.getElementById('enquiryVerifiedBadge');
      if (badge) badge.style.display = 'none';
      const sendBtn = document.getElementById('enquirySendOtpBtn');
      if (sendBtn) {
        sendBtn.style.display = 'inline-flex';
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send OTP 📨';
      }
      const box = document.getElementById('enquiryOtpBox');
      if (box) box.style.display = 'none';
    }
  },

  async sendEnquiryOtp(isResend = false) {
    const email = document.getElementById('contactEmail')?.value.trim().toLowerCase() || '';
    const feedback = document.getElementById('enquiryOtpFeedback');
    const sendBtn = document.getElementById('enquirySendOtpBtn');
    const box = document.getElementById('enquiryOtpBox');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showToast('Please enter a valid email address first.', 'warning');
      return;
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending... ⏳';
    }
    if (feedback) {
      feedback.style.color = '#005B96';
      feedback.textContent = 'Connecting to hospital mail server...';
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'enquiry' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.rateLimited) {
          if (feedback) {
            feedback.style.color = '#d97706';
            feedback.textContent = data.error;
          }
          this.startEnquiryTimer(data.waitSeconds || 60);
          return;
        }

        if (feedback) {
          feedback.style.color = '#DC2626';
          feedback.innerHTML = `⚠️ <strong>Error:</strong> ${data.error}`;
        }
        this.showToast(data.error, 'error');
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send OTP 📨';
        }
        return;
      }

      if (box) box.style.display = 'block';
      if (sendBtn) sendBtn.style.display = 'none';
      if (feedback) {
        feedback.style.color = '#166534';
        feedback.textContent = `✓ 6-digit code dispatched to ${email}. Valid for 5 minutes.`;
      }
      this.showToast(`Verification code sent to ${email}`, 'success');
      this.startEnquiryTimer(60);

      const codeInput = document.getElementById('enquiryOtpCode');
      if (codeInput) {
        codeInput.value = '';
        codeInput.focus();
      }
    } catch (err) {
      if (feedback) {
        feedback.style.color = '#DC2626';
        feedback.textContent = 'Dispatch error: ' + err.message;
      }
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send OTP 📨';
      }
    }
  },

  startEnquiryTimer(seconds) {
    if (this.enquiryOtpTimer) clearInterval(this.enquiryOtpTimer);
    this.enquiryOtpSeconds = seconds;
    const resendBtn = document.getElementById('enquiryResendOtpBtn');
    const timerLabel = document.getElementById('enquiryResendTimer');

    if (resendBtn) {
      resendBtn.style.display = 'inline-flex';
      resendBtn.disabled = true;
    }
    if (timerLabel) timerLabel.textContent = this.enquiryOtpSeconds;

    this.enquiryOtpTimer = setInterval(() => {
      this.enquiryOtpSeconds--;
      if (timerLabel) timerLabel.textContent = this.enquiryOtpSeconds;
      if (this.enquiryOtpSeconds <= 0) {
        clearInterval(this.enquiryOtpTimer);
        this.enquiryOtpTimer = null;
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.innerHTML = 'Resend Code 🔄';
        }
      }
    }, 1000);
  },

  async verifyEnquiryOtp() {
    const email = document.getElementById('contactEmail')?.value.trim().toLowerCase() || '';
    const code = document.getElementById('enquiryOtpCode')?.value.trim() || '';
    const feedback = document.getElementById('enquiryOtpFeedback');
    const verifyBtn = document.getElementById('enquiryVerifyOtpBtn');

    if (!code || !/^\d{6}$/.test(code)) {
      if (feedback) {
        feedback.style.color = '#DC2626';
        feedback.textContent = 'Please enter all 6 digits.';
      }
      return;
    }

    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying... ⏳';
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'enquiry', otp: code })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (feedback) {
          feedback.style.color = '#DC2626';
          feedback.textContent = data.error || 'Verification failed.';
        }
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = 'Verify Code ✓';
        }
        return;
      }

      this.enquiryVerifiedToken = data.verifiedToken;
      this.enquiryVerifiedEmail = email;

      if (this.enquiryOtpTimer) {
        clearInterval(this.enquiryOtpTimer);
        this.enquiryOtpTimer = null;
      }

      const box = document.getElementById('enquiryOtpBox');
      if (box) box.style.display = 'none';

      const sendBtn = document.getElementById('enquirySendOtpBtn');
      if (sendBtn) sendBtn.style.display = 'none';

      const badge = document.getElementById('enquiryVerifiedBadge');
      const label = document.getElementById('enquiryVerifiedEmailLabel');
      if (label) label.textContent = email;
      if (badge) badge.style.display = 'flex';

      this.showToast('✅ Email verified! You can now submit your enquiry.', 'success');
    } catch (err) {
      if (feedback) {
        feedback.style.color = '#DC2626';
        feedback.textContent = 'Error: ' + err.message;
      }
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Code ✓';
      }
    }
  },

  async handleEnquirySubmit(event) {
    if (event) event.preventDefault();
    const fullName = document.getElementById('contactFullName')?.value.trim();
    const email = document.getElementById('contactEmail')?.value.trim().toLowerCase();
    const phone = document.getElementById('contactPhone')?.value.trim();
    const category = document.getElementById('contactCategory')?.value || 'General Healthcare Enquiry';
    const subject = document.getElementById('contactSubject')?.value.trim();
    const message = document.getElementById('contactMessage')?.value.trim();
    const submitBtn = document.getElementById('enquirySubmitBtn');

    if (!fullName || fullName.length < 2) {
      this.showToast('Please enter your full name (minimum 2 characters).', 'warning');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showToast('Please enter a valid email address.', 'warning');
      return;
    }
    if (!this.enquiryVerifiedToken || this.enquiryVerifiedEmail !== email) {
      this.showToast('Email verification required. Click "Send OTP" and enter your verification code before submitting.', 'warning');
      const box = document.getElementById('enquiryOtpBox');
      if (box) {
        box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (!subject || subject.length < 3) {
      this.showToast('Please enter an enquiry subject.', 'warning');
      return;
    }
    if (!message || message.length < 10) {
      this.showToast('Please describe your enquiry in at least 10 characters.', 'warning');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting & Dispatching... ⏳';
    }

    try {
      const res = await fetch('/api/enquiries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          category,
          subject,
          message,
          verifiedToken: this.enquiryVerifiedToken
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed.');
      }

      // Display success receipt
      const successBox = document.getElementById('enquirySuccessBox');
      const refEl = document.getElementById('enquirySuccessRef');
      const emailEl = document.getElementById('enquirySuccessEmail');
      if (refEl) refEl.textContent = data.referenceId;
      if (emailEl) emailEl.textContent = email;
      if (successBox) {
        successBox.style.display = 'block';
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Reset state and fields
      this.enquiryVerifiedToken = null;
      this.enquiryVerifiedEmail = '';
      const form = document.getElementById('hospitalContactForm');
      if (form) {
        document.getElementById('contactFullName').value = '';
        document.getElementById('contactSubject').value = '';
        document.getElementById('contactMessage').value = '';
      }
      const badge = document.getElementById('enquiryVerifiedBadge');
      if (badge) badge.style.display = 'none';
      const sendBtn = document.getElementById('enquirySendOtpBtn');
      if (sendBtn) {
        sendBtn.style.display = 'inline-flex';
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send OTP 📨';
      }

      this.showToast(`✅ Enquiry [${data.referenceId}] successfully submitted!`, 'success');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Another Enquiry 📨';
      }
    } catch (err) {
      this.showToast(`Submission Error: ${err.message}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Clinical Enquiry 📨';
      }
    }
  },

  // 1. Departments Rendering (All 14 Clinical Specialties)
  renderDepartments() {
    const grid = document.getElementById('departmentsGrid');
    if (!grid) return;

    grid.innerHTML = HOSPITAL_DATA.departments.map(dept => `
      <div class="department-card">
        <div class="department-icon-box">
          ${this.getDeptIcon(dept.id)}
        </div>
        <h3 class="department-title">${dept.name}</h3>
        <p class="department-desc">${dept.description}</p>

        <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem;">
          Specialized Services:
        </div>
        <ul style="list-style: none; padding: 0; margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--text-secondary);">
          ${dept.treatments.slice(0, 3).map(t => `<li style="margin-bottom: 0.25rem;"><span style="color: var(--secondary); font-weight: bold;">✓</span> ${t}</li>`).join('')}
        </ul>

        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem; border-top: 1px solid var(--border); padding-top: 0.6rem;">
          📍 ${dept.room} • 🕒 ${dept.hours.split('(')[0]}
        </div>

        <div style="margin-top: auto; display: flex; gap: 0.5rem;">
          <button class="btn btn-outline" style="flex: 1; font-size: 0.82rem; padding: 0.5rem;" onclick="App.openDepartmentModal('${dept.id}')">
            Learn More
          </button>
          <button class="btn btn-primary" style="flex: 1; font-size: 0.82rem; padding: 0.5rem;" onclick="BookingWizard.open(null, '${dept.id}')">
            Book Clinic
          </button>
        </div>
      </div>
    `).join('');
  },

  getDeptIcon(deptId) {
    const icons = {
      cardiology: '❤️',
      neurology: '🧠',
      orthopaedics: '🦴',
      paediatrics: '👶',
      'general-medicine': '🩺',
      emergency: '🚨',
      maternity: '🌸',
      dermatology: '✨',
      radiology: '🔬',
      oncology: '🎗️',
      physiotherapy: '🏃',
      'mental-health': '🧘',
      dental: '🦷',
      pathology: '🧪'
    };
    return icons[deptId] || '🏥';
  },

  openDepartmentModal(deptId) {
    const dept = HOSPITAL_DATA.departments.find(d => d.id === deptId);
    if (!dept) return;

    const modal = document.getElementById('departmentDetailModal');
    const content = document.getElementById('departmentModalContent');
    if (!modal || !content) return;

    const associatedDocs = HOSPITAL_DATA.doctors.filter(d => d.departmentId === deptId);

    content.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
        <div style="font-size: 2.5rem; background: var(--primary-light); width: 64px; height: 64px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
          ${this.getDeptIcon(dept.id)}
        </div>
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0;">${dept.name}</h2>
          <div style="font-size: 0.85rem; color: var(--secondary); font-weight: 600;">Department Lead: ${dept.head}</div>
        </div>
      </div>

      <div style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem;">
        ${dept.description}
      </div>

      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">
        Available Clinical Treatments & Procedures:
      </h4>
      <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.5rem; margin-bottom: 1.5rem;">
        ${dept.treatments.map(t => `<li style="background: var(--bg-alt); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); font-size: 0.88rem;"><span style="color: var(--secondary);">✓</span> ${t}</li>`).join('')}
      </ul>

      <div style="background: #f0f7fc; border: 1px solid #bae6fd; border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem;">
        <div style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.3rem;">📍 <strong>Clinical Location:</strong> ${dept.room}</div>
        <div style="font-size: 0.85rem; color: var(--text-primary);">🕒 <strong>Operating Hours:</strong> ${dept.hours}</div>
      </div>

      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">
        Associated Specialists (${associatedDocs.length}):
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        ${associatedDocs.map(doc => `
          <div style="display: flex; gap: 0.75rem; align-items: center; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem;">
            <img src="${doc.avatar}" alt="${doc.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${doc.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${doc.credentials}</div>
              <div style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">$${doc.fee} AUD</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button class="btn btn-outline" onclick="App.closeAllModals()">Close</button>
        <button class="btn btn-primary" onclick="App.closeAllModals(); BookingWizard.open(null, '${dept.id}')">
          Book Appointment in ${dept.shortName}
        </button>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  // 2. Doctors Rendering (All 15 Specialist Profiles)
  renderDoctors() {
    const grid = document.getElementById('doctorsGrid');
    if (!grid) return;

    let filtered = HOSPITAL_DATA.doctors;

    if (this.currentDoctorFilter && this.currentDoctorFilter !== 'all') {
      filtered = filtered.filter(d => d.departmentId === this.currentDoctorFilter);
    }

    if (this.currentSearchQuery) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(this.currentSearchQuery) ||
        d.title.toLowerCase().includes(this.currentSearchQuery) ||
        d.specialisation.toLowerCase().includes(this.currentSearchQuery) ||
        d.credentials.toLowerCase().includes(this.currentSearchQuery)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <h4 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem;">No specialist doctors match your search</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Try selecting a different specialty or clearing your search keywords.</p>
          <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="App.resetDoctorFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(doc => `
      <div class="doctor-card">
        <div class="doctor-avatar-wrapper">
          <img src="${doc.avatar}" alt="${doc.name}" class="doctor-avatar" loading="lazy">
          <div class="doctor-fee-badge">$${doc.fee} AUD</div>
        </div>

        <div class="doctor-info">
          <h3 class="doctor-name">${doc.name}</h3>
          <div class="doctor-specialty">${doc.specialisation || doc.title}</div>
          <div class="doctor-credentials">${doc.credentials}</div>

          <div class="doctor-meta-row">
            <div>⏱️ <strong>${doc.experience}</strong> Exp</div>
            <div>🗣️ <strong>${doc.languages.join(', ')}</strong></div>
          </div>

          <div style="font-size: 0.8rem; color: var(--success); font-weight: 600; margin-bottom: 1rem;">
            🟢 Available: ${doc.nextAvailable}
          </div>

          <div style="display: flex; gap: 0.5rem; margin-top: auto;">
            <button class="btn btn-outline" style="flex: 1; font-size: 0.82rem; padding: 0.5rem;" onclick="App.openDoctorModal('${doc.id}')">
              View Profile
            </button>
            <button class="btn btn-primary" style="flex: 1; font-size: 0.82rem; padding: 0.5rem;" onclick="BookingWizard.open('${doc.id}')">
              Book Visit
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  resetDoctorFilters() {
    this.currentDoctorFilter = 'all';
    this.currentSearchQuery = '';
    const deptSelect = document.getElementById('doctorDeptFilter');
    const searchInput = document.getElementById('doctorSearchInput');
    if (deptSelect) deptSelect.value = 'all';
    if (searchInput) searchInput.value = '';
    this.renderDoctors();
  },

  openDoctorModal(doctorId) {
    const doc = HOSPITAL_DATA.doctors.find(d => d.id === doctorId);
    if (!doc) return;

    const modal = document.getElementById('doctorDetailModal');
    const content = document.getElementById('doctorModalContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem;">
        <img src="${doc.avatar}" alt="${doc.name}" style="width: 130px; height: 130px; border-radius: var(--radius-lg); object-fit: cover; box-shadow: var(--shadow-md);">
        <div style="flex: 1; min-width: 250px;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.25rem;">${doc.name}</h2>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--secondary); margin-bottom: 0.25rem;">${doc.title}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">${doc.credentials}</div>
          <div style="display: flex; gap: 1rem; font-size: 0.85rem; flex-wrap: wrap;">
            <div>⏱️ <strong>${doc.experience}</strong></div>
            <div>⭐ <strong>${doc.rating}</strong> (${doc.reviewsCount} reviews)</div>
            <div>💰 Consultation Fee: <strong>$${doc.fee} AUD</strong></div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">Professional Biography:</h4>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">${doc.bio}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; background: var(--bg-alt); padding: 1rem; border-radius: var(--radius-md);">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">ACADEMIC QUALIFICATIONS</div>
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-top: 0.2rem;">${doc.education}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">LANGUAGES SPOKEN</div>
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-top: 0.2rem;">${doc.languages.join(', ')}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">CLINICAL LOCATION</div>
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-top: 0.2rem;">${doc.room}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button class="btn btn-outline" onclick="App.closeAllModals()">Close</button>
        <button class="btn btn-primary" onclick="App.closeAllModals(); BookingWizard.open('${doc.id}')">
          Book Appointment with ${doc.name.split(' ')[1] || doc.name}
        </button>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  // 3. Animated Statistics Counters
  initAnimatedCounters() {
    const statsSection = document.getElementById('hospitalStatsRow');
    if (!statsSection) return;

    let animated = false;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        this.runCounter('statCounterExp', 0, 48, 1500, '');
        this.runCounter('statCounterDocs', 0, 180, 1800, '+');
        this.runCounter('statCounterBeds', 0, 520, 2000, '');
        this.runCounter('statCounterDepts', 0, 14, 1200, '');
        this.runCounter('statCounterPatients', 0, 95, 2200, ',000+');
      }
    }, { threshold: 0.2 });

    observer.observe(statsSection);
  },

  runCounter(elementId, start, end, duration, suffix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;

    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      el.textContent = current + suffix;
      if (current === end) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 20));
  },

  // 4. Testimonials Rendering
  renderTestimonials() {
    const container = document.getElementById('testimonialsGrid');
    if (!container) return;

    container.innerHTML = HOSPITAL_DATA.testimonials.map(t => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 1rem;">⭐⭐⭐⭐⭐</div>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); font-style: italic; margin-bottom: 1.5rem; flex: 1;">
          "${t.quote}"
        </p>
        <div style="display: flex; align-items: center; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
          <img src="${t.avatar}" alt="${t.patientName}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
          <div>
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0;">${t.patientName}, ${t.age}</h4>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${t.location}</div>
            <div style="font-size: 0.78rem; color: var(--primary); font-weight: 600;">${t.procedure} • ${t.doctor}</div>
          </div>
        </div>
      </div>
    `).join('');
  },

  // 5. Health News Articles Rendering
  renderArticles() {
    const container = document.getElementById('articlesGrid');
    if (!container) return;

    container.innerHTML = HOSPITAL_DATA.articles.map(art => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-xs); display: flex; flex-direction: column;">
        <img src="${art.image}" alt="${art.title}" style="height: 200px; width: 100%; object-fit: cover;">
        <div style="padding: 1.5rem; display: flex; flex-direction: column; flex: 1;">
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">
            <span>${art.category}</span>
            <span style="color: var(--text-muted);">${art.readTime}</span>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); line-height: 1.35; margin-bottom: 0.75rem;">
            ${art.title}
          </h4>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem; flex: 1;">
            ${art.excerpt}
          </p>
          <div style="border-top: 1px solid var(--border); padding-top: 0.75rem; font-size: 0.78rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
            <span>${art.author}</span>
            <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="App.showToast('Full clinical article loaded.', 'info')">Read Article</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  // 6. Frequently Asked Questions
  renderFaqs() {
    const container = document.getElementById('faqsAccordion');
    if (!container) return;

    container.innerHTML = HOSPITAL_DATA.faqs.map((faq, idx) => `
      <div class="faq-item" style="border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.75rem; overflow: hidden; background: white;">
        <button type="button" class="faq-header" style="width: 100%; text-align: left; padding: 1.25rem; font-weight: 700; font-size: 1rem; color: var(--text-primary); background: transparent; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="App.toggleFaq(${idx})">
          <span>${faq.q}</span>
          <span id="faq-icon-${idx}" style="font-size: 1.2rem; color: var(--primary);">+</span>
        </button>
        <div id="faq-body-${idx}" style="display: none; padding: 0 1.25rem 1.25rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; border-top: 1px solid var(--border);">
          ${faq.a}
        </div>
      </div>
    `).join('');
  },

  toggleFaq(idx) {
    const body = document.getElementById(`faq-body-${idx}`);
    const icon = document.getElementById(`faq-icon-${idx}`);
    if (!body || !icon) return;

    if (body.style.display === 'block') {
      body.style.display = 'none';
      icon.textContent = '+';
    } else {
      body.style.display = 'block';
      icon.textContent = '−';
    }
  },

  // 7. Darwin CareBot Navigation Assistant
  toggleCareBot() {
    const botWindow = document.getElementById('careBotWindow');
    if (botWindow) {
      botWindow.classList.toggle('active');
    }
  },

  sendCareBotMessage() {
    const input = document.getElementById('careBotInput');
    const box = document.getElementById('careBotMessages');
    if (!input || !box) return;

    const query = input.value.trim();
    if (!query) return;

    // Append user message
    box.innerHTML += `<div class="carebot-msg user">${query}</div>`;
    input.value = '';
    box.scrollTop = box.scrollHeight;

    // Simulate CareBot intelligence (non-diagnostic navigation)
    setTimeout(() => {
      const q = query.toLowerCase();
      let reply = "I can guide you to our clinical specialties, doctor directory, 7-step booking system, or visiting hours. For urgent medical emergencies, immediately dial 000.";

      if (q.includes('book') || q.includes('appointment')) {
        reply = "To schedule an appointment, click the 'Book Appointment' button at the top of the page. You can choose from our 14 departments and 15 specialists.";
      } else if (q.includes('emergency') || q.includes('urgent') || q.includes('000')) {
        reply = "🚨 In Australia, dial 000 immediately for ambulance and emergency trauma. Darwin City Hospital Level-1 Trauma Centre is open 24/7 at Rocklands Drive, Tiwi.";
      } else if (q.includes('visiting') || q.includes('hours')) {
        reply = "Hospital visiting hours are 10:00 AM – 8:00 PM for General Wards, and 11:00 AM – 1:00 PM & 5:00 PM – 7:00 PM for the Intensive Care Unit.";
      } else if (q.includes('cardiology') || q.includes('heart')) {
        reply = "Our Cardiology & Heart Health department is directed by Dr. Sarah Jenkins at Wing A, Level 3, Suite 304. We offer 24/7 cardiac catheterization and consultation.";
      } else if (q.includes('doctor') || q.includes('specialist')) {
        reply = "We have 15 credentialed specialist doctors across 14 clinical fields. You can explore their qualifications and fees in the 'Our Doctors' directory.";
      } else if (q.includes('medicare') || q.includes('cost') || q.includes('fee')) {
        reply = "Darwin City Hospital accepts Medicare cards and all Australian private health insurers. Outpatient specialist fees range from $140 to $260 AUD with Medicare rebates available.";
      }

      box.innerHTML += `<div class="carebot-msg bot">${reply}</div>`;
      box.scrollTop = box.scrollHeight;
    }, 400);
  },

  // 8. Global Quick Search (Ctrl+K)
  openSearchModal() {
    const modal = document.getElementById('globalSearchModal');
    const input = document.getElementById('globalSearchInput');
    if (modal) {
      modal.classList.add('active');
      if (input) {
        input.value = '';
        input.focus();
        this.runGlobalSearch('');
      }
      document.body.style.overflow = 'hidden';
    }
  },

  runGlobalSearch(val) {
    const resultsContainer = document.getElementById('globalSearchResults');
    if (!resultsContainer) return;

    const q = val.toLowerCase().trim();
    const hits = [];

    // Search departments
    HOSPITAL_DATA.departments.forEach(dept => {
      if (!q || dept.name.toLowerCase().includes(q) || dept.description.toLowerCase().includes(q)) {
        hits.push({
          type: 'Department',
          icon: '🏥',
          title: dept.name,
          subtitle: dept.room,
          action: `App.closeAllModals(); App.openDepartmentModal('${dept.id}')`
        });
      }
    });

    // Search doctors
    HOSPITAL_DATA.doctors.forEach(doc => {
      if (!q || doc.name.toLowerCase().includes(q) || doc.title.toLowerCase().includes(q) || doc.specialisation.toLowerCase().includes(q)) {
        hits.push({
          type: 'Specialist Doctor',
          icon: '👨‍⚕️',
          title: doc.name,
          subtitle: `${doc.title} • ${doc.credentials}`,
          action: `App.closeAllModals(); App.openDoctorModal('${doc.id}')`
        });
      }
    });

    if (hits.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No matching clinical resources found.</div>`;
      return;
    }

    resultsContainer.innerHTML = hits.slice(0, 8).map(h => `
      <div class="search-result-item" onclick="${h.action}">
        <div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${h.icon} ${h.title}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${h.subtitle}</div>
        </div>
        <span class="badge badge-secondary" style="font-size: 0.7rem;">${h.type}</span>
      </div>
    `).join('');
  },

  // 9. Accessibility Toolbar
  adjustFontSize(delta) {
    this.fontSizeLevel = Math.max(80, Math.min(130, this.fontSizeLevel + delta));
    document.documentElement.style.fontSize = `${this.fontSizeLevel}%`;
    this.showToast(`Font size adjusted to ${this.fontSizeLevel}%`, 'info');
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dch_theme', next);
    this.showToast(`Theme switched to ${next} mode`, 'info');
  },

  // 10. Modals & Notifications
  closeAllModals() {
    document.querySelectorAll('.modal-backdrop, .search-modal-backdrop').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

window.App = App;

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
