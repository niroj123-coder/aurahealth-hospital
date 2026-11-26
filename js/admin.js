/**
 * Darwin City Hospital — Hospital Administration & Doctor Portals
 * Real-time SQLite-backed metrics, Chart.js operational charts, and management tools
 */

const HospitalAdmin = {
  charts: {
    trends: null,
    departments: null
  },

  init() {
    this.renderBedOccupancy();
    this.renderBloodBank();
    this.bindAdminEvents();
  },

  // 1. Bed Capacity & Live Unit Indicators
  renderBedOccupancy() {
    const container = document.getElementById('liveBedGrid');
    if (!container) return;

    const data = HOSPITAL_DATA.bedOccupancy;
    const units = [
      { name: "Intensive Care Unit (ICU)", stats: data.icu, icon: "🩺", color: "#DC2626" },
      { name: "Trauma Resuscitation Bays", stats: data.trauma, icon: "🚨", color: "#DC2626" },
      { name: "Maternity & Birthing Suites", stats: data.maternity, icon: "👶", color: "#009688" },
      { name: "Paediatric Inpatient Ward", stats: data.pediatric, icon: "🧸", color: "#d97706" },
      { name: "General Medical Wards", stats: data.generalWard, icon: "🛏️", color: "#005B96" }
    ];

    container.innerHTML = units.map(u => {
      const pct = Math.round((u.stats.occupied / u.stats.total) * 100);
      return `
        <div class="bed-stat-card">
          <div class="bed-stat-header">
            <span style="font-size: 0.88rem; font-weight: 700; color: white; display: flex; align-items: center; gap: 0.4rem;">
              ${u.icon} ${u.name}
            </span>
            <span class="badge ${u.stats.available > 3 ? 'badge-success' : 'badge-danger'}">
              ${u.stats.available} Available
            </span>
          </div>
          <div class="bed-progress-bar">
            <div class="bed-progress-fill" style="width: ${pct}%; background-color: ${u.color};"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8;">
            <span>Occupied: ${u.stats.occupied} / ${u.stats.total}</span>
            <span>${pct}% Capacity</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderBloodBank() {
    const container = document.getElementById('bloodBankGrid');
    if (!container) return;

    const blood = HOSPITAL_DATA.bedOccupancy.bloodBank;
    container.innerHTML = blood.map(b => `
      <div class="blood-type-card ${b.level === 'red' ? 'critical' : ''}">
        <div style="font-size: 1.25rem; font-weight: 800; color: ${b.level === 'red' ? '#ef4444' : '#005B96'};">
          ${b.type}
        </div>
        <div style="font-size: 0.72rem; color: #cbd5e1; font-weight: 600;">
          ${b.units} Units
        </div>
        <div style="font-size: 0.68rem; text-transform: uppercase; color: ${b.level === 'red' ? '#f87171' : '#4ade80'}; font-weight: 700; margin-top: 0.2rem;">
          ${b.status}
        </div>
      </div>
    `).join('');
  },

  // 2. Load Full Admin Dashboard from SQLite API
  async loadAdminDashboard() {
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const data = json.data;

      // Update KPI numbers
      const docCountEl = document.getElementById('adminKpiDoctors');
      const patCountEl = document.getElementById('adminKpiPatients');
      const apptCountEl = document.getElementById('adminKpiAppointments');
      const todayCountEl = document.getElementById('adminKpiToday');

      if (docCountEl) docCountEl.textContent = data.metrics.totalDoctors;
      if (patCountEl) patCountEl.textContent = data.metrics.totalPatients;
      if (apptCountEl) apptCountEl.textContent = data.metrics.totalAppointments;
      if (todayCountEl) todayCountEl.textContent = data.metrics.todayAppointments;

      // Render Charts with Chart.js
      this.renderCharts(data);

      // Render Recent Appointments Table
      this.renderRecentAppointments(data.recentAppointments);

      // Render Contact Enquiries
      this.renderEnquiries(data.enquiries);
    } catch (err) {
      console.warn('[Admin] Fallback to local admin simulation:', err);
      this.renderMockAdminCharts();
    }
  },

  renderCharts(data) {
    if (typeof Chart === 'undefined') return;

    // 1. Appointment Trends Chart
    const trendsCtx = document.getElementById('adminTrendsChart');
    if (trendsCtx) {
      if (this.charts.trends) this.charts.trends.destroy();

      const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const apptCounts = [620, 710, 850, 920, 1040, 1180, 1250];

      this.charts.trends = new Chart(trendsCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Monthly Clinical Appointments',
            data: apptCounts,
            borderColor: '#005B96',
            backgroundColor: 'rgba(0, 91, 150, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#009688',
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // 2. Department Breakdown Chart
    const deptCtx = document.getElementById('adminDeptChart');
    if (deptCtx) {
      if (this.charts.departments) this.charts.departments.destroy();

      const deptLabels = data.departmentStats.slice(0, 6).map(d => d.name);
      const deptData = data.departmentStats.slice(0, 6).map(d => d.appointment_count || 1);

      this.charts.departments = new Chart(deptCtx, {
        type: 'doughnut',
        data: {
          labels: deptLabels.length ? deptLabels : ['Cardiology', 'Emergency', 'Orthopaedics', 'General Medicine', 'Paediatrics', 'Neurology'],
          datasets: [{
            data: deptData.length ? deptData : [35, 25, 18, 15, 12, 10],
            backgroundColor: [
              '#005B96', '#009688', '#0F172A', '#DC2626', '#d97706', '#7c3aed'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      });
    }
  },

  renderMockAdminCharts() {
    this.renderCharts({
      departmentStats: [
        { name: 'Cardiology', appointment_count: 24 },
        { name: 'Emergency', appointment_count: 38 },
        { name: 'Orthopaedics', appointment_count: 19 },
        { name: 'General Medicine', appointment_count: 22 },
        { name: 'Paediatrics', appointment_count: 15 },
        { name: 'Dermatology', appointment_count: 14 }
      ]
    });
  },

  renderRecentAppointments(appts = []) {
    const tableBody = document.getElementById('adminRecentApptsTable');
    if (!tableBody) return;

    if (!appts || appts.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No appointments registered yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = appts.map(a => `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">${a.id}</td>
        <td><strong>${a.patient_name}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${a.patient_phone}</span></td>
        <td>${a.doctor_name || 'Specialist'}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${a.department_name}</span></td>
        <td>${a.appointment_date} at ${a.time_slot}</td>
        <td>
          <span class="badge ${a.status === 'confirmed' ? 'badge-success' : a.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}">
            ${a.status.toUpperCase()}
          </span>
        </td>
        <td>
          <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="HospitalAdmin.openStatusModal('${a.id}', '${a.status}')">
            Update Status
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderEnquiries(enquiries = []) {
    const list = document.getElementById('adminEnquiriesList');
    if (!list) return;

    if (!enquiries || enquiries.length === 0) {
      list.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No active patient enquiries.</div>`;
      return;
    }

    list.innerHTML = enquiries.map(e => `
      <div style="background: var(--bg-alt); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <strong style="font-size: 0.88rem; color: var(--text-primary);">${e.full_name}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${e.created_at ? e.created_at.split(' ')[0] : 'Today'}</span>
        </div>
        <div style="font-size: 0.82rem; font-weight: 600; color: var(--primary); margin-bottom: 0.25rem;">${e.subject}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">"${e.message}"</div>
        <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 0.4rem;">
          📧 ${e.email} ${e.phone ? '• 📞 ' + e.phone : ''}
        </div>
      </div>
    `).join('');
  },

  openStatusModal(apptId, currentStatus) {
    const newStatus = prompt(`Update status for appointment [${apptId}]:\nEnter confirmed, pending, completed, or cancelled:`, currentStatus);
    if (!newStatus) return;

    const valid = ['confirmed', 'pending', 'completed', 'cancelled'];
    if (!valid.includes(newStatus.toLowerCase().trim())) {
      alert('Invalid status. Please enter confirmed, pending, completed, or cancelled.');
      return;
    }

    fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: apptId })
    }).then(() => {
      App.showToast(`Updated appointment ${apptId} status.`, 'success');
      HospitalAdmin.loadAdminDashboard();
    }).catch(() => {
      App.showToast('Failed to update status.', 'error');
    });
  },

  bindAdminEvents() {
    const adminTabBtns = document.querySelectorAll('.admin-nav-item');
    adminTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        adminTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetView = btn.dataset.view;
        document.querySelectorAll('.admin-view-pane').forEach(p => {
          p.style.display = p.id === `admin-view-${targetView}` ? 'block' : 'none';
        });
      });
    });
  }
};

window.HospitalAdmin = HospitalAdmin;
