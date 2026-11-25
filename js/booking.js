/**
 * AuraHealth International Hospital
 * Interactive Appointment Booking Wizard with Strict Clinical & Temporal Validation
 */

const BookingWizard = {
  currentStep: 1,
  data: {
    departmentId: '',
    doctorId: '',
    type: 'in-person', // 'in-person' or 'telehealth'
    date: '',
    timeSlot: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientDob: '',
    patientGender: 'prefer-not-to-say',
    insurance: 'self-pay',
    symptoms: ''
  },

  getTodayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  formatDateHuman(isoStr) {
    if (!isoStr) return '';
    try {
      const parts = isoStr.split('-').map(Number);
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      return dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return isoStr;
    }
  },

  init() {
    this.bindEvents();
    this.populateDepartments();
    this.setupDateOptions();
  },

  open(preselectedDoctorId = null, preselectedDeptId = null) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    this.currentStep = 1;
    this.resetForm();
    this.setupDateOptions();

    if (preselectedDeptId) {
      this.data.departmentId = preselectedDeptId;
      const deptSelect = document.getElementById('bookDeptSelect');
      if (deptSelect) deptSelect.value = preselectedDeptId;
      this.handleDepartmentChange(preselectedDeptId);
    }

    if (preselectedDoctorId) {
      this.data.doctorId = preselectedDoctorId;
      const doc = HOSPITAL_DATA.doctors.find(d => d.id === preselectedDoctorId);
      if (doc) {
        this.data.departmentId = doc.departmentId;
        const deptSelect = document.getElementById('bookDeptSelect');
        if (deptSelect) deptSelect.value = doc.departmentId;
        this.handleDepartmentChange(doc.departmentId);
        const docSelect = document.getElementById('bookDoctorSelect');
        if (docSelect) docSelect.value = preselectedDoctorId;
        this.handleDoctorChange(preselectedDoctorId);
      }
    }

    this.updateStepUI();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  close() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  resetForm() {
    this.data = {
      departmentId: '',
      doctorId: '',
      type: 'in-person',
      date: '',
      timeSlot: '',
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      patientDob: '',
      patientGender: 'prefer-not-to-say',
      insurance: 'self-pay',
      symptoms: ''
    };
    const form = document.getElementById('bookingForm');
    if (form) form.reset();

    // Clear all inline errors
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('active');
    });
    document.querySelectorAll('.form-control').forEach(el => {
      el.classList.remove('is-invalid', 'is-valid');
    });
    const ageDisplay = document.getElementById('patientAgeDisplay');
    if (ageDisplay) ageDisplay.innerHTML = '';
  },

  populateDepartments() {
    const deptSelect = document.getElementById('bookDeptSelect');
    if (!deptSelect) return;
    deptSelect.innerHTML = '<option value="">-- Choose Medical Specialty --</option>';
    HOSPITAL_DATA.departments.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.id;
      opt.textContent = dept.name;
      deptSelect.appendChild(opt);
    });
  },

  handleDepartmentChange(deptId) {
    this.data.departmentId = deptId;
    if (deptId) {
      this.clearError('bookDeptSelect', 'bookDeptError');
    }
    const docSelect = document.getElementById('bookDoctorSelect');
    if (!docSelect) return;

    const filteredDocs = HOSPITAL_DATA.doctors.filter(d => !deptId || d.departmentId === deptId);
    docSelect.innerHTML = '<option value="">-- Select Specialist Physician --</option>';
    filteredDocs.forEach(doc => {
      const opt = document.createElement('option');
      opt.value = doc.id;
      opt.textContent = `${doc.name} (${doc.credentials}) - Fee: $${doc.fee}`;
      docSelect.appendChild(opt);
    });

    const infoCard = document.getElementById('selectedDoctorInfo');
    if (infoCard) infoCard.style.display = 'none';
  },

  handleDoctorChange(docId) {
    this.data.doctorId = docId;
    if (docId) {
      this.clearError('bookDoctorSelect', 'bookDoctorError');
    }
    const infoCard = document.getElementById('selectedDoctorInfo');
    if (!infoCard) return;

    const doc = HOSPITAL_DATA.doctors.find(d => d.id === docId);
    if (!doc) {
      infoCard.style.display = 'none';
      return;
    }

    infoCard.style.display = 'flex';
    infoCard.innerHTML = `
      <img src="${doc.avatar}" alt="${doc.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
      <div>
        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${doc.name}</h4>
        <p style="font-size: 0.8rem; color: var(--primary); font-weight: 600;">${doc.title}</p>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">⭐ ${doc.rating} (${doc.reviewsCount} reviews) • Consultation: <strong>$${doc.fee}</strong></p>
      </div>
    `;

    const selectedDate = document.getElementById('bookDate')?.value || this.getTodayStr();
    this.renderAvailableTimeSlots(doc, selectedDate);
  },

  setupDateOptions() {
    const dateInput = document.getElementById('bookDate');
    const dobInput = document.getElementById('patientDob');
    const todayNotice = document.getElementById('todayDateDisplay');

    const todayStr = this.getTodayStr();
    const humanToday = this.formatDateHuman(todayStr);

    if (todayNotice) {
      todayNotice.textContent = humanToday;
    }

    // Appointment Date constraints: min = today, max = 60 days ahead
    if (dateInput) {
      const maxDt = new Date();
      maxDt.setDate(maxDt.getDate() + 60);
      const maxY = maxDt.getFullYear();
      const maxM = String(maxDt.getMonth() + 1).padStart(2, '0');
      const maxD = String(maxDt.getDate()).padStart(2, '0');
      const maxDateStr = `${maxY}-${maxM}-${maxD}`;

      dateInput.min = todayStr;
      dateInput.max = maxDateStr;

      // Default value to today if not set or invalid
      if (!dateInput.value || dateInput.value < todayStr) {
        dateInput.value = todayStr;
        this.data.date = todayStr;
      }
    }

    // Date of Birth constraints: MUST be in the past (<= today) and after 1900
    if (dobInput) {
      dobInput.max = todayStr; // Disallow any future date!
      dobInput.min = '1900-01-01';
    }
  },

  isSlotInThePast(slotStr, selectedDateStr) {
    const todayStr = this.getTodayStr();
    if (selectedDateStr < todayStr) return true;
    if (selectedDateStr > todayStr) return false;

    // Same day comparison: Check hour and minute
    const match = slotStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    if (hours < currentHours) return true;
    if (hours === currentHours && minutes <= currentMinutes) return true;
    return false;
  },

  renderAvailableTimeSlots(doctor, selectedDateStr) {
    const slotsContainer = document.getElementById('availableSlotsContainer');
    const slotHint = document.getElementById('slotHint');
    if (!slotsContainer) return;

    const rawSlots = (doctor && doctor.timeSlots && doctor.timeSlots.length > 0)
      ? doctor.timeSlots
      : ["09:00 AM", "10:30 AM", "01:30 PM", "03:00 PM", "04:30 PM"];

    slotsContainer.innerHTML = '';
    let firstAvailable = null;
    let availableCount = 0;

    rawSlots.forEach((slot) => {
      const isPast = this.isSlotInThePast(slot, selectedDateStr);
      const btn = document.createElement('button');
      btn.type = 'button';

      if (isPast) {
        btn.className = 'slot-btn disabled-past-slot';
        btn.textContent = `${slot} (Passed)`;
        btn.title = `This time slot has already passed for ${this.formatDateHuman(selectedDateStr)}.`;
      } else {
        btn.className = 'slot-btn';
        btn.textContent = slot;
        availableCount++;
        if (!firstAvailable) {
          firstAvailable = slot;
        }

        btn.onclick = () => {
          document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.data.timeSlot = slot;
          this.clearError('availableSlotsContainer', 'slotError');
        };
      }

      slotsContainer.appendChild(btn);
    });

    if (firstAvailable) {
      // Auto-select first available valid slot
      const firstValidBtn = Array.from(slotsContainer.querySelectorAll('.slot-btn')).find(b => !b.classList.contains('disabled-past-slot'));
      if (firstValidBtn) {
        firstValidBtn.classList.add('selected');
        this.data.timeSlot = firstAvailable;
      }
      if (slotHint) {
        slotHint.textContent = `${availableCount} open slot(s) available for ${this.formatDateHuman(selectedDateStr)}.`;
        slotHint.style.color = '#0284c7';
      }
    } else {
      this.data.timeSlot = '';
      if (slotHint) {
        slotHint.innerHTML = `<span style="color: #dc2626; font-weight: 700;">⚠️ All clinic hours for ${this.formatDateHuman(selectedDateStr)} have passed. Please choose tomorrow or an upcoming date.</span>`;
      }
    }
  },

  validateDateLive() {
    const dateInput = document.getElementById('bookDate');
    if (!dateInput) return false;

    const val = dateInput.value;
    const todayStr = this.getTodayStr();

    if (!val) {
      this.showError('bookDate', 'bookDateError', 'Please choose an appointment date.');
      return false;
    }

    if (val < todayStr) {
      this.showError(
        'bookDate',
        'bookDateError',
        `❌ Invalid date: ${this.formatDateHuman(val)} is in the past! Today is ${this.formatDateHuman(todayStr)}. Please select today or a future date.`
      );
      return false;
    }

    const maxDt = new Date();
    maxDt.setDate(maxDt.getDate() + 60);
    const maxDateStr = maxDt.toISOString().split('T')[0];
    if (val > maxDateStr) {
      this.showError(
        'bookDate',
        'bookDateError',
        `❌ Date is too far in advance. AuraHealth accepts bookings up to 60 days ahead (until ${this.formatDateHuman(maxDateStr)}).`
      );
      return false;
    }

    this.clearError('bookDate', 'bookDateError');
    this.data.date = val;

    // Refresh slots with new date
    const doc = HOSPITAL_DATA.doctors.find(d => d.id === this.data.doctorId);
    this.renderAvailableTimeSlots(doc, val);
    return true;
  },

  validateDobLive() {
    const dobInput = document.getElementById('patientDob');
    const ageDisplay = document.getElementById('patientAgeDisplay');
    if (!dobInput) return true;

    const dobVal = dobInput.value;
    const todayStr = this.getTodayStr();

    if (!dobVal) {
      this.showError('patientDob', 'patientDobError', 'Date of birth is required for clinical records.');
      if (ageDisplay) ageDisplay.innerHTML = '';
      return false;
    }

    // CHECK 1: Date of birth cannot be in the future!
    if (dobVal > todayStr) {
      this.showError(
        'patientDob',
        'patientDobError',
        `❌ Date of birth cannot be in the future (${dobVal})! Today is ${this.formatDateHuman(todayStr)}. Please enter your actual date of birth.`
      );
      if (ageDisplay) ageDisplay.innerHTML = '';
      return false;
    }

    // CHECK 2: Human lifespan sanity check (must be born between 1900 and today)
    const birthYear = parseInt(dobVal.split('-')[0], 10);
    if (birthYear < 1900) {
      this.showError(
        'patientDob',
        'patientDobError',
        '❌ Please enter a realistic date of birth (year must be 1900 or later).'
      );
      if (ageDisplay) ageDisplay.innerHTML = '';
      return false;
    }

    // Calculate exact age
    const [bY, bM, bD] = dobVal.split('-').map(Number);
    const now = new Date();
    let age = now.getFullYear() - bY;
    const monthDiff = (now.getMonth() + 1) - bM;
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < bD)) {
      age--;
    }

    this.clearError('patientDob', 'patientDobError');
    if (ageDisplay) {
      ageDisplay.innerHTML = `<span class="dob-age-badge">🎂 Patient Age: ${age} ${age === 1 ? 'year' : 'years'} old</span>`;
    }
    return true;
  },

  showError(inputElementId, errorContainerId, message) {
    const input = document.getElementById(inputElementId);
    const errorBox = document.getElementById(errorContainerId);

    if (input) {
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
    }
    if (errorBox) {
      errorBox.innerHTML = `<span>⚠️</span> <span>${message}</span>`;
      errorBox.classList.add('active');
    }
  },

  clearError(inputElementId, errorContainerId) {
    const input = document.getElementById(inputElementId);
    const errorBox = document.getElementById(errorContainerId);

    if (input) {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
    }
    if (errorBox) {
      errorBox.innerHTML = '';
      errorBox.classList.remove('active');
    }
  },

  nextStep() {
    // ==========================================
    // STEP 1 VALIDATION: Specialty & Doctor
    // ==========================================
    if (this.currentStep === 1) {
      let step1Valid = true;
      if (!this.data.departmentId) {
        this.showError('bookDeptSelect', 'bookDeptError', 'Please select a medical department/specialty.');
        step1Valid = false;
      } else {
        this.clearError('bookDeptSelect', 'bookDeptError');
      }

      if (!this.data.doctorId) {
        this.showError('bookDoctorSelect', 'bookDoctorError', 'Please select an attending specialist physician.');
        step1Valid = false;
      } else {
        this.clearError('bookDoctorSelect', 'bookDoctorError');
      }

      if (!step1Valid) {
        App.showToast('Please select both a medical specialty and an attending doctor.', 'warning');
        return;
      }
    }

    // ==========================================
    // STEP 2 VALIDATION: Date & Time Slot
    // ==========================================
    else if (this.currentStep === 2) {
      const isDateValid = this.validateDateLive();
      if (!isDateValid) {
        App.showToast('Please fix the appointment date before proceeding.', 'error');
        return;
      }

      if (!this.data.timeSlot) {
        this.showError('availableSlotsContainer', 'slotError', 'Please select an open time slot.');
        App.showToast('Please select an available consultation time slot.', 'warning');
        return;
      }

      // Verify selected slot has not already passed
      if (this.isSlotInThePast(this.data.timeSlot, this.data.date)) {
        this.showError(
          'availableSlotsContainer',
          'slotError',
          `❌ The ${this.data.timeSlot} time slot has already passed for today. Please pick a future slot.`
        );
        App.showToast(`Selected slot ${this.data.timeSlot} has already passed!`, 'error');
        return;
      }
      this.clearError('availableSlotsContainer', 'slotError');
    }

    // ==========================================
    // STEP 3 VALIDATION: Patient Details & DOB
    // ==========================================
    else if (this.currentStep === 3) {
      let step3Valid = true;

      // 1. Patient Full Name
      const nameInput = document.getElementById('patientName');
      const name = nameInput?.value.trim() || '';
      const nameRegex = /^[a-zA-Z\s\.\-']{2,60}$/;
      if (!name || !nameRegex.test(name)) {
        this.showError('patientName', 'patientNameError', 'Please enter a valid patient full name (letters only, min 2 characters).');
        step3Valid = false;
      } else {
        this.clearError('patientName', 'patientNameError');
        this.data.patientName = name;
      }

      // 2. Phone Number
      const phoneInput = document.getElementById('patientPhone');
      const phone = phoneInput?.value.trim() || '';
      const digitsOnly = phone.replace(/\D/g, '');
      if (!phone || digitsOnly.length < 8 || digitsOnly.length > 15) {
        this.showError('patientPhone', 'patientPhoneError', 'Please enter a valid contact phone number (8-15 digits).');
        step3Valid = false;
      } else {
        this.clearError('patientPhone', 'patientPhoneError');
        this.data.patientPhone = phone;
      }

      // 3. Email Address
      const emailInput = document.getElementById('patientEmail');
      const email = emailInput?.value.trim() || '';
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        this.showError('patientEmail', 'patientEmailError', 'Please enter a valid email address (e.g., patient@example.com).');
        step3Valid = false;
      } else {
        this.clearError('patientEmail', 'patientEmailError');
        this.data.patientEmail = email;
      }

      // 4. Date of Birth
      const isDobValid = this.validateDobLive();
      if (!isDobValid) {
        step3Valid = false;
      } else {
        this.data.patientDob = document.getElementById('patientDob')?.value || '';
      }

      if (!step3Valid) {
        App.showToast('Please correct the highlighted errors in patient details.', 'error');
        return;
      }

      // Collect optional data
      this.data.patientGender = document.getElementById('patientGender')?.value || 'Not specified';
      this.data.insurance = document.getElementById('patientInsurance')?.value || 'Self-pay';
      this.data.symptoms = document.getElementById('patientSymptoms')?.value || '';

      this.generateConfirmation();
    }

    if (this.currentStep < 4) {
      this.currentStep++;
      this.updateStepUI();
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepUI();
    }
  },

  updateStepUI() {
    // Update step nodes
    document.querySelectorAll('.step-node').forEach((node, idx) => {
      const stepNum = idx + 1;
      node.classList.remove('active', 'completed');
      if (stepNum === this.currentStep) {
        node.classList.add('active');
      } else if (stepNum < this.currentStep) {
        node.classList.add('completed');
      }
    });

    // Toggle step panes
    document.querySelectorAll('.booking-step-pane').forEach((pane, idx) => {
      pane.style.display = (idx + 1 === this.currentStep) ? 'block' : 'none';
    });

    // Control navigation buttons
    const prevBtn = document.getElementById('bookPrevBtn');
    const nextBtn = document.getElementById('bookNextBtn');
    const finishBtn = document.getElementById('bookFinishBtn');

    if (prevBtn) prevBtn.style.display = (this.currentStep > 1 && this.currentStep < 4) ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = (this.currentStep < 4) ? 'inline-flex' : 'none';
    if (finishBtn) finishBtn.style.display = (this.currentStep === 4) ? 'inline-flex' : 'none';
  },

  generateConfirmation() {
    const doc = HOSPITAL_DATA.doctors.find(d => d.id === this.data.doctorId) || {};
    const dept = HOSPITAL_DATA.departments.find(d => d.id === this.data.departmentId) || {};
    const refCode = 'AH-' + Math.floor(100000 + Math.random() * 900000);

    const confirmationContainer = document.getElementById('bookingConfirmationContainer');
    if (!confirmationContainer) return;

    confirmationContainer.innerHTML = `
      <div class="medical-pass-card" id="printableAppointmentSlip">
        <div class="pass-header">
          <div>
            <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--primary);">Official Hospital Appointment Pass</span>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">AuraHealth International Hospital</h3>
          </div>
          <div style="text-align: right;">
            <span class="badge badge-success">✓ Confirmed</span>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-top: 0.2rem;">Ref: ${refCode}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.2rem; font-size: 0.88rem; margin: 1.2rem 0;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">PATIENT NAME</div>
            <div style="font-weight: 800; color: var(--text-primary); font-size: 1.05rem;">${this.data.patientName}</div>
            <div style="color: var(--text-muted); font-size: 0.78rem; margin-top: 0.2rem;">${this.data.patientPhone} • DOB: ${this.data.patientDob}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">ATTENDING PHYSICIAN</div>
            <div style="font-weight: 700; color: var(--text-primary);">${doc.name || 'Specialist'}</div>
            <div style="color: var(--primary); font-size: 0.78rem;">${dept.name || ''}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">CONFIRMED DATE & TIME</div>
            <div style="font-weight: 700; color: var(--text-primary);">${this.formatDateHuman(this.data.date)} at ${this.data.timeSlot}</div>
            <div style="color: var(--primary-dark); font-size: 0.78rem; font-weight: 600;">
              ${this.data.type === 'telehealth' ? '💻 Virtual Telehealth Video Consultation' : '🏥 In-Person Hospital Clinic Consultation'}
            </div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">BILLING & INSURANCE</div>
            <div style="font-weight: 800; color: var(--text-primary); font-size: 1.1rem;">$${doc.fee || 150}</div>
            <div style="color: var(--success); font-size: 0.78rem; font-weight: 600;">Carrier: ${this.data.insurance}</div>
          </div>
        </div>

        <div style="background: white; border: 1px solid #bae6fd; border-radius: var(--radius-md); padding: 1rem; margin-top: 1rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">CLINICAL LOCATION</div>
            <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary);">Wing B, Level 3, Specialist Suite 304</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">742 Medical Center Blvd, Metro Health District</div>
          </div>
          <div class="pass-barcode">${refCode}</div>
        </div>

        <div style="margin-top: 1.25rem; font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
          * Please present this pass or appointment reference ID at the Reception desk upon arrival. Photo ID and insurance card required.
        </div>
      </div>

      <!-- Official Multi-Channel Confirmation Dispatch Banner -->
      <div class="email-sent-banner" style="background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: var(--radius-md); padding: 1.25rem; margin: 1.25rem 0;">
        <div style="display: flex; align-items: flex-start; gap: 0.85rem; margin-bottom: 0.85rem;">
          <div class="email-icon-pulse" style="background: #e0f2fe; color: #0284c7;">✉️</div>
          <div style="flex: 1;">
            <div style="font-weight: 800; color: #0369a1; font-size: 1.05rem;">
              Appointment Confirmed for <span style="text-decoration: underline;">${this.data.patientEmail}</span>
            </div>
            <div style="font-size: 0.82rem; color: #0284c7; margin-top: 0.25rem; line-height: 1.45;">
              Official Pass Reference: <strong>${refCode}</strong>
              <br>Because this site runs locally on your computer, you can deliver this official pass straight to your personal Gmail inbox right now using any option below:
            </div>
            ${this.data.patientPhone ? `
              <div style="margin-top: 0.4rem; font-size: 0.8rem; color: #0369a1;">
                📱 <strong>Mobile Contact:</strong> Registered as <strong>${this.data.patientPhone}</strong>
              </div>
            ` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: flex-start; border-top: 1px dashed #bae6fd; padding-top: 0.85rem;">
          <button type="button" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem; background: #ea4335; border-color: #ea4335;" onclick="BookingWizard.openInGmail()">
            🚀 Open & Save in My Gmail (1-Click)
          </button>
          <button type="button" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 0.95rem;" onclick="BookingWizard.openEmailPreview()">
            📬 View Received Email
          </button>
          <button type="button" class="btn btn-outline" style="font-size: 0.85rem; padding: 0.5rem 0.95rem;" onclick="BookingWizard.downloadEmlFile()">
            📥 Download .EML (Open in Outlook)
          </button>
        </div>
      </div>

      <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
        <button type="button" class="btn btn-secondary" onclick="BookingWizard.openEmailPreview()">
          📬 View Received Email
        </button>
        <button type="button" class="btn btn-outline" onclick="BookingWizard.downloadEmlFile()">
          📥 Open in Mail App (.eml)
        </button>
        <button type="button" class="btn btn-outline" onclick="window.print()">
          🖨️ Print Slip
        </button>
        <button type="button" class="btn btn-secondary" onclick="BookingWizard.addToCalendar('${refCode}')">
          📅 Add to Calendar (.ics)
        </button>
        <button type="button" class="btn btn-primary" onclick="BookingWizard.goToPatientPortal()">
          👤 View in Patient Portal
        </button>
      </div>
    `;

    const apptRecord = {
      id: refCode,
      patientName: this.data.patientName,
      patientEmail: this.data.patientEmail,
      patientPhone: this.data.patientPhone,
      patientDob: this.data.patientDob,
      insurance: this.data.insurance,
      doctorName: doc.name || 'Specialist Physician',
      doctorTitle: doc.title || '',
      department: dept.shortName || 'General',
      date: this.data.date,
      time: this.data.timeSlot,
      type: this.data.type === 'telehealth' ? 'Telehealth Consultation' : 'In-Person Clinic Visit',
      room: 'Wing B, Level 3, Suite 304',
      status: 'Confirmed',
      fee: doc.fee || 150,
      paid: false,
      notes: this.data.symptoms || 'Initial clinical consultation.'
    };

    this.lastConfirmedAppointment = apptRecord;

    // Persist new appointment to localStorage and Patient Portal
    this.saveAppointment(apptRecord);

    // Dispatch confirmation email
    this.dispatchConfirmationEmail(apptRecord);
  },

  dispatchConfirmationEmail(appt) {
    if (window.EmailGateway) {
      EmailGateway.sendBookingConfirmation(appt);
    }
    App.showToast(`✉️ Real confirmation email & SMS dispatched to ${appt.patientEmail}! Check your inbox.`, 'success');
  },

  buildEmailHtml(appt) {
    return `
      <div class="hospital-email-template" style="font-family: Arial, sans-serif; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 600px; margin: 0 auto;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0284c7 0%, #075985 100%); color: white; padding: 24px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">🏥 AuraHealth International Hospital</div>
          <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">Advancing Medicine • Healing with Compassion</div>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">
            Appointment Confirmation Pass
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
            Dear <strong>${appt.patientName}</strong>,<br>
            Your specialist clinical consultation at AuraHealth International Hospital has been officially scheduled and confirmed. Below is your official appointment summary and admission pass.
          </p>

          <!-- Key Details Card -->
          <div style="background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #bae6fd; padding-bottom: 10px; margin-bottom: 12px;">
              <div>
                <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #0284c7;">CONFIRMATION REFERENCE</span>
                <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${appt.id}</div>
              </div>
              <span style="background: #dcfce7; color: #15803d; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 9999px;">✓ Confirmed</span>
            </div>

            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 35%;"><strong>Physician:</strong></td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${appt.doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Specialty:</strong></td>
                <td style="padding: 6px 0; color: #0284c7; font-weight: 600;">${appt.department}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Date & Time:</strong></td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${this.formatDateHuman(appt.date)} at ${appt.time}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Consultation Mode:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;">${appt.type}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Location:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;">${appt.room || 'Wing B, Level 3, Suite 304'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Consultation Fee:</strong></td>
                <td style="padding: 6px 0; font-weight: bold; color: #15803d;">$${appt.fee} (Billed via ${this.data.insurance || 'Self-pay'})</td>
              </tr>
            </table>
          </div>

          <!-- Important Instructions -->
          <div style="font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
            <strong style="color: #0f172a;">Important Instructions for Your Visit:</strong>
            <ul style="margin: 8px 0 0 20px; padding: 0;">
              <li>Please arrive 15 minutes before your scheduled appointment time.</li>
              <li>Bring a valid government-issued photo ID and your health insurance card.</li>
              <li>Bring any recent diagnostic reports, X-rays, or relevant medication lists.</li>
              <li>If you need to reschedule or cancel, you can do so directly in the AuraHealth Patient Portal at least 4 hours in advance.</li>
            </ul>
          </div>

          <!-- Campus Address -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px; color: #64748b; margin-bottom: 20px;">
            <strong>AuraHealth Campus Address:</strong><br>
            742 Medical Center Boulevard, Metro Health District, NY 10024<br>
            Valet parking available at Gate 2 • 24/7 Care Hotline: <strong>+1 (800) 555-CARE</strong>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          This is an automated appointment confirmation message generated by AuraHealth Hospital Information System (HIS).<br>
          © 2026 AuraHealth International Hospital & Research Center. JCI Accredited • HIPAA Compliant.
        </div>
      </div>
    `;
  },

  openEmailPreview() {
    const modal = document.getElementById('emailPreviewModal');
    if (!modal) return;

    const appt = this.lastConfirmedAppointment;
    if (!appt) {
      App.showToast('Please schedule an appointment first to view its confirmation email.', 'warning');
      return;
    }

    const toEl = document.getElementById('emailModalTo');
    const dateEl = document.getElementById('emailModalDate');
    const subjEl = document.getElementById('emailModalSubject');
    const bodyEl = document.getElementById('emailModalBody');

    if (toEl) toEl.textContent = appt.patientEmail;
    if (dateEl) dateEl.textContent = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    if (subjEl) subjEl.textContent = `Confirmed: AuraHealth Specialist Consultation [Ref: ${appt.id}]`;
    if (bodyEl) bodyEl.innerHTML = this.buildEmailHtml(appt);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeEmailPreview() {
    const modal = document.getElementById('emailPreviewModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  downloadEmlFile() {
    const appt = this.lastConfirmedAppointment;
    if (!appt) {
      App.showToast('Please complete an appointment booking first.', 'warning');
      return;
    }

    const htmlBody = this.buildEmailHtml(appt);
    const dateNow = new Date().toUTCString();

    const emlContent = [
      `From: "AuraHealth International Hospital" <appointments@aurahealth.org>`,
      `To: <${appt.patientEmail}>`,
      `Date: ${dateNow}`,
      `Subject: Confirmed: AuraHealth Specialist Consultation with ${appt.doctorName} [Ref: ${appt.id}]`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `X-Priority: 1 (Highest)`,
      `X-Mailer: AuraHealth Clinical Email Dispatcher v2.0`,
      ``,
      htmlBody
    ].join('\r\n');

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AuraHealth-Appointment-Confirmation-${appt.id}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    App.showToast(`📥 Downloaded .EML file! Double-click to open in Microsoft Outlook or Windows Mail.`, 'success');
  },

  openMailtoClient() {
    const appt = this.lastConfirmedAppointment;
    if (!appt) return;

    const subject = encodeURIComponent(`Confirmed: AuraHealth Appointment [Ref: ${appt.id}]`);
    const body = encodeURIComponent(
      `Hello ${appt.patientName},\n\n` +
      `Your appointment at AuraHealth International Hospital has been confirmed:\n\n` +
      `• Reference: ${appt.id}\n` +
      `• Physician: ${appt.doctorName} (${appt.department})\n` +
      `• Date & Time: ${this.formatDateHuman(appt.date)} at ${appt.time}\n` +
      `• Mode: ${appt.type}\n` +
      `• Location: ${appt.room}\n` +
      `• Fee: $${appt.fee}\n\n` +
      `Address: 742 Medical Center Blvd, NY 10024\n` +
      `Hospital Hotline: +1 (800) 555-CARE`
    );

    window.location.href = `mailto:${appt.patientEmail}?subject=${subject}&body=${body}`;
    App.showToast('Opened your local mail client with appointment details.', 'success');
  },

  openInGmail() {
    const appt = this.lastConfirmedAppointment;
    if (!appt) return;

    const to = encodeURIComponent(appt.patientEmail || '');
    const subject = encodeURIComponent(`🩺 Confirmed: AuraHealth Appointment with ${appt.doctorName} [Ref: ${appt.id}]`);
    const body = encodeURIComponent(
      `🏥 AURAHEALTH INTERNATIONAL HOSPITAL & RESEARCH CENTER\n` +
      `OFFICIAL APPOINTMENT CONFIRMATION PASS\n` +
      `====================================================\n\n` +
      `Dear ${appt.patientName},\n\n` +
      `Your specialist clinical consultation at AuraHealth International Hospital has been officially scheduled and confirmed. Below is your official appointment summary:\n\n` +
      `• Confirmation Reference ID: ${appt.id}\n` +
      `• Patient Name: ${appt.patientName}\n` +
      `• Attending Physician: ${appt.doctorName}\n` +
      `• Department / Specialty: ${appt.department}\n` +
      `• Date & Time: ${this.formatDateHuman(appt.date)} at ${appt.time}\n` +
      `• Consultation Mode: ${appt.type}\n` +
      `• Clinical Location: ${appt.room}\n` +
      `• Consultation Fee: $${appt.fee} (Carrier: ${appt.insurance || 'Self-pay'})\n\n` +
      `IMPORTANT INSTRUCTIONS FOR YOUR VISIT:\n` +
      `1. Please arrive 15 minutes before your scheduled appointment.\n` +
      `2. Present this confirmation pass or Reference ID [${appt.id}] at Reception Gate 2.\n` +
      `3. Bring a valid government-issued photo ID and health insurance card.\n` +
      `4. Bring any recent diagnostic reports or medication lists.\n\n` +
      `Campus Address:\n` +
      `742 Medical Center Boulevard, Metro Health District, NY 10024\n` +
      `Valet parking available at Gate 2 • 24/7 Care Hotline: +1 (800) 555-CARE\n` +
      `====================================================`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
    App.showToast('🚀 Opened Gmail with your appointment pass ready to send!', 'success');
  },

  resendConfirmationEmail() {
    const appt = this.lastConfirmedAppointment;
    if (!appt) return;

    App.showToast(`🔄 Resending confirmation email to ${appt.patientEmail}...`, 'primary');
    setTimeout(() => {
      this.dispatchConfirmationEmail(appt);
      App.showToast(`✅ Successfully resent confirmation email to ${appt.patientEmail}!`, 'success');
    }, 600);
  },

  saveAppointment(appt) {
    let appts = [];
    try {
      const stored = localStorage.getItem('aurahealth_patient_appts');
      appts = stored ? JSON.parse(stored) : [...HOSPITAL_DATA.patientPortal.appointments];
    } catch (e) {
      appts = [...HOSPITAL_DATA.patientPortal.appointments];
    }

    appts.unshift(appt);
    try {
      localStorage.setItem('aurahealth_patient_appts', JSON.stringify(appts));
    } catch (e) {
      console.warn('Storage error', e);
    }

    // Refresh portal appointments if active
    if (window.PatientPortal) {
      window.PatientPortal.renderAppointments();
    }
  },

  addToCalendar(refCode) {
    App.showToast(`Appointment ${refCode} added to your digital calendar.`, 'success');
  },

  goToPatientPortal() {
    this.close();
    const portalSec = document.getElementById('patient-portal');
    if (portalSec) {
      portalSec.scrollIntoView({ behavior: 'smooth' });
    }
  },

  bindEvents() {
    const deptSelect = document.getElementById('bookDeptSelect');
    if (deptSelect) {
      deptSelect.addEventListener('change', (e) => this.handleDepartmentChange(e.target.value));
    }

    const docSelect = document.getElementById('bookDoctorSelect');
    if (docSelect) {
      docSelect.addEventListener('change', (e) => this.handleDoctorChange(e.target.value));
    }

    // Live validation on date input
    const dateInput = document.getElementById('bookDate');
    if (dateInput) {
      dateInput.addEventListener('change', () => this.validateDateLive());
      dateInput.addEventListener('input', () => this.validateDateLive());
    }

    // Live validation on DOB input
    const dobInput = document.getElementById('patientDob');
    if (dobInput) {
      dobInput.addEventListener('change', () => this.validateDobLive());
      dobInput.addEventListener('input', () => this.validateDobLive());
    }

    // Live clearing on patient fields
    const nameInput = document.getElementById('patientName');
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        if (nameInput.value.trim().length >= 2) {
          this.clearError('patientName', 'patientNameError');
        }
      });
    }

    const phoneInput = document.getElementById('patientPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        const digits = phoneInput.value.replace(/\D/g, '');
        if (digits.length >= 8) {
          this.clearError('patientPhone', 'patientPhoneError');
        }
      });
    }

    const emailInput = document.getElementById('patientEmail');
    if (emailInput) {
      emailInput.addEventListener('input', () => {
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailInput.value.trim())) {
          this.clearError('patientEmail', 'patientEmailError');
        }
      });
    }

    // Consultation type toggle (in-person vs telehealth)
    document.querySelectorAll('.consult-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.consult-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.data.type = btn.dataset.type || 'in-person';
      });
    });
  }
};

window.BookingWizard = BookingWizard;
