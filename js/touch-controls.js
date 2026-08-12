export class TouchController {
  constructor(root, inputManager) {
    this.root = root;
    this.inputManager = inputManager;
    this.pointers = new Map();
  }

  start() {
    this.root.querySelectorAll("[data-input]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => this.press(event, button));
      button.addEventListener("pointerup", (event) => this.release(event));
      button.addEventListener("pointercancel", (event) => this.release(event));
      button.addEventListener("lostpointercapture", (event) => this.release(event));
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });
    this.root.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
  }

  press(event, button) {
    event.preventDefault();
    const input = button.dataset.input;
    const source = `pointer:${event.pointerId}`;
    if (this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { input, button, source });
    button.classList.add("pressed");
    button.setAttribute("aria-pressed", "true");
    try { button.setPointerCapture(event.pointerId); } catch (_) { /* Optional API. */ }
    this.inputManager.press(input, source);
  }

  release(event) {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    pointer.button.classList.remove("pressed");
    pointer.button.setAttribute("aria-pressed", "false");
    this.inputManager.release(pointer.input, pointer.source);
    this.pointers.delete(event.pointerId);
  }
}
