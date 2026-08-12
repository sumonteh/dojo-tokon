const VALID_INPUTS = new Set(["UP", "DOWN", "LEFT", "RIGHT", "L", "M", "H", "ASSIST"]);
const ATTACKS = new Set(["L", "M", "H", "ASSIST"]);

export class InputManager extends EventTarget {
  constructor() {
    super();
    this.sources = new Map();
  }

  press(input, source = "unknown") {
    if (!VALID_INPUTS.has(input)) return;
    const activeSources = this.sources.get(input) || new Set();
    const wasActive = activeSources.size > 0;
    activeSources.add(source);
    this.sources.set(input, activeSources);

    if (!wasActive) this.emitState(input, true);
    if (ATTACKS.has(input) && !wasActive) {
      const normalized = input === "H" && this.isActive("DOWN") ? "DOWN+H" : input;
      this.dispatchEvent(new CustomEvent("action", {
        detail: { input: normalized, rawInput: input, source, timestamp: performance.now() }
      }));
    }
  }

  release(input, source = "unknown") {
    const activeSources = this.sources.get(input);
    if (!activeSources) return;
    activeSources.delete(source);
    if (activeSources.size === 0) {
      this.sources.delete(input);
      this.emitState(input, false);
    }
  }

  releaseSource(prefix) {
    for (const [input, sources] of this.sources) {
      for (const source of [...sources]) {
        if (source.startsWith(prefix)) this.release(input, source);
      }
    }
  }

  isActive(input) {
    return (this.sources.get(input)?.size || 0) > 0;
  }

  emitState(input, active) {
    this.dispatchEvent(new CustomEvent("statechange", { detail: { input, active } }));
  }
}
