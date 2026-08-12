export const TIMING = Object.freeze({
  PERFECT_MIN: 140,
  PERFECT_MAX: 280,
  GOOD_MIN: 90,
  GOOD_MAX: 430,
  MAX_COMBO_GAP: 600
});

export const COMBOS = [
  {
    id: "basic-launcher",
    name: "Basic Launcher",
    displayName: "Launcher básico",
    sequence: [
      { input: "L" },
      { input: "M" },
      { input: "H" },
      { input: "DOWN+H" }
    ]
  }
];

export const INPUT_GLYPHS = Object.freeze({
  UP: "↑",
  DOWN: "↓",
  LEFT: "←",
  RIGHT: "→",
  L: "□",
  M: "△",
  H: "○",
  ASSIST: "×",
  "DOWN+H": "↓ + ○"
});
