/**
 * AuraHealth International Hospital
 * Main Application Controller & UI Logic
 */

const App = {
  currentDoctorFilter: 'all',
  currentSearchQuery: '',

  init() {
    this.renderDoctors();
    this.renderDepartments();
    this.renderHealthPackages();
    this.renderTestimonials();
    this.renderArticles();
    this.renderFaqs();
    this.bindGlobalEvents();

    // Initialize submodules
    if (window.BookingWizard) window.BookingWizard.init();
    if (window.PatientPortal) window.PatientPortal.init();
    if (window.SymptomTriage) window.SymptomTriage.init();
    if (window.HospitalAdmin) window.HospitalAdmin.init();

    console.log('🏥 AuraHealth Portal initialized successfully.');
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
        mobileDrawer.classList.toggle('active');
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

    // Contact Form with Strict Validation
    const contactForm = document.getElementById('hospitalContactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contactFullName')?.value.trim();
        const phone = document.getElementById('contactPhone')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const msg = document.getElementById('contactMessage')?.value.trim();

        if (!name || name.length < 2) {
          this.showToast('Please enter your full name (minimum 2 characters).', 'warning');
          return;
        }

        const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
        if (!phone || phoneDigits.length < 8) {
          this.showToast('Please enter a valid phone number (min 8 digits).', 'warning');
          return;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          this.showToast('Please enter a valid email address.', 'warning');
          return;
        }

        if (!msg || msg.length < 10) {
          this.showToast('Please provide a message with at least 10 characters describing your inquiry.', 'warning');
          return;
        }

        this.showToast('Your medical inquiry has been received! Our patient concierge will contact you within 2 hours.', 'success');
        contactForm.reset();
      });
    }

    // Newsletter Form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = newsletterForm.querySelector('input[type="email"]');
        const email = input?.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          this.showToast('Please enter a valid email address to subscribe.', 'warning');
          return;
        }
        this.showToast('Thank you for subscribing to AuraHealth Wellness updates!', 'success');
        newsletterForm.reset();
      });
    }
  },

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
        d.departmentName.toLowerCase().includes(this.currentSearchQuery)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: var(--radius-xl); border: 1px solid var(--border);">
          <h4 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem;">No specialists match your search criteria</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Try adjusting the specialty filter or search by physician name.</p>
          <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="App.resetDoctorFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(doc => `
      <div class="doctor-card">
        <div class="doctor-card-img-wrap">
          <img src="${doc.avatar}" alt="${doc.name}" loading="lazy">
          <span class="doctor-dept-badge">${doc.departmentName}</span>
          <span class="doctor-rating-badge">⭐ ${doc.rating} (${doc.reviewsCount})</span>
        </div>

        <div class="doctor-card-body">
          <h3 class="doctor-name">${doc.name}</h3>
          <p class="doctor-title">${doc.title}</p>

          <div class="doctor-meta-list">
            <div class="doctor-meta-item">
              <span>🎓</span>
              <span>${doc.education}</span>
            </div>
            <div class="doctor-meta-item">
              <span>⏱️</span>
              <span>Experience: ${doc.experience}</span>
            </div>
            <div class="doctor-meta-item">
              <span>🗣️</span>
              <span>Speaks: ${doc.languages.join(', ')}</span>
            </div>
            <div class="doctor-meta-item" style="color: var(--success); font-weight: 600;">
              <span>🟢</span>
              <span>Available: ${doc.nextAvailable}</span>
            </div>
          </div>

          <div class="doctor-card-footer">
            <div class="doctor-fee">
              Fee: <strong>$${doc.fee}</strong>
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-outline" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;" onclick="App.openDoctorModal('${doc.id}')">
                Profile
              </button>
              <button class="btn btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;" onclick="BookingWizard.open('${doc.id}')">
                Book Visit
              </button>
            </div>
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

  renderDepartments() {
    const grid = document.getElementById('departmentsGrid');
    if (!grid) return;

    grid.innerHTML = HOSPITAL_DATA.departments.map(dept => `
      <div class="department-card">
        <div class="dept-icon-box">
          ${this.getDeptIcon(dept.id)}
        </div>
        <h3>${dept.name}</h3>
        <p class="dept-desc">${dept.description}</p>

        <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem;">
          Specialized Treatments & Procedures:
        </div>
        <ul class="dept-treatments-list">
          ${dept.treatments.map(t => `<li><span style="color: var(--primary);">✓</span> ${t}</li>`).join('')}
        </ul>

        <div class="dept-stats-bar">
          <span>👥 ${dept.stats.specialists} Top Specialists</span>
          <span>⭐ ${dept.stats.successRate} Success</span>
          <span>📅 ${dept.stats.patientsPerYear} Patients</span>
        </div>

        <div style="margin-top: 1.25rem; display: flex; gap: 0.5rem;">
          <button class="btn btn-outline" style="flex: 1; font-size: 0.82rem;" onclick="App.filterByDepartment('${dept.id}')">
            View Doctors
          </button>
          <button class="btn btn-primary" style="flex: 1; font-size: 0.82rem;" onclick="BookingWizard.open(null, '${dept.id}')">
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
      orthopedics: '🦴',
      oncology: '🎗️',
      pediatrics: '🧸',
      emergency: '🚨',
      maternity: '🤰',
      radiology: '🔬'
    };
    return icons[deptId] || '🏥';
  },

  filterByDepartment(deptId) {
    this.currentDoctorFilter = deptId;
    const select = document.getElementById('doctorDeptFilter');
    if (select) select.value = deptId;
    this.renderDoctors();
    const docSec = document.getElementById('doctors');
    if (docSec) docSec.scrollIntoView({ behavior: 'smooth' });
  },

  renderHealthPackages() {
    const grid = document.getElementById('packagesGrid');
    if (!grid) return;

    grid.innerHTML = HOSPITAL_DATA.healthPackages.map(pkg => `
      <div class="package-card ${pkg.tag ? 'featured' : ''}">
        ${pkg.tag ? `<span class="package-ribbon">${pkg.tag}</span>` : ''}
        <div class="package-header">
          <span class="package-category">${pkg.category}</span>
          <h3 class="package-name">${pkg.name}</h3>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            👤 ${pkg.recommendedFor} • ⏱️ ${pkg.duration}
          </div>
          <div class="package-price-wrap">
            <span class="package-price">$${pkg.price}</span>
            <span class="package-original-price">$${pkg.originalPrice}</span>
            <span class="badge badge-success">Save $${pkg.originalPrice - pkg.price}</span>
          </div>
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary);">
            Includes ${pkg.testsCount}
          </div>
        </div>

        <ul class="package-tests-list">
          ${pkg.testsList.map(t => `<li><span style="color: var(--secondary); font-weight: bold;">•</span> ${t}</li>`).join('')}
        </ul>

        <div style="margin-top: auto; display: flex; gap: 0.75rem;">
          <button class="btn btn-primary" style="width: 100%;" onclick="App.bookHealthPackage('${pkg.id}', '${pkg.name}', ${pkg.price})">
            Book Health Package ($${pkg.price})
          </button>
        </div>
      </div>
    `).join('');
  },

  bookHealthPackage(pkgId, pkgName, price) {
    App.showToast(`Health Package '${pkgName}' added. Redirecting to appointment scheduler...`, 'success');
    BookingWizard.open();
  },

  renderTestimonials() {
    const container = document.getElementById('testimonialsGrid');
    if (!container) return;

    container.innerHTML = HOSPITAL_DATA.testimonials.map(t => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 1rem;">⭐⭐⭐⭐⭐</div>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); font-style: italic; margin-bottom: 1.5rem; flex: 1;">
          "${t.quote}"
        </p>
        <div style="display: flex; align-items: center; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
          <img src="${t.avatar}" alt="${t.patientName}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
          <div>
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${t.patientName}, ${t.age}</h4>
            <p style="font-size: 0.78rem; color: var(--primary); font-weight: 600;">${t.procedure}</p>
            <p style="font-size: 0.74rem; color: var(--text-muted);">Attending: ${t.doctor}</p>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderArticles() {
    const container = document.getElementById('articlesGrid');
    if (!container) return;

    container.innerHTML = HOSPITAL_DATA.articles.map(art => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-xs); display: flex; flex-direction: column;">
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
          <div style="border-top: 1px solid var(--border); padding-top: 0.75rem; font-size: 0.78rem; color: var(--text-muted);">
            By ${art.author} • ${art.date}
          </div>
        </div>
      </div>
    `).join('');
  },

  renderFaqs() {
    const container = document.getElementById('faqsAccordion');
    if (!container) return;

    container.innerHTML = HOSPITAL_DATA.faqs.map((faq, idx) => `
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); margin-bottom: 0.75rem; overflow: hidden;">
        <button type="button" style="width: 100%; padding: 1.25rem 1.5rem; text-align: left; display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: var(--text-primary); font-size: 1rem;" onclick="App.toggleFaq(${idx})">
          <span>${faq.q}</span>
          <span id="faq-icon-${idx}" style="font-size: 1.25rem; color: var(--primary);">+</span>
        </button>
        <div id="faq-body-${idx}" style="display: none; padding: 0 1.5rem 1.25rem; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6;">
          ${faq.a}
        </div>
      </div>
    `).join('');
  },

  toggleFaq(idx) {
    const body = document.getElementById(`faq-body-${idx}`);
    const icon = document.getElementById(`faq-icon-${idx}`);
    if (!body || !icon) return;

    const isVisible = body.style.display === 'block';
    body.style.display = isVisible ? 'none' : 'block';
    icon.textContent = isVisible ? '+' : '−';
  },

  openDoctorModal(doctorId) {
    const doc = HOSPITAL_DATA.doctors.find(d => d.id === doctorId);
    if (!doc) return;

    const modal = document.getElementById('doctorDetailModal');
    const content = document.getElementById('doctorDetailContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem;">
        <img src="${doc.avatar}" alt="${doc.name}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">
        <div>
          <span class="badge badge-primary">${doc.departmentName}</span>
          <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-top: 0.25rem;">${doc.name}</h3>
          <p style="color: var(--primary); font-weight: 600; font-size: 0.9rem;">${doc.title} (${doc.credentials})</p>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">⭐ ${doc.rating} / 5.0 (${doc.reviewsCount} verified patient ratings)</p>
        </div>
      </div>

      <div style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem; background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md);">
        <strong>About Physician:</strong><br>
        ${doc.bio}
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.88rem; margin-bottom: 1.5rem;">
        <div><strong>Education:</strong><br><span style="color: var(--text-muted);">${doc.education}</span></div>
        <div><strong>Clinical Experience:</strong><br><span style="color: var(--text-muted);">${doc.experience}</span></div>
        <div><strong>Languages:</strong><br><span style="color: var(--text-muted);">${doc.languages.join(', ')}</span></div>
        <div><strong>Consultation Fee:</strong><br><span style="color: var(--text-primary); font-weight: 800; font-size: 1.1rem;">$${doc.fee}</span></div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button class="btn btn-outline" onclick="App.closeAllModals()">Close</button>
        <button class="btn btn-primary" onclick="App.closeAllModals(); BookingWizard.open('${doc.id}')">Book Appointment with ${doc.name.split(' ')[1]}</button>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  openSearchModal() {
    const modal = document.getElementById('searchModal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const input = document.getElementById('globalSearchInput');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
      this.handleGlobalSearch('');
    }
  },

  handleGlobalSearch(query) {
    const resultsContainer = document.getElementById('globalSearchResults');
    if (!resultsContainer) return;

    query = query.toLowerCase().trim();

    if (!query) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
          Type to search doctors, clinical specialties, health checkup packages, or symptoms...
        </div>
      `;
      return;
    }

    const matchedDocs = HOSPITAL_DATA.doctors.filter(d => d.name.toLowerCase().includes(query) || d.departmentName.toLowerCase().includes(query));
    const matchedDepts = HOSPITAL_DATA.departments.filter(d => d.name.toLowerCase().includes(query) || d.treatments.some(t => t.toLowerCase().includes(query)));
    const matchedPkgs = HOSPITAL_DATA.healthPackages.filter(p => p.name.toLowerCase().includes(query));

    let html = '';

    if (matchedDocs.length > 0) {
      html += '<div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--primary); margin: 0.75rem 0 0.4rem;">Specialists</div>';
      matchedDocs.forEach(d => {
        html += `
          <div style="padding: 0.6rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="App.closeAllModals(); BookingWizard.open('${d.id}')">
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">${d.name} (${d.credentials})</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${d.title} • ${d.departmentName}</div>
            </div>
            <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;">Book</button>
          </div>
        `;
      });
    }

    if (matchedDepts.length > 0) {
      html += '<div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--secondary); margin: 0.75rem 0 0.4rem;">Departments</div>';
      matchedDepts.forEach(dp => {
        html += `
          <div style="padding: 0.6rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="App.closeAllModals(); App.filterByDepartment('${dp.id}')">
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">${dp.name}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${dp.description.substring(0, 70)}...</div>
            </div>
            <span style="font-size: 0.8rem; color: var(--primary);">View →</span>
          </div>
        `;
      });
    }

    if (matchedPkgs.length > 0) {
      html += '<div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--purple); margin: 0.75rem 0 0.4rem;">Health Packages</div>';
      matchedPkgs.forEach(p => {
        html += `
          <div style="padding: 0.6rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="App.closeAllModals(); App.bookHealthPackage('${p.id}', '${p.name}', ${p.price})">
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">${p.name} ($${p.price})</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${p.testsCount}</div>
            </div>
            <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;">Details</button>
          </div>
        `;
      });
    }

    if (!html) {
      html = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No results found. Try a different term.</div>';
    }

    resultsContainer.innerHTML = html;
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer) drawer.classList.remove('active');
    document.body.style.overflow = '';
  },

  showToast(message, type = 'primary') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      primary: 'ℹ️',
      success: '✅',
      error: '🚨',
      warning: '⚠️'
    };

    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icons[type] || 'ℹ️'}</span>
      <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary); line-height: 1.4;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
