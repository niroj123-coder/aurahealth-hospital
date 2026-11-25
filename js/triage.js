/**
 * AuraHealth International Hospital
 * Interactive Symptom Checker & Clinical Triage Engine
 */

const SymptomTriage = {
  selectedSymptoms: [],

  init() {
    this.renderSymptomChips();
  },

  renderSymptomChips() {
    const container = document.getElementById('symptomChipsContainer');
    if (!container) return;

    container.innerHTML = HOSPITAL_DATA.symptomChecker.map(item => `
      <div class="symptom-chip" data-id="${item.id}" onclick="SymptomTriage.toggleSymptom('${item.id}')">
        <span>🩺</span>
        <span>${item.name}</span>
      </div>
    `).join('');
  },

  toggleSymptom(symptomId) {
    const chip = document.querySelector(`.symptom-chip[data-id="${symptomId}"]`);
    if (!chip) return;

    const idx = this.selectedSymptoms.indexOf(symptomId);
    if (idx > -1) {
      this.selectedSymptoms.splice(idx, 1);
      chip.classList.remove('selected');
    } else {
      this.selectedSymptoms.push(symptomId);
      chip.classList.add('selected');
    }

    this.evaluateSymptoms();
  },

  evaluateSymptoms() {
    const resultBox = document.getElementById('triageResultContainer');
    if (!resultBox) return;

    if (this.selectedSymptoms.length === 0) {
      resultBox.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.95rem;">
          👆 Select one or more symptoms above to view clinical guidance and immediate medical recommendations.
        </div>
      `;
      return;
    }

    // Check if any critical symptoms are present
    let hasCritical = false;
    let criticalItem = null;
    let matchedDepartments = [];

    this.selectedSymptoms.forEach(sId => {
      const item = HOSPITAL_DATA.symptomChecker.find(s => s.id === sId);
      if (item) {
        if (item.isCritical) {
          hasCritical = true;
          criticalItem = item;
        }
        if (item.recommendation.moderate && item.recommendation.moderate.department) {
          matchedDepartments.push(item.recommendation.moderate.department);
        }
      }
    });

    if (hasCritical && criticalItem) {
      const rec = criticalItem.recommendation.critical;
      resultBox.innerHTML = `
        <div class="triage-result-card triage-critical">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <h4 style="font-size: 1.35rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
              ${rec.title}
            </h4>
            <span class="badge badge-danger">${rec.badge}</span>
          </div>
          <p style="font-size: 0.98rem; line-height: 1.6; margin-bottom: 1.25rem;">
            ${rec.advice}
          </p>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-emergency" onclick="AmbulanceSOS.open()">
              🚑 Dispatch Emergency Ambulance Now
            </button>
            <a href="tel:${HOSPITAL_DATA.info.emergencyPhone}" class="btn btn-outline" style="border-color: #f87171; color: #b91c1c;">
              📞 Call Emergency (${HOSPITAL_DATA.info.emergencyPhone})
            </a>
          </div>
        </div>
      `;
    } else {
      const firstDept = matchedDepartments[0] || 'cardiology';
      const deptObj = HOSPITAL_DATA.departments.find(d => d.id === firstDept);

      resultBox.innerHTML = `
        <div class="triage-result-card triage-specialist">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--primary-dark);">
              🩺 Recommended: Specialist Clinical Evaluation
            </h4>
            <span class="badge badge-primary">Non-Emergency / Recommended</span>
          </div>
          <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1.25rem;">
            Based on your selected symptoms, an outpatient clinical consultation with our <strong>${deptObj ? deptObj.name : 'Specialist Department'}</strong> is advised to conduct targeted diagnostic assessment.
          </p>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="BookingWizard.open(null, '${firstDept}')">
              📅 Book Consultation with ${deptObj ? deptObj.shortName : 'Specialist'}
            </button>
            <button class="btn btn-secondary" onclick="BookingWizard.open(null, '${firstDept}')">
              💻 Book Telehealth Video Call
            </button>
          </div>
        </div>
      `;
    }
  }
};

window.SymptomTriage = SymptomTriage;
