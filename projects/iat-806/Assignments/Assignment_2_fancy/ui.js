// ui.js - backdrop, HUD and all the screens (start, intro, game over, win)

// ---------- Drawing: backdrop + HUD ----------
function drawBackdrop() {
  background(10, 5, 30);
  // webcam, dimmed so the effects pop
  tint(255, 150);
  image(video, 0, 0, width, height);
  noTint();
  noStroke();
  fill(15, 5, 40, 150);
  rect(0, 0, width, height);
}

function drawDangerLine() {
  stroke(255, 40, 60, 200);
  strokeWeight(3);
  drawingContext.setLineDash([14, 10]);
  line(0, dangerY(), width, dangerY());
  drawingContext.setLineDash([]);
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

  // level + progress bar
  textAlign(CENTER, TOP);
  fill(255);
  textSize(24);
  text("LEVEL " + level + " - " + L.name.toUpperCase(), width / 2, 12);
  fill(0, 150);
  rect(width / 2 - 150, 46, 300, 14, 7);
  fill(190, 130, 255);
  rect(width / 2 - 150, 46, 300 * constrain(kills / L.goal, 0, 1), 14, 7);

  // combo
  if (combo > 1 && frameCount - lastKillFrame < 90) {
    fill(120, 255, 255);
    textSize(30);
    text("COMBO x" + min(combo, 5), width / 2, 70);
  }

  // technique bar at the bottom
  let slotW = 220;
  let startX = (width - slotW * 4) / 2;
  for (let i = 0; i < GESTURE_ORDER.length; i++) {
    let g = GESTURE_ORDER[i];
    let x = startX + i * slotW + 5;
    let y = height - 85;
    let unlocked = L.unlock.includes(g);
    let ready = constrain((millis() - lastUsed[g]) / COOLDOWN[g], 0, 1);

    fill(0, 170);
    rect(x, y, slotW - 10, 70, 10);
    if (unlocked) {
      let c = gestureColor(g);
      fill(red(c), green(c), blue(c), 140);
      rect(x, y + 60, (slotW - 10) * ready, 10, 5);
      fill(255);
      textSize(24);
      textAlign(CENTER, CENTER);
      text(GESTURE_INFO[g].label, x + (slotW - 10) / 2, y + 22);
      textSize(16);
      text(GESTURE_INFO[g].tech, x + (slotW - 10) / 2, y + 44);
    } else {
      fill(120);
      textSize(18);
      textAlign(CENTER, CENTER);
      text("LOCKED", x + (slotW - 10) / 2, y + 35);
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

// Hold PALM (or press SPACE) to continue on menu screens
function menuHold(delay) {
  let palmUp = handInfo.some((h) => h.gesture === "palm");
  if (palmUp && stateTimer > delay) holdFrames++;
  else holdFrames = max(0, holdFrames - 3);

  // progress ring
  noFill();
  stroke(255, 60);
  strokeWeight(10);
  circle(width / 2, height - 130, 90);
  stroke(190, 130, 255);
  arc(width / 2, height - 130, 90, 90, -HALF_PI, -HALF_PI + TWO_PI * (holdFrames / 90));
  noStroke();

  if (holdFrames >= 90) {
    holdFrames = 0;
    resetGame();
  }
}

function drawStart() {
  dim(150);
  bigText("JUTSU DOJO", 130, 120, color(190, 130, 255));
  bigText("Cursed spirits are coming. Use your hand signs.", 215, 30, color(255));

  // technique guide
  let y = 290;
  for (let g of GESTURE_ORDER) {
    textAlign(LEFT, CENTER);
    textSize(30);
    fill(gestureColor(g));
    text(GESTURE_INFO[g].label, 250, y);
    fill(255);
    textSize(24);
    text("= " + GESTURE_INFO[g].tech, 380, y);
    y += 50;
  }

  fill(255, 220);
  textAlign(CENTER, CENTER);
  textSize(22);
  text("Techniques fire when you CHANGE into the pose. Flick between signs!", width / 2, 510);
  text("Click once to enable sound. 3 lives. 3 levels.", width / 2, 545);

  bigText("HOLD AN OPEN PALM  (or press SPACE)", height - 60, 30, color(255, 240, 120));
  menuHold(10);
}

function drawIntro() {
  dim(170);
  let L = LEVELS[level - 1];
  bigText("LEVEL " + level, height / 2 - 100, 110, color(255, 240, 120));
  bigText(L.name.toUpperCase(), height / 2 - 20, 44, color(255));
  bigText("Defeat " + L.goal + " spirits", height / 2 + 35, 30, color(190, 130, 255));

  // which techniques are new this level?
  let fresh = L.unlock.filter((g) => level === 1 || !LEVELS[level - 2].unlock.includes(g));
  if (level > 1) {
    bigText("NEW TECHNIQUE: " + fresh.map((g) => GESTURE_INFO[g].label + " (" + GESTURE_INFO[g].tech + ")").join(", "),
            height / 2 + 95, 28, color(120, 255, 255));
  } else {
    bigText("Try: POINT to shoot, FIST to punch", height / 2 + 95, 28, color(120, 255, 255));
  }

  if (stateTimer > 170) {
    state = "playing";
    stateTimer = 0;
    lastKillFrame = -999;
  }
}

function drawGameOver() {
  dim(180);
  bigText("YOU'VE BEEN CURSED", height / 2 - 110, 90, color(255, 60, 80));
  bigText("SCORE " + score, height / 2 - 20, 56, color(255));
  bigText("Reached level " + level, height / 2 + 35, 30, color(190, 130, 255));
  bigText("HOLD AN OPEN PALM TO TRY AGAIN  (or SPACE)", height - 60, 28, color(255, 240, 120));
  menuHold(60);
}

function drawWin() {
  dim(150);
  if (frameCount % 6 === 0) burst(random(width), random(height / 2), color(random(255), random(255), 255), 8);
  runList(particles);
  bigText("EXORCISM COMPLETE!", height / 2 - 100, 90, color(120, 255, 200));
  bigText("FINAL SCORE " + score, height / 2 - 10, 60, color(255));
  bigText("You are the strongest sorcerer.", height / 2 + 50, 28, color(190, 130, 255));
  bigText("HOLD AN OPEN PALM TO PLAY AGAIN  (or SPACE)", height - 60, 28, color(255, 240, 120));
  menuHold(90);
}


// ---------- Exit button ----------
// Small button in the top-right corner (under the lives). Also: press ESC.
const EXIT_BTN = { x: 850, y: 62, w: 95, h: 34 };

function drawExitButton() {
  let b = EXIT_BTN;
  let hover = exitButtonHit();
  noStroke();
  fill(hover ? color(255, 70, 90) : color(0, 0, 0, 170));
  rect(b.x, b.y, b.w, b.h, 8);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("✕ EXIT", b.x + b.w / 2, b.y + b.h / 2 + 1);
}

function exitButtonHit() {
  let b = EXIT_BTN;
  return mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;
}
