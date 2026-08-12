export class ComboEngine extends EventTarget {
  constructor(combo, timing, mode = "learn") {
    super();
    this.combo = combo;
    this.timing = timing;
    this.mode = mode;
    this.streak = 0;
    this.reset();
  }

  setMode(mode) {
    this.mode = mode;
    this.reset();
    this.emit("reset", this.snapshot());
  }

  reset() {
    this.stepIndex = 0;
    this.active = false;
    this.startedAt = 0;
    this.lastInputAt = 0;
    this.ratings = [];
    this.gaps = [];
  }

  receive(input, timestamp = performance.now()) {
    const expected = this.combo.sequence[this.stepIndex]?.input;

    if (this.mode === "learn") {
      if (input !== expected) {
        this.emit("feedback", { rating: "MISS", title: "WRONG INPUT", detail: `Esperado: ${expected} · Recibido: ${input}` });
        return;
      }
      if (!this.active) this.startAttempt(timestamp);
      this.ratings.push("GOOD");
      this.stepIndex += 1;
      this.emit("step", { ...this.snapshot(), rating: "GOOD", gap: this.stepIndex === 1 ? 0 : timestamp - this.lastInputAt });
      this.lastInputAt = timestamp;
      if (this.stepIndex === this.combo.sequence.length) this.complete(timestamp);
      else this.emit("feedback", { rating: "GOOD", title: "CORRECTO", detail: `Siguiente: ${this.combo.sequence[this.stepIndex].input}` });
      return;
    }

    if (!this.active) {
      if (input !== expected) {
        this.startAttempt(timestamp);
        this.drop("wrong", input, expected, 0);
        return;
      }
      this.startAttempt(timestamp);
      this.ratings.push("PERFECT");
      this.stepIndex = 1;
      this.lastInputAt = timestamp;
      this.emit("step", { ...this.snapshot(), rating: "PERFECT", gap: 0 });
      this.emit("feedback", { rating: "PERFECT", title: "PERFECT", detail: "Inicio limpio" });
      return;
    }

    const gap = timestamp - this.lastInputAt;
    if (gap > this.timing.MAX_COMBO_GAP) {
      this.drop("timeout", input, expected, gap);
      return;
    }
    if (input !== expected) {
      this.drop("wrong", input, expected, gap);
      return;
    }

    const rating = this.classify(gap);
    this.ratings.push(rating);
    this.gaps.push(Math.round(gap));
    this.stepIndex += 1;
    this.lastInputAt = timestamp;
    this.emit("step", { ...this.snapshot(), rating, gap });
    const titles = { PERFECT: "PERFECT", GOOD: "GOOD", EARLY: "TOO EARLY", LATE: "TOO LATE" };
    this.emit("feedback", { rating, title: titles[rating], detail: `${Math.round(gap)} ms` });
    if (this.stepIndex === this.combo.sequence.length) this.complete(timestamp);
  }

  tick(timestamp = performance.now()) {
    if (this.mode === "learn" || !this.active || this.stepIndex === 0) return;
    const gap = timestamp - this.lastInputAt;
    if (gap > this.timing.MAX_COMBO_GAP) {
      const expected = this.combo.sequence[this.stepIndex]?.input;
      this.drop("timeout", null, expected, gap);
    }
  }

  classify(gap) {
    if (gap >= this.timing.PERFECT_MIN && gap <= this.timing.PERFECT_MAX) return "PERFECT";
    if (gap >= this.timing.GOOD_MIN && gap <= this.timing.GOOD_MAX) return "GOOD";
    return gap < this.timing.GOOD_MIN ? "EARLY" : "LATE";
  }

  startAttempt(timestamp) {
    this.active = true;
    this.startedAt = timestamp;
    this.lastInputAt = timestamp;
    this.emit("attempt", this.snapshot());
  }

  complete(timestamp) {
    const ratings = [...this.ratings];
    const totalTime = Math.round(timestamp - this.startedAt);
    const score = ratings.reduce((sum, rating) => sum + ({ PERFECT: 100, GOOD: 80, EARLY: 50, LATE: 50 }[rating] || 0), 0);
    const result = {
      hits: this.combo.sequence.length,
      totalTime,
      accuracy: this.mode === "learn" ? 100 : Math.round(score / ratings.length),
      perfect: ratings.filter((r) => r === "PERFECT").length,
      good: ratings.filter((r) => r === "GOOD").length,
      misses: ratings.filter((r) => r === "EARLY" || r === "LATE").length,
      ratings,
      timings: [...this.gaps]
    };
    this.streak += 1;
    this.emit("complete", { ...result, streak: this.streak });
    this.reset();
  }

  drop(reason, received, expected, gap) {
    this.streak = 0;
    const detail = reason === "timeout"
      ? `Esperado en ${this.timing.MAX_COMBO_GAP} ms · Pasaron ${Math.round(gap)} ms`
      : `Esperado: ${expected} · Recibido: ${received}`;
    this.emit("drop", { reason, received, expected, gap: Math.round(gap), detail, streak: 0 });
    this.reset();
  }

  snapshot() {
    return { stepIndex: this.stepIndex, active: this.active, mode: this.mode, combo: this.combo };
  }

  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }
}
