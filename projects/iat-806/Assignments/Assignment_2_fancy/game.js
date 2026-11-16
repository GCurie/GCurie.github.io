// game.js - game flow, levels, spawning, techniques, scoring

// ---------- Game flow ----------
function resetGame() {
  score = 0;
  lives = 3;
  combo = 0;
  particles = [];
  fxs = [];
  floatTexts = [];
  startLevel(1);
}

function startLevel(n) {
  level = n;
  kills = 0;
  spawnTimer = 0;
  spirits = [];
  // first little wave, made with a loop
  for (let i = 0; i < 3; i++) {
    let s = makeSpirit();
    s.y = -random(0, 350);
    spirits.push(s);
  }
  state = "levelIntro";
  stateTimer = 0;
}

function makeSpirit() {
  let L = LEVELS[level - 1];
  let r = random();
  let type = "normal";
  if (r < L.swift) type = "swift";
  else if (r < L.swift + L.tough) type = "tough";
  return new Spirit(type, L.speed[0], L.speed[1]);
}

function dangerY() {
  return height - 100;
}

function runGame() {
  let L = LEVELS[level - 1];

  // ADD objects: spawn a new spirit every few frames
  spawnTimer++;
  if (spawnTimer >= L.spawnEvery) {
    spawnTimer = 0;
    spirits.push(makeSpirit());
  }

  // gestures -> techniques
  for (let info of handInfo) {
    if (info.fresh && info.gesture !== "none") {
      tryFire(info.gesture, info, false);
    }
  }

  // update spirits, check if they cross the line
  for (let i = spirits.length - 1; i >= 0; i--) {
    spirits[i].update();
    if (spirits[i].reachedLine(dangerY())) {
      // REMOVE object: it got past you
      loseLife(spirits[i]);
      spirits.splice(i, 1);
    }
  }

  // draw everything
  drawDangerLine();
  for (let s of spirits) s.show();
  runList(fxs);
  runList(particles);
  runList(floatTexts);
  drawHands();
  drawHUD();

  // level cleared?
  if (state === "playing" && kills >= L.goal) {
    playSfx("levelup");
    // clear remaining spirits with a pop
    for (let s of spirits) burst(s.x, s.y, s.col, 10);
    spirits = [];
    if (level < LEVELS.length) {
      startLevel(level + 1);
    } else {
      state = "win";
      stateTimer = 0;
      holdFrames = 0;
    }
  }
}

function loseLife(s) {
  lives--;
  combo = 0;
  shake = 18;
  burst(s.x, dangerY(), color(255, 40, 40), 14);
  playSfx("hurt");
  if (lives <= 0) {
    state = "gameOver";
    stateTimer = 0;
    holdFrames = 0;
    playSfx("gameover");
  }
}

// ---------- Techniques ----------
function tryFire(g, info, debug) {
  let L = LEVELS[level - 1];
  if (!debug && !L.unlock.includes(g)) return; // not unlocked yet
  if (millis() - lastUsed[g] < COOLDOWN[g]) return; // still cooling down
  lastUsed[g] = millis();

  if (g === "point") {
    // direction from the base of the index finger to its tip
    let base = info.pts[5];
    let tip = info.pts[8];
    let d = createVector(tip.x - base.x, tip.y - base.y);
    if (d.mag() < 1) return;
    d.normalize();
    fxs.push(new AttackFX("bolt", tip.x, tip.y, d.x, d.y));
    playSfx("bolt");
    // BODY TOUCHES OBJECTS: every spirit along the fingertip ray gets hit
    for (let i = spirits.length - 1; i >= 0; i--) {
      if (spirits[i].hitByRay(tip.x, tip.y, d.x, d.y, 40)) damageSpirit(i, 1, 1);
    }
  } else if (g === "fist") {
    fxs.push(new AttackFX("flash", info.palm.x, info.palm.y));
    playSfx("flash");
    shake = 6;
    // BODY TOUCHES OBJECTS: spirits touching the fist get punched (2x points)
    for (let i = spirits.length - 1; i >= 0; i--) {
      if (spirits[i].hitByCircle(info.palm.x, info.palm.y, 75)) damageSpirit(i, 2, 2);
    }
  } else if (g === "peace") {
    fxs.push(new AttackFX("slash", 0, info.palm.y));
    playSfx("slash");
    shake = 8;
    // BODY TOUCHES OBJECTS: everything at your hand's height gets cut
    for (let i = spirits.length - 1; i >= 0; i--) {
      if (spirits[i].hitByBand(info.palm.y, 70)) damageSpirit(i, 2, 1);
    }
  } else if (g === "palm") {
    fxs.push(new AttackFX("shock", info.palm.x, info.palm.y));
    playSfx("shock");
    shake = 12;
    // BODY TOUCHES OBJECTS: everything near your palm is blasted
    for (let i = spirits.length - 1; i >= 0; i--) {
      if (spirits[i].hitByCircle(info.palm.x, info.palm.y, 170)) {
        spirits[i].knockback(80);
        damageSpirit(i, 1, 1);
      }
    }
  }
}

function damageSpirit(i, dmg, bonus) {
  let s = spirits[i];
  let dead = s.damage(dmg);
  if (dead) {
    killSpirit(i, bonus);
  } else {
    playSfx("hit");
    burst(s.x, s.y, color(255, 230, 80), 6);
  }
}

function killSpirit(i, bonus) {
  let s = spirits[i];

  // combo: kills within 1.5 seconds of each other stack up
  if (frameCount - lastKillFrame < 90) combo++;
  else combo = 1;
  lastKillFrame = frameCount;
  let mult = min(combo, 5);

  let pts = 10 * bonus * mult;
  score += pts;
  kills++;

  burst(s.x, s.y, s.col, 18);
  floatTexts.push(new FloatText(s.x, s.y, "+" + pts, color(255, 240, 120)));
  if (mult > 1) {
    floatTexts.push(new FloatText(s.x, s.y - 34, "x" + mult + " COMBO", color(120, 255, 255)));
  }
  playSfx("pop", random(0.9, 1.25));

  // REMOVE object: the spirit is dead
  spirits.splice(i, 1);
}

function burst(x, y, col, n) {
  for (let i = 0; i < n; i++) particles.push(new Particle(x, y, col));
}

// Update + draw + remove dead objects from any array that has update/show/isDead
function runList(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    arr[i].update();
    arr[i].show();
    if (arr[i].isDead()) arr.splice(i, 1);
  }
}


// Leave the current game and go back to the title screen
function exitToMenu() {
  spirits = [];
  particles = [];
  fxs = [];
  floatTexts = [];
  combo = 0;
  holdFrames = 0;
  state = "start";
  stateTimer = 0;
}
