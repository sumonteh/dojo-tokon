export const STANDARD_GAMEPAD_MAPPING = Object.freeze({
  0: "ASSIST", 1: "H", 2: "L", 3: "M",
  12: "UP", 13: "DOWN", 14: "LEFT", 15: "RIGHT"
});

export function readGamepadState(pad, mapping = STANDARD_GAMEPAD_MAPPING) {
  const state = new Map();
  for (const [index, input] of Object.entries(mapping)) {
    state.set(input, Boolean(pad.buttons[Number(index)]?.pressed || pad.buttons[Number(index)]?.value > .5));
  }
  const x = Math.abs(pad.axes[0] || 0) > .55 ? pad.axes[0] : 0;
  const y = Math.abs(pad.axes[1] || 0) > .55 ? pad.axes[1] : 0;
  state.set("LEFT", state.get("LEFT") || x < 0);
  state.set("RIGHT", state.get("RIGHT") || x > 0);
  state.set("UP", state.get("UP") || y < 0);
  state.set("DOWN", state.get("DOWN") || y > 0);
  return state;
}

export class GamepadController extends EventTarget {
  constructor(inputManager) {
    super();
    this.inputManager = inputManager;
    this.previous = new Map();
    this.running = false;
    this.frame = null;
    this.loop = this.loop.bind(this);
  }

  start() {
    if (!("getGamepads" in navigator)) return;
    this.running = true;
    window.addEventListener("gamepadconnected", (event) => this.connected(event.gamepad));
    window.addEventListener("gamepaddisconnected", (event) => this.disconnected(event.gamepad));
    this.frame = requestAnimationFrame(this.loop);
  }

  connected(gamepad) {
    this.dispatchEvent(new CustomEvent("connectionchange", { detail: { connected: true, name: gamepad.id } }));
  }

  disconnected(gamepad) {
    this.inputManager.releaseSource(`gamepad:${gamepad.index}:`);
    this.previous.delete(gamepad.index);
    const anyConnected = [...(navigator.getGamepads?.() || [])].some(Boolean);
    this.dispatchEvent(new CustomEvent("connectionchange", { detail: { connected: anyConnected } }));
  }

  loop() {
    if (!this.running) return;
    try {
      const pads = navigator.getGamepads?.() || [];
      for (const pad of pads) if (pad) this.poll(pad);
    } catch (_) { /* Some Safari versions expose an incomplete API. */ }
    this.frame = requestAnimationFrame(this.loop);
  }

  poll(pad) {
    const next = readGamepadState(pad);

    const previous = this.previous.get(pad.index) || new Map();
    for (const [input, pressed] of next) {
      const source = `gamepad:${pad.index}:${input}`;
      if (pressed && !previous.get(input)) this.inputManager.press(input, source);
      if (!pressed && previous.get(input)) this.inputManager.release(input, source);
    }
    this.previous.set(pad.index, next);
  }
}
