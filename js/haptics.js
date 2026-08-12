export class Haptics {
  vibrate(pattern) {
    try { navigator.vibrate?.(pattern); } catch (_) { /* Optional capability. */ }
  }
  hit() { this.vibrate(12); }
  complete() { this.vibrate([18, 35, 28]); }
  fail() { this.vibrate([28, 30, 28]); }
}
