import { COMBOS, TIMING } from "../data/combos.js";
import { InputManager } from "./input-manager.js";
import { KeyboardController } from "./keyboard.js";
import { TouchController } from "./touch-controls.js";
import { GamepadController } from "./gamepad.js";
import { ComboEngine } from "./combo-engine.js";
import { FightScene } from "./fighter.js";
import { UI } from "./ui.js";
import { ProgressStore } from "./storage.js";
import { Haptics } from "./haptics.js";
import { SoundEngine } from "./sound.js";

const combo = COMBOS[0];
const inputManager = new InputManager();
const comboEngine = new ComboEngine(combo, TIMING, "learn");
const store = new ProgressStore();
const ui = new UI(combo, store);
const scene = new FightScene(document.querySelector("#fight-canvas"));
const haptics = new Haptics();
const sound = new SoundEngine();

new KeyboardController(inputManager).start();
new TouchController(document.querySelector("#touch-controls"), inputManager).start();
const gamepad = new GamepadController(inputManager);
gamepad.start();

inputManager.addEventListener("statechange", ({ detail }) => ui.updateVisualizer(detail.input, detail.active));
inputManager.addEventListener("action", ({ detail }) => {
  ui.addHistory(detail.input, detail.timestamp);
  scene.attack(detail.input);
  comboEngine.receive(detail.input, detail.timestamp);
});

gamepad.addEventListener("connectionchange", ({ detail }) => ui.setGamepadStatus(detail.connected));

comboEngine.addEventListener("attempt", () => {
  store.recordAttempt();
  ui.renderStats();
});
comboEngine.addEventListener("step", ({ detail }) => {
  ui.showStep(detail);
  haptics.hit();
  sound.tone("hit");
});
comboEngine.addEventListener("feedback", ({ detail }) => ui.setFeedback(detail.rating, detail.title, detail.detail));
comboEngine.addEventListener("complete", ({ detail }) => {
  store.recordSuccess(detail);
  ui.renderStats();
  ui.showComplete(detail);
  haptics.complete();
  sound.tone("complete");
});
comboEngine.addEventListener("drop", ({ detail }) => {
  store.recordFailure();
  ui.renderStats();
  ui.showDrop(detail);
  haptics.fail();
  sound.tone("fail");
});
comboEngine.addEventListener("reset", () => ui.renderSequence(0));

document.querySelectorAll(".mode-tab").forEach((tab) => tab.addEventListener("click", () => {
  comboEngine.setMode(tab.dataset.mode);
  ui.setMode(tab.dataset.mode);
}));

document.querySelector("#history-toggle").addEventListener("click", (event) => {
  const card = event.currentTarget.closest(".history-card");
  const collapsed = card.classList.toggle("collapsed");
  event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
});

document.querySelector("#touch-toggle").addEventListener("click", (event) => {
  const visible = document.querySelector("#touch-controls").classList.toggle("force-visible");
  event.currentTarget.setAttribute("aria-pressed", String(visible));
});

document.querySelector("#sound-toggle").addEventListener("click", (event) => {
  const enabled = sound.toggle();
  event.currentTarget.textContent = `SONIDO: ${enabled ? "ON" : "OFF"}`;
  event.currentTarget.setAttribute("aria-pressed", String(enabled));
  if (enabled) sound.tone("hit");
});

document.querySelector("#fullscreen-button").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else await document.documentElement.requestFullscreen?.();
  } catch (_) { /* iOS Safari may not expose standard fullscreen. */ }
});

document.querySelector("#reset-progress").addEventListener("click", () => {
  if (!window.confirm("¿Borrar todo el progreso guardado en este dispositivo?")) return;
  store.reset();
  comboEngine.streak = 0;
  ui.elements.streak.textContent = "0";
  ui.renderStats();
  ui.setFeedback("", "PROGRESO BORRADO", "Las estadísticas volvieron a cero");
});

function loop(timestamp) {
  comboEngine.tick(timestamp);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

document.addEventListener("dragstart", (event) => {
  if (event.target.closest(".touch-controls")) event.preventDefault();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js")
    .then(() => { document.documentElement.dataset.serviceWorker = "registered"; })
    .catch(() => { document.documentElement.dataset.serviceWorker = "unavailable"; }));
}

// Exposed read-only references make local automated smoke tests possible without coupling UI code to test tooling.
window.__DOJO_TOKON__ = Object.freeze({ inputManager, comboEngine, scene, store, timing: TIMING });
