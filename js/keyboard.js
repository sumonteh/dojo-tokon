const KEY_MAP = Object.freeze({
  KeyW: "UP", ArrowUp: "UP",
  KeyA: "LEFT", ArrowLeft: "LEFT",
  KeyS: "DOWN", ArrowDown: "DOWN",
  KeyD: "RIGHT", ArrowRight: "RIGHT",
  KeyJ: "L", KeyK: "M", KeyL: "H", KeyI: "ASSIST"
});

export class KeyboardController {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.heldKeys = new Set();
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  start() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    window.addEventListener("blur", this.onBlur);
  }

  onKeyDown(event) {
    const input = KEY_MAP[event.code];
    if (!input || event.metaKey || event.ctrlKey || event.altKey) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    event.preventDefault();
    if (this.heldKeys.has(event.code)) return;
    this.heldKeys.add(event.code);
    this.inputManager.press(input, `keyboard:${event.code}`);
  }

  onKeyUp(event) {
    const input = KEY_MAP[event.code];
    if (!input) return;
    event.preventDefault();
    this.heldKeys.delete(event.code);
    this.inputManager.release(input, `keyboard:${event.code}`);
  }

  onBlur() {
    for (const code of [...this.heldKeys]) {
      this.inputManager.release(KEY_MAP[code], `keyboard:${code}`);
    }
    this.heldKeys.clear();
  }
}
