const STORAGE_KEY = "dojo-tokon-progress-v1";

const DEFAULT_PROGRESS = Object.freeze({
  attempts: 0,
  successfulCombos: 0,
  failedCombos: 0,
  bestStreak: 0,
  averageTiming: 0,
  timingSamples: 0,
  bestTime: null,
  lastSession: null
});

export class ProgressStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...DEFAULT_PROGRESS, ...(stored || {}) };
    } catch (_) {
      return { ...DEFAULT_PROGRESS };
    }
  }

  save() {
    this.data.lastSession = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (_) { /* Private mode may block storage. */ }
  }

  recordAttempt() {
    this.data.attempts += 1;
    this.save();
  }

  recordSuccess(result) {
    this.data.successfulCombos += 1;
    this.data.bestStreak = Math.max(this.data.bestStreak, result.streak);
    this.data.bestTime = this.data.bestTime === null ? result.totalTime : Math.min(this.data.bestTime, result.totalTime);
    const transitionTimings = result.timings || [];
    for (const timing of transitionTimings) {
      this.data.averageTiming = ((this.data.averageTiming * this.data.timingSamples) + timing) / (this.data.timingSamples + 1);
      this.data.timingSamples += 1;
    }
    this.save();
  }

  recordFailure() {
    this.data.failedCombos += 1;
    this.save();
  }

  reset() {
    this.data = { ...DEFAULT_PROGRESS };
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* No-op. */ }
  }
}
