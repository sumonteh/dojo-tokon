export class SoundEngine {
  constructor() {
    this.enabled = false;
    this.context = null;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled && !this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.context = new AudioContext();
    }
    return this.enabled;
  }

  tone(type = "hit") {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const settings = {
      hit: [150, 65, .045],
      complete: [420, 780, .15],
      fail: [110, 70, .13]
    }[type];
    oscillator.type = type === "complete" ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(settings[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(settings[1], now + settings[2]);
    gain.gain.setValueAtTime(.055, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + settings[2]);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + settings[2]);
  }
}
