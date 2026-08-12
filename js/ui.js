import { INPUT_GLYPHS } from "../data/combos.js";

const RATING_CLASSES = ["perfect", "good", "early", "late", "miss", "drop", "complete"];

export class UI {
  constructor(combo, store) {
    this.combo = combo;
    this.store = store;
    this.history = [];
    this.lastHistoryAt = 0;
    this.mode = "learn";
    this.elements = {
      sequence: document.querySelector("#combo-sequence"),
      goalLabel: document.querySelector("#goal-label"),
      feedback: document.querySelector("#feedback"),
      history: document.querySelector("#input-history"),
      source: document.querySelector("#input-source"),
      streak: document.querySelector("#streak-value"),
      compactHistory: document.querySelector("#compact-history"),
      compactHits: document.querySelector("#compact-hits"),
      compactMode: document.querySelector("#compact-mode")
    };
    this.renderSequence(0);
    this.renderStats();
  }

  setMode(mode) {
    this.mode = mode;
    this.elements.compactMode.textContent = mode.toUpperCase();
    this.elements.compactHits.textContent = "0 HITS";
    document.querySelectorAll(".mode-tab").forEach((tab) => {
      const selected = tab.dataset.mode === mode;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    this.renderSequence(0);
    const descriptions = {
      learn: ["LISTO PARA APRENDER", "Sigue el próximo input, sin penalización de timing"],
      practice: ["LISTO PARA PRACTICAR", "Completa la secuencia con ritmo"],
      challenge: ["CHALLENGE LISTO", "La secuencia está oculta hasta el resultado"]
    };
    this.setFeedback("", ...descriptions[mode]);
  }

  renderSequence(stepIndex = 0) {
    if (this.mode === "challenge") {
      this.elements.goalLabel.textContent = "COMBO OBJETIVO";
      this.elements.sequence.innerHTML = `<span class="challenge-title">${this.combo.name}</span>`;
      return;
    }
    this.elements.goalLabel.textContent = this.mode === "learn" ? "SIGUIENTE" : "SECUENCIA OBJETIVO";
    const visibleSequence = this.mode === "learn"
      ? this.combo.sequence.map((step, index) => ({ ...step, hidden: index !== stepIndex }))
      : this.combo.sequence;
    this.elements.sequence.innerHTML = visibleSequence.map((step, index) => {
      const classes = ["sequence-step"];
      if (index < stepIndex) classes.push("complete");
      if (index === stepIndex) classes.push("current");
      if (step.hidden) classes.push("hidden-step");
      const arrow = index < visibleSequence.length - 1 && this.mode !== "learn" ? '<span class="arrow">→</span>' : "";
      return `<span class="${classes.join(" ")}"><span class="glyph">${INPUT_GLYPHS[step.input] || step.input}</span>${arrow}</span>`;
    }).join("");
  }

  addHistory(input, timestamp) {
    const gap = this.lastHistoryAt ? Math.round(timestamp - this.lastHistoryAt) : 0;
    this.lastHistoryAt = timestamp;
    this.history.unshift({ input, gap });
    this.history = this.history.slice(0, 15);
    this.elements.compactHistory.innerHTML = this.history.slice(0, 4).reverse()
      .map((item) => `<span>${INPUT_GLYPHS[item.input] || item.input}</span>`).join("");
    this.elements.history.innerHTML = this.history.map((item, index) => `
      <li><span class="history-glyph">${INPUT_GLYPHS[item.input] || item.input}</span><span class="history-name">${item.input}</span><time>${index === this.history.length - 1 && !item.gap ? "0 ms" : `+${item.gap} ms`}</time></li>
    `).join("");
  }

  setFeedback(style, title, detail) {
    this.elements.feedback.classList.remove(...RATING_CLASSES);
    if (style) this.elements.feedback.classList.add(style.toLowerCase());
    this.elements.feedback.innerHTML = `<strong>${title}</strong><small>${detail || ""}</small>`;
  }

  showStep(detail) {
    this.renderSequence(detail.stepIndex);
    this.elements.compactHits.textContent = `${detail.stepIndex} HITS`;
  }

  showComplete(result) {
    this.elements.streak.textContent = result.streak;
    this.setFeedback("complete", "COMBO COMPLETE", `${result.hits} hits · ${result.totalTime} ms · ${result.accuracy}% accuracy · P ${result.perfect} / G ${result.good} / Miss ${result.misses}`);
    this.elements.compactHits.textContent = `${result.hits} HITS`;
    window.setTimeout(() => this.renderSequence(0), 650);
  }

  showDrop(detail) {
    this.elements.streak.textContent = "0";
    this.renderSequence(0);
    this.elements.compactHits.textContent = "0 HITS";
    this.setFeedback("drop", "COMBO DROPPED", detail.detail);
  }

  updateVisualizer(input, active) {
    document.querySelectorAll(`[data-visual="${input}"]`).forEach((element) => element.classList.toggle("active", active));
  }

  setGamepadStatus(connected) {
    this.elements.source.classList.toggle("gamepad", connected);
    this.elements.source.innerHTML = `<i></i>${connected ? "GAMEPAD CONECTADO" : "TECLADO / TÁCTIL"}`;
  }

  renderStats() {
    const data = this.store.data;
    document.querySelector("#stat-attempts").textContent = data.attempts;
    document.querySelector("#stat-success").textContent = data.successfulCombos;
    document.querySelector("#stat-failed").textContent = data.failedCombos;
    document.querySelector("#stat-best-time").textContent = data.bestTime === null ? "—" : `${data.bestTime} ms`;
    document.querySelector("#stat-average").textContent = data.timingSamples ? `${Math.round(data.averageTiming)} ms` : "—";
    document.querySelector("#stat-best-streak").textContent = data.bestStreak;
  }
}
