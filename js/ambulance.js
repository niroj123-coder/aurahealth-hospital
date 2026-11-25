/**
 * AuraHealth International Hospital
 * 24/7 Emergency Ambulance SOS Dispatch Simulator
 */

const AmbulanceSOS = {
  isDispatched: false,
  timerInterval: null,
  countdownSeconds: 420, // 7 minutes

  open() {
    const modal = document.getElementById('ambulanceModal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.resetView();
  },

  close() {
    const modal = document.getElementById('ambulanceModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  resetView() {
    this.isDispatched = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.countdownSeconds = 420;

    const intakeView = document.getElementById('ambulanceIntakeView');
    const liveTrackerView = document.getElementById('ambulanceLiveTrackerView');

    if (intakeView) intakeView.style.display = 'block';
    if (liveTrackerView) liveTrackerView.style.display = 'none';
  },

  dispatchNow() {
    const locationInput = document.getElementById('sosLocationInput');
    const location = locationInput && locationInput.value.trim() ? locationInput.value.trim() : 'Detected via GPS: 420 Lexington Ave, Suite 1200';

    const intakeView = document.getElementById('ambulanceIntakeView');
    const liveTrackerView = document.getElementById('ambulanceLiveTrackerView');

    if (intakeView) intakeView.style.display = 'none';
    if (liveTrackerView) liveTrackerView.style.display = 'block';

    this.isDispatched = true;
    this.startCountdown();
    App.showToast('🚨 Ambulance Unit Alpha-04 dispatched! Paramedics en route.', 'error');
  },

  startCountdown() {
    const timerEl = document.getElementById('ambulanceEtaTimer');
    const progressEl = document.getElementById('ambulanceProgressFill');

    this.timerInterval = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        clearInterval(this.timerInterval);
        if (timerEl) timerEl.textContent = 'ARRIVED ON SITE';
        App.showToast('Paramedics have arrived at your location.', 'success');
        return;
      }

      const mins = Math.floor(this.countdownSeconds / 60);
      const secs = this.countdownSeconds % 60;
      if (timerEl) {
        timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs} MINS`;
      }

      if (progressEl) {
        const percent = ((420 - this.countdownSeconds) / 420) * 100;
        progressEl.style.width = `${percent}%`;
      }
    }, 1000);
  }
};

window.AmbulanceSOS = AmbulanceSOS;
