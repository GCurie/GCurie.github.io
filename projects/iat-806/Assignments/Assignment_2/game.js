// game.js - game flow, spawning, techniques, scoring

function resetGame() {
  score = 0;
  lives = 3;
  particles = [];
  fxs = [];
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
  return new Spirit(L.speed[0], L.speed[1]);
}

function dangerY() {
  return height - 100; // the red line
}

function runGame() {
  let L = LEVELS[level - 1];

  // ADD objects: a new spirit every few frames
  spawnTimer++;
  if (spawnTimer >= L.spawnEvery) {
    spawnTimer = 0;
    spirits.push(makeSpirit());
  }

  // a hand sign that just changed fires a technique
  for (let info of handInfo) {
    if (info.fresh && info.gesture !== "none") {
      tryFire(info.gesture, info);
    }
  }

  // move spirits, check if any crossed the line
  for (let i = spirits.length - 1; i >= 0; i--) {
    spirits[i].update();
    if (spirits[i].reachedLine(dangerY())) {
      loseLife();
      spirits.splice(i, 1); // REMOVE object: it got past you
    }
  }

  // draw everything
  drawDangerLine();
  for (let s of spirits) s.show();
  runList(fxs);
  runList(particles);
  drawHands();
  drawHUD();

  // level cleared?
  if (state === "playing" && kills >= L.goal) {
    playSfx("levelup");
    spirits = [];
    if (level < LEVELS.length) {
      startLevel(level + 1);
    } else {
      state = "win";
      stateTimer = 0;
    }
  }
}

function loseLife() {
  lives--;
  playSfx("hurt");
  if (lives <= 0) {
    state = "gameOver";
    stateTimer = 0;
    playSfx("gameover");
  }
}

// ---------- Techniques ----------
function tryFire(g, info) {
  if (!LEVELS[level - 1].unlock.includes(g)) return; // not unlocked yet
  if (millis() - lastUsed[g] < COOLDOWN[g]) return;  // still cooling down
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
    // BODY TOUCHES OBJECTS: every spirit along the fingertip ray is hit
    for (let i = spirits.length - 1; i >= 0; i--) {
      if (spirits[i].hitByRay(tip.x, tip.y, d.x, d.y, 40)) killSpirit(i);
    }
  } else if (g === "peace") {
    fxs.push(new AttackFX("slash", 0, info.palm.y));
    playSfx("slash");
    // BODY TOUCHES OBJECTS: every spirit at your hand's height is cut
    for (let i = spirits.length - 1; i >= 0; i--) {
      if (spirits[i].hitByBand(info.palm.y, 70)) killSpirit(i);
    }
  } else if (g === "palm") {
    fxs.push(new AttackFX("shock", info.palm.x, info.palm.y));
    playSfx("shock");
    // BODY TOUCHES OBJECTS: every spirit near your palm is blasted
    for (let i = spirits.length - 1; i >= 0; i--) {
      if (spirits[i].hitByCircle(info.palm.x, info.palm.y, 170)) killSpirit(i);
    }
  }
}

function killSpirit(i) {
  let s = spirits[i];
  score += 10;
  kills++;
  burst(s.x, s.y, s.col, 18);
  playSfx("pop");
  spirits.splice(i, 1); // REMOVE object: the spirit is dead
}

function burst(x, y, col, n) {
  for (let i = 0; i < n; i++) particles.push(new Particle(x, y, col));
}

// Update + draw + remove dead objects from an array of effects
function runList(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    arr[i].update();
    arr[i].show();
    if (arr[i].isDead()) arr.splice(i, 1);
  }
}

// Leave the game and go back to the title screen
function exitToMenu() {
  spirits = [];
  particles = [];
  fxs = [];
  state = "start";
  stateTimer = 0;
}
