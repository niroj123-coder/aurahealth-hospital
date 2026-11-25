/**
 * AuraHealth International Hospital
 * Hospital Operations & Live Bed Tracker
 */

const HospitalAdmin = {
  init() {
    this.renderBedOccupancy();
    this.renderBloodBank();
  },

  renderBedOccupancy() {
    const container = document.getElementById('liveBedGrid');
    if (!container) return;

    const data = HOSPITAL_DATA.bedOccupancy;
    const units = [
      { name: "Intensive Care Unit (ICU)", stats: data.icu, icon: "🩺", color: "#ef4444" },
      { name: "Trauma Resuscitation Bays", stats: data.trauma, icon: "🚨", color: "#dc2626" },
      { name: "Maternity & LDRP Suites", stats: data.maternity, icon: "👶", color: "#ec4899" },
      { name: "Pediatric Inpatient Unit", stats: data.pediatric, icon: "🧸", color: "#f59e0b" },
      { name: "General Inpatient Wards", stats: data.generalWard, icon: "🛏️", color: "#0284c7" }
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
        <div style="font-size: 1.25rem; font-weight: 800; color: ${b.level === 'red' ? '#ef4444' : '#38bdf8'};">
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
  }
};

window.HospitalAdmin = HospitalAdmin;
