/**
 * Darwin City Hospital — Master Application Controller
 * High-performance UI rendering, CareBot Assistant, Accessibility, and Modals
 */

const App = {
  currentDoctorFilter: 'all',
  currentDoctorLangFilter: 'all',
  currentDoctorExpFilter: 'all',
  currentSearchQuery: '',
  fontSizeLevel: 100, // percentage
  enquiryVerifiedEmail: '',
  enquiryVerifiedToken: null,
  enquiryOtpTimer: null,
  enquiryOtpSeconds: 0,
  telehealthTimerInterval: null,
  telehealthSeconds: 272,
  userDoctorFavorites: new Set(['doc-jenkins']),

  init() {
    this.renderDepartments();
    this.renderDoctors();
    this.renderTestimonials();
    this.renderArticles();
    this.renderFaqs();
    this.initAnimatedCounters();
    this.bindGlobalEvents();
    this.loadDoctorFavorites();

    // Initialize submodules
    if (window.BookingWizard) window.BookingWizard.init();
    if (window.PatientPortal) window.PatientPortal.init();
    if (window.HospitalAdmin) window.HospitalAdmin.init();

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }

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

    const langFilter = document.getElementById('doctorLangFilter');
    if (langFilter) {
      langFilter.addEventListener('change', (e) => {
        this.currentDoctorLangFilter = e.target.value.toLowerCase();
        this.renderDoctors();
      });
    }

    const expFilter = document.getElementById('doctorExpFilter');
    if (expFilter) {
      expFilter.addEventListener('change', (e) => {
        this.currentDoctorExpFilter = e.target.value;
        this.renderDoctors();
      });
    }

    // Nav Dropdown click toggling and outside click closing
    document.querySelectorAll('.nav-dropdown-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = btn.closest('.nav-dropdown');
        const wasActive = parent.classList.contains('active');
        document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('active'));
        if (!wasActive) parent.classList.add('active');
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('active'));
    });

    // Dark/Light Mode Preference Init
    const savedTheme = localStorage.getItem('dch_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Language Preference Init
    const savedLang = localStorage.getItem('dch_lang') || 'en';
    const langSelect = document.getElementById('globalLangSelector');
    if (langSelect) langSelect.value = savedLang;
    if (savedLang !== 'en') this.setLanguage(savedLang, false);
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

  // 2. Doctors Rendering (All 15 Specialist Profiles with Multi-Faceted Filters & Favorites)
  renderDoctors() {
    const grid = document.getElementById('doctorsGrid');
    if (!grid) return;

    let filtered = HOSPITAL_DATA.doctors;

    if (this.currentDoctorFilter && this.currentDoctorFilter !== 'all') {
      filtered = filtered.filter(d => d.departmentId === this.currentDoctorFilter);
    }

    if (this.currentDoctorLangFilter && this.currentDoctorLangFilter !== 'all') {
      filtered = filtered.filter(d =>
        d.languages.some(lang => lang.toLowerCase().includes(this.currentDoctorLangFilter))
      );
    }

    if (this.currentDoctorExpFilter && this.currentDoctorExpFilter !== 'all') {
      const minYears = parseInt(this.currentDoctorExpFilter, 10);
      filtered = filtered.filter(d => {
        const years = parseInt(d.experience, 10) || 0;
        return years >= minYears;
      });
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
          <h4 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem;">No specialist doctors match your search or filters</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Try selecting a different language, specialty, or experience tier.</p>
          <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="App.resetDoctorFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(doc => {
      const isFav = this.userDoctorFavorites.has(doc.id);
      return `
        <div class="doctor-card">
          <div class="doctor-avatar-wrapper" style="position: relative;">
            <img src="${doc.avatar}" alt="${doc.name}" class="doctor-avatar" loading="lazy">
            <div class="doctor-fee-badge">$${doc.fee} AUD</div>
            <button type="button" class="btn-doctor-fav ${isFav ? 'favorited' : ''}" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.95); border: 1px solid var(--border); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);" onclick="App.toggleDoctorFav('${doc.id}', this)" title="${isFav ? 'Remove from favorites' : 'Add to favorite specialists'}">
              ${isFav ? '❤️' : '🤍'}
            </button>
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
      `;
    }).join('');
  },

  async loadDoctorFavorites() {
    try {
      const res = await fetch('/api/doctors/favorites?patientId=1');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.userDoctorFavorites = new Set(json.data);
      }
    } catch (e) {
      console.warn('Could not load doctor favorites from API:', e.message);
    }
  },

  async toggleDoctorFav(doctorId, btn) {
    try {
      const res = await fetch('/api/doctors/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: 1, doctorId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.favorited) {
          this.userDoctorFavorites.add(doctorId);
          if (btn) {
            btn.classList.add('favorited');
            btn.textContent = '❤️';
          }
          this.showToast('Specialist added to your favorites.', 'success');
        } else {
          this.userDoctorFavorites.delete(doctorId);
          if (btn) {
            btn.classList.remove('favorited');
            btn.textContent = '🤍';
          }
          this.showToast('Specialist removed from your favorites.', 'info');
        }
      }
    } catch (e) {
      this.showToast('Error updating favorites.', 'error');
    }
  },

  resetDoctorFilters() {
    this.currentDoctorFilter = 'all';
    this.currentDoctorLangFilter = 'all';
    this.currentDoctorExpFilter = 'all';
    this.currentSearchQuery = '';
    const deptSelect = document.getElementById('doctorDeptFilter');
    const langSelect = document.getElementById('doctorLangFilter');
    const expSelect = document.getElementById('doctorExpFilter');
    const searchInput = document.getElementById('doctorSearchInput');
    if (deptSelect) deptSelect.value = 'all';
    if (langSelect) langSelect.value = 'all';
    if (expSelect) expSelect.value = 'all';
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

  // 10. Modal and Dropdown Management
  closeAllModals() {
    document.querySelectorAll('.modal-overlay, .modal-backdrop').forEach(m => {
      m.classList.remove('active');
    });
    const bookingModal = document.getElementById('bookingWizardModal');
    if (bookingModal) bookingModal.classList.remove('active');
    const authModal = document.getElementById('portalAuthModal');
    if (authModal) authModal.classList.remove('active');
    document.body.style.overflow = '';
    if (this.telehealthTimerInterval) {
      clearInterval(this.telehealthTimerInterval);
      this.telehealthTimerInterval = null;
    }
  },

  closeDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('active'));
  },

  // 11. Multilingual Translation Switcher
  setLanguage(lang, notify = true) {
    const TRANSLATIONS = {
      en: {
        hospital_name: "Darwin City Hospital",
        tagline: "Northern Territory • Australia",
        nav_home: "Home",
        nav_about: "About Us",
        nav_departments: "Clinical Services",
        nav_doctors: "Our Doctors",
        nav_emergency: "Emergency (000)",
        nav_visitors: "Patients & Visitors",
        nav_health_info: "Health Info",
        nav_contact: "Contact Us",
        nav_portal: "Portal Login",
        nav_book: "Book Appointment",
        nav_checkin: "Check In",
        top_trauma: "🏥 Level-1 Regional Trauma Centre NT • 24/7 Resuscitation Ready",
        hero_badge: "🇦🇺 Premier Australian Hospital & Level-1 Trauma Centre",
        hero_title: "Your Health, Our Priority.",
        hero_subtitle: "Darwin City Hospital provides world-class tertiary referral healthcare across the Top End of Australia. From 24/7 Level-1 trauma resuscitation and robotic surgery to compassionate family medicine, our 180+ qualified specialists are dedicated to your wellbeing."
      },
      ne: {
        hospital_name: "डार्विन सिटी अस्पताल",
        tagline: "उत्तरी क्षेत्र • अष्ट्रेलिया",
        nav_home: "गृहपृष्ठ",
        nav_about: "हाम्रोबारे",
        nav_departments: "क्लिनिकल सेवाहरू",
        nav_doctors: "हाम्रा डाक्टरहरू",
        nav_emergency: "आकस्मिक (०००)",
        nav_visitors: "बिरामी र आगन्तुक",
        nav_health_info: "स्वास्थ्य जानकारी",
        nav_contact: "सम्पर्क",
        nav_portal: "पोर्टल लगइन",
        nav_book: "अपोइन्टमेन्ट लिनुहोस्",
        nav_checkin: "चेक-इन",
        top_trauma: "🏥 लेभल-१ क्षेत्रीय ट्रमा सेन्टर NT • २४/७ आकस्मिक सेवा",
        hero_badge: "🇦🇺 अष्ट्रेलियाको उत्कृष्ट अस्पताल र लेभल-१ ट्रमा सेन्टर",
        hero_title: "तपाईंको स्वास्थ्य, हाम्रो पहिलो प्राथमिकता।",
        hero_subtitle: "डार्विन सिटी अस्पतालले अष्ट्रेलियाको टप एन्डमा विश्वस्तरीय तृतीयक स्वास्थ्य सेवा प्रदान गर्दछ। २४/७ लेभल-१ ट्रमा उपचार र रोबोटिक शल्यक्रियादेखि पारिवारिक औषधिसम्म, हाम्रा १८०+ योग्य विशेषज्ञहरू तपाईंको स्वास्थ्यमा समर्पित छन्।"
      },
      hi: {
        hospital_name: "डार्विन सिटी अस्पताल",
        tagline: "उत्तरी क्षेत्र • ऑस्ट्रेलिया",
        nav_home: "मुख्य पृष्ठ",
        nav_about: "हमारे बारे में",
        nav_departments: "नैदानिक सेवाएं",
        nav_doctors: "हमारे डॉक्टर्स",
        nav_emergency: "आपातकालीन (000)",
        nav_visitors: "रोगी एवं आगंतुक",
        nav_health_info: "स्वास्थ्य जानकारी",
        nav_contact: "संपर्क करें",
        nav_portal: "पोर्टल लॉगिन",
        nav_book: "अपॉइंटमेंट बुक करें",
        nav_checkin: "चेक-इन",
        top_trauma: "🏥 लेवल-1 क्षेत्रीय ट्रॉमा सेंटर NT • 24/7 आपातकालीन सेवाएं",
        hero_badge: "🇦🇺 ऑस्ट्रेलिया का प्रमुख अस्पताल और लेवल-1 ट्रॉमा सेंटर",
        hero_title: "आपका स्वास्थ्य, हमारी सर्वोच्च प्राथमिकता।",
        hero_subtitle: "डार्विन सिटी अस्पताल पूरे ऑस्ट्रेलिया के शीर्ष क्षेत्र में विश्व स्तरीय तृतीयक रेफरल स्वास्थ्य सेवा प्रदान करता है। 24/7 लेवल-1 ट्रॉमा रिससिटेशन से लेकर रोबोटिक सर्जरी तक, हमारे विशेषज्ञ आपके कल्याण के लिए समर्पित हैं।"
      }
    };

    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    try { localStorage.setItem('dch_lang', lang); } catch (e) {}

    const navTitle = document.getElementById('navHospitalTitle');
    if (navTitle && t.hospital_name) navTitle.textContent = t.hospital_name;

    const navSub = document.getElementById('navHospitalSubtitle');
    if (navSub && t.tagline) navSub.textContent = t.tagline;

    const navHome = document.getElementById('navLinkHome');
    if (navHome && t.nav_home) navHome.textContent = t.nav_home;

    const navAbout = document.getElementById('navLinkAbout');
    if (navAbout && t.nav_about) navAbout.textContent = t.nav_about;

    const navDepts = document.getElementById('navLinkDepts');
    if (navDepts && t.nav_departments) navDepts.textContent = t.nav_departments;

    const navDocs = document.getElementById('navLinkDoctors');
    if (navDocs && t.nav_doctors) navDocs.textContent = t.nav_doctors;

    const navVisitors = document.getElementById('navLinkVisitors');
    if (navVisitors && t.nav_visitors) navVisitors.textContent = t.nav_visitors;

    const navHealth = document.getElementById('navLinkHealthInfo');
    if (navHealth && t.nav_health_info) navHealth.textContent = t.nav_health_info;

    const navContact = document.getElementById('navLinkContact');
    if (navContact && t.nav_contact) navContact.textContent = t.nav_contact;

    const portalBtn = document.getElementById('portalAuthNavBtn');
    if (portalBtn && t.nav_portal) portalBtn.textContent = '👤 ' + t.nav_portal;

    const topTrauma = document.getElementById('topSubBarNote');
    if (topTrauma && t.top_trauma) topTrauma.textContent = t.top_trauma;

    const heroBadge = document.getElementById('heroBadge');
    if (heroBadge && t.hero_badge) heroBadge.textContent = t.hero_badge;

    const heroH1 = document.querySelector('.hero-title');
    if (heroH1 && t.hero_title) {
      if (t.hero_title.includes(',')) {
        heroH1.innerHTML = t.hero_title.replace(',', ',<br><span style="color: var(--primary);">') + '</span>';
      } else {
        heroH1.textContent = t.hero_title;
      }
    }

    const heroSub = document.getElementById('heroSubtitle');
    if (heroSub && t.hero_subtitle) heroSub.textContent = t.hero_subtitle;

    const langSelect = document.getElementById('globalLangSelector');
    if (langSelect && langSelect.value !== lang) langSelect.value = lang;

    if (notify) {
      this.showToast(`Language set to ${lang === 'ne' ? 'नेपाली (Nepali)' : lang === 'hi' ? 'हिन्दी (Hindi)' : 'English (AU)'}`, 'info');
    }

    // Asynchronous backend fetch if running on Node.js
    fetch(`/api/translations/${lang}`).catch(() => {});
  },

  // 12. Digital Appointment Check-in
  openCheckinModal() {
    this.closeAllModals();
    const modal = document.getElementById('checkinModal');
    const resultCard = document.getElementById('checkinResultCard');
    const input = document.getElementById('checkinRefInput');
    if (resultCard) resultCard.style.display = 'none';
    if (input) input.value = '';
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (input) input.focus();
    }
  },

  async handleCheckinSubmit(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('checkinRefInput');
    const submitBtn = document.getElementById('btnCheckinSubmit');
    const resultCard = document.getElementById('checkinResultCard');
    const ticketEl = document.getElementById('checkinTicketNum');
    const docEl = document.getElementById('checkinDoctorInfo');
    const roomEl = document.getElementById('checkinRoomInfo');
    const waitEl = document.getElementById('checkinWaitInfo');
    const canvas = document.getElementById('checkinQrCanvas');

    const ref = (input?.value || '').trim();
    if (!ref) {
      this.showToast('Please enter your appointment reference code.', 'warning');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying... ⏳';
    }

    let data = null;
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentRef: ref })
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch (err) {
      // Offline / GitHub Pages
    }

    if (!data || !data.success) {
      // If on GitHub Pages or static host, provide high quality simulated check-in
      const isStaticHost = window.location.hostname.includes('github.io') || !data;
      if (isStaticHost) {
        const randomNum = Math.floor(10 + Math.random() * 89);
        data = {
          success: true,
          message: 'Digital Check-in confirmed! Proceed to Outpatient Waiting Area.',
          checkin: {
            queueNumber: 'Q-0' + randomNum,
            doctorName: 'Dr. Sarah Jenkins',
            departmentName: 'Cardiology & Heart Health',
            room: 'Suite 302, Level 3',
            estimatedWaitMins: 15,
            qrToken: `dch-queue://verify/${ref}/Q-0${randomNum}`
          }
        };
      } else {
        this.showToast(data?.error || 'Check-in failed. Please verify your reference number.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Check In 🚀';
        }
        return;
      }
    }

    const c = data.checkin;
    if (ticketEl) ticketEl.textContent = c.queueNumber;
    if (docEl) docEl.textContent = `${c.doctorName} • ${c.departmentName}`;
    if (roomEl) roomEl.textContent = `📍 ${c.room}`;
    if (waitEl) waitEl.textContent = `⏱️ Estimated Wait: ~${c.estimatedWaitMins} mins`;

    if (canvas && window.QRCode) {
      QRCode.toCanvas(canvas, c.qrToken || `DCH:${c.queueNumber}`, { width: 110, margin: 1 });
    }

    if (resultCard) resultCard.style.display = 'block';
    this.showToast(data.message, 'success');

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Checked In ✓';
    }
  },

  // 13. Live Wait Times & Queue Board
  openLiveQueueModal() {
    this.closeAllModals();
    const modal = document.getElementById('liveQueueModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.refreshLiveQueue();
    }
  },

  async refreshLiveQueue() {
    const tableBody = document.getElementById('liveQueueTableBody');
    const waitingEl = document.getElementById('queueStatWaiting');
    const consultEl = document.getElementById('queueStatConsulting');
    const avgWaitEl = document.getElementById('queueStatAvgWait');

    let list = null;
    try {
      const res = await fetch('/api/queue/live');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) list = json.data;
      }
    } catch (e) {}

    if (!list) {
      list = [
        { queue_number: 'Q-041', doctor_name: 'Dr. Sarah Jenkins', department_name: 'Cardiology & Heart Health', room: 'Suite 302, Level 3', status: 'in_consultation', estimated_wait_mins: 0 },
        { queue_number: 'Q-042', doctor_name: 'Dr. Alexander Vance', department_name: 'Neurology & Stroke Unit', room: 'Suite 410, Level 4', status: 'waiting', estimated_wait_mins: 15 },
        { queue_number: 'Q-043', doctor_name: 'Dr. Marcus Brody', department_name: 'Orthopaedics & Joint Surgery', room: 'Suite 205, Level 2', status: 'waiting', estimated_wait_mins: 25 },
        { queue_number: 'Q-044', doctor_name: 'Dr. Emily Watson', department_name: 'Paediatrics & Child Health', room: 'Suite 108, Level 1', status: 'waiting', estimated_wait_mins: 35 }
      ];
    }

    const waitingCount = list.filter(q => q.status === 'waiting' || q.status === 'checked_in').length;
    const consultCount = list.filter(q => q.status === 'in_consultation').length;
    if (waitingEl) waitingEl.textContent = waitingCount;
    if (consultEl) consultEl.textContent = consultCount;
    if (avgWaitEl) avgWaitEl.textContent = waitingCount === 0 ? '5 mins' : `${waitingCount * 12} mins`;

    if (tableBody) {
      tableBody.innerHTML = list.map(q => {
        const isConsult = q.status === 'in_consultation';
        const badgeClass = isConsult ? 'badge-success' : 'badge-primary';
        const statusLabel = isConsult ? 'In Consultation' : 'Waiting for Doctor';
        return `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 0.75rem; font-weight: 800; font-family: monospace; font-size: 1.1rem; color: var(--primary);">${q.queue_number}</td>
            <td style="padding: 0.75rem; font-weight: 600;">${q.doctor_name}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${q.department_name}</span></td>
            <td style="padding: 0.75rem; font-size: 0.82rem; color: var(--text-secondary);">${q.room}</td>
            <td style="padding: 0.75rem;"><span class="badge ${badgeClass}">${statusLabel}</span></td>
            <td style="padding: 0.75rem; font-weight: 700; color: ${isConsult ? 'var(--secondary)' : 'var(--text-primary)'};">${isConsult ? 'In Progress' : `~${q.estimated_wait_mins} mins`}</td>
          </tr>
        `;
      }).join('');
    }
  },

  // 14. Telehealth Consultation Simulator
  openTelehealthModal() {
    this.closeAllModals();
    const modal = document.getElementById('telehealthModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.telehealthSeconds = 272;
      this.startTelehealthTimer();
    }
  },

  startTelehealthTimer() {
    if (this.telehealthTimerInterval) clearInterval(this.telehealthTimerInterval);
    const timerEl = document.getElementById('telehealthCallTimer');
    this.telehealthTimerInterval = setInterval(() => {
      this.telehealthSeconds++;
      const mins = String(Math.floor(this.telehealthSeconds / 60)).padStart(2, '0');
      const secs = String(this.telehealthSeconds % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = `00:${mins}:${secs}`;
    }, 1000);
  },

  toggleCallMute(btn) {
    if (!btn) return;
    if (btn.textContent.includes('Mute')) {
      btn.textContent = '🔇 Unmute';
      btn.style.color = '#ef4444';
      this.showToast('Microphone muted', 'info');
    } else {
      btn.textContent = '🎤 Mute';
      btn.style.color = '#fff';
      this.showToast('Microphone unmuted', 'info');
    }
  },

  toggleCallVideo(btn) {
    if (!btn) return;
    if (btn.textContent.includes('Stop')) {
      btn.textContent = '📹 Start Video';
      btn.style.color = '#ef4444';
      this.showToast('Camera turned off', 'info');
    } else {
      btn.textContent = '📷 Stop Video';
      btn.style.color = '#fff';
      this.showToast('Camera active', 'info');
    }
  },

  endTelehealthCall() {
    if (this.telehealthTimerInterval) {
      clearInterval(this.telehealthTimerInterval);
      this.telehealthTimerInterval = null;
    }
    this.closeAllModals();
    this.showToast('Telehealth consultation concluded. Summary notes saved to your patient portal.', 'success');
  },

  // 15. Patient Feedback
  openFeedbackModal() {
    this.closeAllModals();
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  async handleFeedbackSubmit(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('fbPatientName')?.value.trim();
    const comments = document.getElementById('fbComments')?.value.trim();
    const ratingRadio = document.querySelector('input[name="ratingOverall"]:checked');
    const rating = ratingRadio ? Number(ratingRadio.value) : 5;

    if (!name) {
      this.showToast('Please enter your name.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: name,
          ratingOverall: rating,
          ratingDoctor: rating,
          ratingCleanliness: 5,
          comments
        })
      });
      const data = await res.json();
      if (data.success) {
        this.closeAllModals();
        this.showToast('Thank you! Your feedback has been received and approved.', 'success');
        this.renderTestimonials();
      } else {
        this.showToast(data.error || 'Feedback submission failed.', 'error');
      }
    } catch (e) {
      this.showToast('Error submitting review: ' + e.message, 'error');
    }
  }
};

window.App = App;

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
