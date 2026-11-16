// ui.js - backdrop, HUD and the screens (start, intro, game over, win)

function drawBackdrop() {
  background(10, 5, 30);
  tint(255, 150); // dim the webcam so the effects pop
  image(video, 0, 0, width, height);
  noTint();
  noStroke();
  fill(15, 5, 40, 150);
  rect(0, 0, width, height);
}

function drawDangerLine() {
  stroke(255, 40, 60, 200);
  strokeWeight(3);
  line(0, dangerY(), width, dangerY());
}

function drawHUD() {
  let L = LEVELS[level - 1];
  noStroke();

  // score
  fill(255);
  textAlign(LEFT, TOP);
  textSize(34);
  text("SCORE " + score, 20, 14);

  // lives
  textAlign(RIGHT, TOP);
  fill(255, 70, 90);
  text("♥".repeat(max(lives, 0)), width - 20, 14);

  // level name + progress bar
  textAlign(CENTER, TOP);
  fill(255);
  textSize(24);
  text("LEVEL " + level + " - " + L.name.toUpperCase(), width / 2, 12);
  fill(0, 150);
  rect(width / 2 - 150, 46, 300, 14, 7);
  fill(190, 130, 255);
  rect(width / 2 - 150, 46, 300 * constrain(kills / L.goal, 0, 1), 14, 7);

  // technique bar at the bottom (shows cooldowns)
  let slotW = 260;
  let startX = (width - slotW * GESTURE_ORDER.length) / 2;
  for (let i = 0; i < GESTURE_ORDER.length; i++) {
    let g = GESTURE_ORDER[i];
    let x = startX + i * slotW + 5;
    let y = height - 85;
    let w = slotW - 10;

    fill(0, 170);
    rect(x, y, w, 70, 10);
    textAlign(CENTER, CENTER);

    if (L.unlock.includes(g)) {
      let ready = constrain((millis() - lastUsed[g]) / COOLDOWN[g], 0, 1);
      let c = gestureColor(g);
      fill(red(c), green(c), blue(c), 140);
      rect(x, y + 60, w * ready, 10, 5);
      fill(255);
      textSize(24);
      text(GESTURE_INFO[g].label, x + w / 2, y + 22);
      textSize(16);
      text(GESTURE_INFO[g].tech, x + w / 2, y + 44);
    } else {
      fill(120);
      textSize(18);
      text("LOCKED", x + w / 2, y + 35);
    }
  }
}

// ---------- Screens ----------
function dim(a) {
  noStroke();
  fill(5, 0, 20, a);
  rect(0, 0, width, height);
}

function bigText(str, y, size, col) {
  textAlign(CENTER, CENTER);
  textSize(size);
  stroke(0);
  strokeWeight(6);
  fill(col);
  text(str, width / 2, y);
  noStroke();
}

// Show an open PALM (or press SPACE) to continue on menu screens
function menuStart(delay) {
  let palmUp = handInfo.some((h) => h.gesture === "palm");
  if (palmUp && stateTimer > delay) resetGame();
}

function drawStart() {
  dim(150);
  bigText("JUTSU DOJO", 130, 120, color(190, 130, 255));
  bigText(
    "Cursed spirits are coming. Use your hand signs.",
    215,
    30,
    color(255),
  );

  // technique guide
  let y = 300;
  for (let g of GESTURE_ORDER) {
    textAlign(LEFT, CENTER);
    textSize(30);
    fill(gestureColor(g));
    text(GESTURE_INFO[g].label, 300, y);
    fill(255);
    textSize(24);
    text("= " + GESTURE_INFO[g].tech, 430, y);
    y += 50;
  }

  fill(255, 220);
  textAlign(CENTER, CENTER);
  textSize(22);
  text(
    "A technique fires when you CHANGE into the pose. Flick between signs!",
    width / 2,
    490,
  );
  text("Click once to turn on sound. 3 lives. 3 levels.", width / 2, 525);

  bigText(
    "SHOW AN OPEN PALM  (or press SPACE)",
    height - 60,
    30,
    color(255, 240, 120),
  );
  menuStart(10);
}

function drawIntro() {
  dim(170);
  let L = LEVELS[level - 1];
  bigText("LEVEL " + level, height / 2 - 100, 110, color(255, 240, 120));
  bigText(L.name.toUpperCase(), height / 2 - 20, 44, color(255));
  bigText(
    "Defeat " + L.goal + " spirits",
    height / 2 + 35,
    30,
    color(190, 130, 255),
  );
  bigText(
    "Techniques: " + L.unlock.map((g) => GESTURE_INFO[g].label).join(", "),
    height / 2 + 95,
    28,
    color(120, 255, 255),
  );

  if (stateTimer > 170) {
    state = "playing";
    stateTimer = 0;
  }
}

function drawGameOver() {
  dim(180);
  bigText("YOU'VE BEEN CURSED", height / 2 - 110, 90, color(255, 60, 80));
  bigText("SCORE " + score, height / 2 - 20, 56, color(255));
  bigText("Reached level " + level, height / 2 + 35, 30, color(190, 130, 255));
  bigText(
    "SHOW AN OPEN PALM TO TRY AGAIN  (or SPACE)",
    height - 60,
    28,
    color(255, 240, 120),
  );
  menuStart(60);
}

function drawWin() {
  dim(150);
  if (frameCount % 6 === 0)
    burst(
      random(width),
      random(height / 2),
      color(random(255), random(255), 255),
      8,
    );
  bigText("EXORCISM COMPLETE!", height / 2 - 100, 90, color(120, 255, 200));
  bigText("FINAL SCORE " + score, height / 2 - 10, 60, color(255));
  bigText(
    "You are the strongest sorcerer.",
    height / 2 + 50,
    28,
    color(190, 130, 255),
  );
  bigText(
    "SHOW AN OPEN PALM TO PLAY AGAIN  (or SPACE)",
    height - 60,
    28,
    color(255, 240, 120),
  );
  menuStart(90);
}

// ---------- Exit button (top-right, under the lives). ESC does the same. ----------
const EXIT_BTN = { x: 850, y: 62, w: 95, h: 34 };

function exitButtonHit() {
  let b = EXIT_BTN;
  return (
    mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h
  );
}

function drawExitButton() {
  let b = EXIT_BTN;
  noStroke();
  fill(exitButtonHit() ? color(255, 70, 90) : color(0, 0, 0, 170));
  rect(b.x, b.y, b.w, b.h, 8);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("✕ EXIT", b.x + b.w / 2, b.y + b.h / 2 + 1);
}
