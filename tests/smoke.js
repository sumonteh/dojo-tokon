import { InputManager } from "../js/input-manager.js";
import { TouchController } from "../js/touch-controls.js";
import { ComboEngine } from "../js/combo-engine.js";
import { COMBOS, TIMING } from "../data/combos.js";
import { readGamepadState } from "../js/gamepad.js";

const results = document.querySelector("#results");
const report = (name, passed, detail = "") => {
  const item = document.createElement("li");
  item.dataset.result = passed ? "pass" : "fail";
  item.textContent = `${passed ? "PASS" : "FAIL"} — ${name}${detail ? `: ${detail}` : ""}`;
  results.append(item);
};

const input = new InputManager();
let lastAction = null;
input.addEventListener("action", (event) => { lastAction = event.detail.input; });
const touchFixture = document.createElement("div");
touchFixture.innerHTML = '<button data-input="DOWN">DOWN</button><button data-input="H">H</button>';
document.body.append(touchFixture);
new TouchController(touchFixture, input).start();
const [downButton, heavyButton] = touchFixture.querySelectorAll("button");
downButton.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 101, bubbles: true, cancelable: true }));
heavyButton.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 202, bubbles: true, cancelable: true }));
report("Pointer Events multitouch: DOWN sostenido + Heavy", lastAction === "DOWN+H" && downButton.classList.contains("pressed") && heavyButton.classList.contains("pressed"), String(lastAction));
heavyButton.dispatchEvent(new PointerEvent("pointerup", { pointerId: 202, bubbles: true }));
downButton.dispatchEvent(new PointerEvent("pointerup", { pointerId: 101, bubbles: true }));
touchFixture.remove();

const completeEngine = new ComboEngine(COMBOS[0], TIMING, "practice");
let complete = null;
completeEngine.addEventListener("complete", (event) => { complete = event.detail; });
completeEngine.receive("L", 1000);
completeEngine.receive("M", 1180);
completeEngine.receive("H", 1360);
completeEngine.receive("DOWN+H", 1540);
report("Combo Practice completo", complete?.hits === 4 && complete?.perfect === 4, JSON.stringify(complete));

const wrongEngine = new ComboEngine(COMBOS[0], TIMING, "practice");
let wrong = null;
wrongEngine.addEventListener("drop", (event) => { wrong = event.detail; });
wrongEngine.receive("L", 2000);
wrongEngine.receive("H", 2180);
report("Input incorrecto produce drop", wrong?.reason === "wrong" && wrong?.expected === "M", JSON.stringify(wrong));

const timeoutEngine = new ComboEngine(COMBOS[0], TIMING, "practice");
let timeout = null;
timeoutEngine.addEventListener("drop", (event) => { timeout = event.detail; });
timeoutEngine.receive("L", 3000);
timeoutEngine.tick(3000 + TIMING.MAX_COMBO_GAP + 1);
report("Timeout produce drop", timeout?.reason === "timeout", JSON.stringify(timeout));

const learnEngine = new ComboEngine(COMBOS[0], TIMING, "learn");
let learnComplete = false;
learnEngine.addEventListener("complete", () => { learnComplete = true; });
learnEngine.receive("L", 4000);
learnEngine.receive("M", 8000);
learnEngine.receive("H", 12000);
learnEngine.receive("DOWN+H", 16000);
report("Learn ignora timing", learnComplete);

const challengeEngine = new ComboEngine(COMBOS[0], TIMING, "challenge");
let challengeComplete = false;
challengeEngine.addEventListener("complete", () => { challengeComplete = true; });
challengeEngine.receive("L", 5000);
challengeEngine.receive("M", 5180);
challengeEngine.receive("H", 5360);
challengeEngine.receive("DOWN+H", 5540);
report("Challenge usa el motor genérico", challengeComplete);

const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
buttons[2] = { pressed: true, value: 1 };
const gamepadState = readGamepadState({ buttons, axes: [0, .8] });
report("Mapping gamepad estándar y fallback de ejes", gamepadState.get("L") && gamepadState.get("DOWN"));

document.body.dataset.status = [...results.children].every((item) => item.dataset.result === "pass") ? "pass" : "fail";
