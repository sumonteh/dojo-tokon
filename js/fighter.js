const TAU = Math.PI * 2;

export class FightScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.player = { state: "idle", started: 0 };
    this.dummy = { state: "idle", started: 0 };
    this.lastTime = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.handleViewportChange = () => requestAnimationFrame(() => {
      this.resize();
      this.draw(performance.now());
    });
    window.addEventListener("resize", this.handleViewportChange, { passive: true });
    window.addEventListener("orientationchange", this.handleViewportChange, { passive: true });
    window.visualViewport?.addEventListener("resize", this.handleViewportChange, { passive: true });
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  attack(input) {
    const state = { L: "light", M: "medium", H: "heavy", "DOWN+H": "launcher", ASSIST: "light" }[input] || "idle";
    this.setState(this.player, state);
    if (input === "DOWN+H") this.setState(this.dummy, "launch-hit");
    else if (["L", "M", "H"].includes(input)) this.setState(this.dummy, "hit");
  }

  setState(fighter, state) {
    fighter.state = state;
    fighter.started = performance.now();
    if (fighter === this.dummy) {
      const trace = (this.canvas.dataset.dummyStateHistory || "").split(",").filter(Boolean);
      trace.push(state);
      this.canvas.dataset.dummyStateHistory = trace.slice(-8).join(",");
    }
  }

  loop(time) {
    this.lastTime = time;
    this.update(this.player, time, false);
    this.update(this.dummy, time, true);
    this.draw(time);
    requestAnimationFrame(this.loop);
  }

  update(fighter, time, isDummy) {
    const age = time - fighter.started;
    if (!isDummy && fighter.state !== "idle" && age > ({ light: 180, medium: 260, heavy: 350, launcher: 520 }[fighter.state] || 220)) this.setState(fighter, "idle");
    if (!isDummy) return;
    if (fighter.state === "hit" && age > 280) this.setState(fighter, "idle");
    if (fighter.state === "launch-hit" && age > 170) this.setState(fighter, "airborne");
    if (fighter.state === "airborne" && age > 620) this.setState(fighter, "landing");
    if (fighter.state === "landing" && age > 520) this.setState(fighter, "idle");
  }

  draw(time) {
    const ctx = this.ctx;
    const width = this.width || this.canvas.clientWidth;
    const height = this.height || this.canvas.clientHeight;
    this.canvas.dataset.playerState = this.player.state;
    this.canvas.dataset.dummyState = this.dummy.state;
    ctx.clearRect(0, 0, width, height);

    const compact = height < 320;
    const fighterScale = compact ? Math.max(.82, Math.min(1, height / 225)) : 1;
    const floor = compact ? height - Math.max(18, height * .08) : Math.max(height * .67, height - 150);
    this.drawBackground(ctx, width, height, floor);
    this.drawFighter(ctx, width * .28, floor, 1, this.player, "#c7f43c", time, fighterScale);
    this.drawFighter(ctx, width * .72, floor, -1, this.dummy, "#ff657b", time, fighterScale);
  }

  drawBackground(ctx, width, height, floor) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#17252d");
    gradient.addColorStop(.68, "#10191f");
    gradient.addColorStop(1, "#090e12");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(86,224,206,.09)";
    ctx.lineWidth = 1;
    for (let x = -width; x < width * 2; x += 60) {
      ctx.beginPath(); ctx.moveTo(width / 2, floor - 12); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = floor; y < height; y += 22) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.strokeStyle = "#40545a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, floor); ctx.lineTo(width, floor); ctx.stroke();
    ctx.fillStyle = "rgba(199,244,60,.07)";
    ctx.fillRect(0, floor, width, 2);
  }

  drawFighter(ctx, x, floor, facing, fighter, color, time, scale = 1) {
    const age = time - fighter.started;
    let y = floor;
    let lean = Math.sin(time / 430) * .03;
    let frontArm = { x: 25, y: 8 };
    let backArm = { x: -18, y: 21 };
    let frontLeg = { x: 18, y: 61 };
    let backLeg = { x: -16, y: 61 };
    let rotation = 0;

    if (fighter.state === "light") frontArm = { x: 52, y: -2 };
    if (fighter.state === "medium") { frontArm = { x: 61, y: 10 }; lean = .12; }
    if (fighter.state === "heavy") { frontArm = { x: 67, y: 19 }; lean = .2; }
    if (fighter.state === "launcher") { frontArm = { x: 31, y: -48 }; lean = -.13; frontLeg = { x: 26, y: 59 }; }
    if (fighter.state === "hit") { lean = -.24; x += 10 * scale * -facing; }
    if (fighter.state === "launch-hit") { y -= Math.min(age / 170, 1) * 52 * scale; lean = -.3; }
    if (fighter.state === "airborne") {
      const progress = Math.min(age / 620, 1);
      y -= (54 + Math.sin(progress * Math.PI) * 62) * scale;
      rotation = facing * Math.sin(progress * Math.PI) * .55;
      frontLeg = { x: 30, y: 42 }; backLeg = { x: -28, y: 40 };
    }
    if (fighter.state === "landing") { y -= Math.max(0, 1 - age / 150) * 18 * scale; lean = .48; frontLeg = { x: 31, y: 45 }; }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(facing * scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.fillStyle = "#111920";
    ctx.lineWidth = 7;
    ctx.shadowColor = color;
    ctx.shadowBlur = 7;

    ctx.beginPath(); ctx.arc(0, -73, 15, 0, TAU); ctx.fill(); ctx.stroke();
    const shoulder = { x: lean * 35, y: -48 };
    const hip = { x: lean * 18, y: 5 };
    this.limb(ctx, shoulder.x, shoulder.y, hip.x, hip.y);
    this.limb(ctx, shoulder.x, shoulder.y, frontArm.x, frontArm.y - 48);
    this.limb(ctx, shoulder.x, shoulder.y + 4, backArm.x, backArm.y - 48);
    this.limb(ctx, hip.x, hip.y, frontLeg.x, frontLeg.y);
    this.limb(ctx, hip.x, hip.y, backLeg.x, backLeg.y);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#10161b";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3, -77); ctx.lineTo(10, -74); ctx.stroke();
    ctx.restore();

    if (["hit", "launch-hit"].includes(fighter.state) && age < 130) this.drawImpact(ctx, x - facing * 28 * scale, y - 56 * scale, age, color);
    if (fighter.state === "landing" && age < 190) this.drawDust(ctx, x, floor, age);
  }

  limb(ctx, x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  drawImpact(ctx, x, y, age) {
    const radius = 18 + age * .18;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = `rgba(255,200,87,${1 - age / 140})`; ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const angle = i * TAU / 8;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10); ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); ctx.stroke();
    }
    ctx.restore();
  }

  drawDust(ctx, x, floor, age) {
    ctx.save(); ctx.strokeStyle = `rgba(130,147,143,${1 - age / 190})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, floor, 12 + age * .25, Math.PI, TAU); ctx.stroke(); ctx.restore();
  }
}
