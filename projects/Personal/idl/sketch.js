// =====================================================================
//  INTERNATIONAL DATE LINE  (v3)
//  p5.js + p5.sound + ml5.js 0.12.2 (COCO-SSD object detection)
//  The seal plushie is detected as a "teddy bear".
//
//  Flow:  title -> board (seals take their seats) -> game (catch the
//         autumn leaves) -> two seals on a motorcycle pull the date line
//         across -> notebook card pops out -> "SEAL OF APPROVAL" stamp
// =====================================================================

// ================= EDIT THESE =================
const HIS_NAME = "Xander"; // his name ("" to skip)
const MY_NAME = "Curie"; // your name for the sign-off ("" to skip)
const SONG_FILE = "last-leaves-of-autumn.mp3"; // put your audio file next to index.html
const SEAT_HIS = "23D"; // window seat
const SEAT_MINE = "23C"; // aisle seat
const FLIGHT = "907";
const FROM_CITY = "ROME";
const TO_CITY = "TORONTO";
const DURATION = "9H 55M";
const HOLD_MS = 2000; // how long both seals must stay in view
const MIN_CONFIDENCE = 0.25; // lower = detects more easily, but more false alarms
const GAME_TARGET = 8; // leaves to catch in the mini-game
const SWEEP_MS = 7000; // how long the motorcycle takes to cross the screen
const LOVE_LINE = "I love you mostest."; // the last line on the notebook after he says yes
const SECRET_PHRASE = "I love you angel";
const PHRASE_HINT = "three little words, then your nickname"; // "" to hide the hint
// ==============================================

// timings for the question screen (ms after the motorcycle starts)
const POP_AT = SWEEP_MS + 300; // card pops out
const WORDS_AT = POP_AT + 800; // "Will you be my boyfriend?" starts appearing
const BTN_AT = WORDS_AT + 1700; // buttons fade in

p5.disableFriendlyErrors = true;

// virtual scene size (everything is scaled to fit the window)
const W = 1000,
  H = 700;

// layout: her seat, his seat, then the window beside his seat
const HER_X = 140,
  HIS_X = 320,
  SEAT_TOP = 285;
const WIN = { x: 450, y: 190, w: 120, h: 210 };

// the brown paper notebook card
const NB = { x: 590, y: 80, w: 370, h: 540 };
const HAND_FONT = "Caveat, 'Comic Sans MS', cursive";
const PEN_BLACK = "#141318"; // the black ink for the title
const PEN = "#26232f"; // the ink for the other writing

// pastel palette
const INK = "#5b4b8a";
const TODAY_TOP = "#cdb9f2",
  TODAY_BOTTOM = "#ffd9c2";
const TOM_TOP = "#ffc7dc",
  TOM_BOTTOM = "#fff0b8";
const LEAF_COLS = ["#ffb48a", "#ffcf9f", "#f9a8b8", "#ffe08a", "#e8a87c"];
const HEART_COLS = ["#ff9ebd", "#ffc2d9", "#d9b8ff", "#ffd9a8"];
const SEAL_COL = "#ffffff",
  SEAL_LINE = "#d8cff0",
  BELLY_COL = "#f1eefb";
const CRACKER_COLS = ["#f2d29b", "#eec68a", "#f7dfb0", "#e9b97a"];

// state
let detector, song, video;
let songOK = false,
  modelReady = false,
  videoStarted = false,
  detecting = false;
let audioReady = false,
  songStarted = false;
let osc, env, osc2, env2;
let detections = [],
  sealXs = [],
  lastSealSeen = 0;
let phase = "title"; // "title" -> "board" -> "game" -> "question"
let p1 = 0,
  p2 = 0; // how "present" each seal is (0..1, smoothed): p1 = his, p2 = hers
let manual1 = false,
  manual2 = false; // keyboard fallback
let bothSince = 0,
  dinged2 = false,
  panVal = -1;
let gameScore = 0,
  gameLeaves = [],
  lastSpawn = 0,
  sealX = 0;
let questionStart = 0,
  popFired = false,
  answered = false,
  answerKind = "",
  answeredAt = 0,
  stampHit = false,
  stampHitAt = 0;
let showCam = true;
let sc = 1,
  ox = 0,
  oy = 0,
  shakeX = 0,
  shakeY = 0;

let seal1Set = false,
  seal2Set = false,
  typed = "",
  wrongAt = -9999;

let windowLeaves = [],
  windowClouds = [],
  screenLeaves = [],
  bgClouds = [],
  hearts = [],
  paperSpecks = [];

const btnYes = { x: 620, y: 365, w: 310, h: 62, label: "Yes", size: 36 };
const btnObv = {
  x: 620,
  y: 445,
  w: 310,
  h: 62,
  label: "Obviously yes",
  size: 36,
};
const noBtn = {
  x: 610,
  y: 530,
  w: 170,
  h: 42,
  label: "Emergency exit",
  size: 22,
};

// ---------------------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Fredoka, 'Trebuchet MS', sans-serif");

  // load the song (the sketch still runs if this fails)
  song = loadSound(
    SONG_FILE,
    () => {
      songOK = true;
    },
    () => {
      console.warn("Couldn't load " + SONG_FILE + " - running without music.");
    },
  );

  // load the object detector (needs internet the first time)
  detector = ml5.objectDetector("cocossd", () => {
    modelReady = true;
    maybeStartDetection();
  });

  // little "ding" / "blip" sound, and a low "thump" for the stamp
  env = new p5.Envelope();
  env.setADSR(0.01, 0.15, 0, 0.35);
  env.setRange(0.3, 0);
  osc = new p5.Oscillator("sine");
  osc.amp(env);

  env2 = new p5.Envelope();
  env2.setADSR(0.001, 0.12, 0, 0.15);
  env2.setRange(0.9, 0);
  osc2 = new p5.Oscillator("sine");
  osc2.amp(env2);
  osc2.freq(70);

  for (let i = 0; i < 12; i++)
    windowLeaves.push(makeLeaf(WIN.w, WIN.h, 6, 11, -1.4, -0.4, 0.2, 0.8));
  for (let i = 0; i < 4; i++)
    windowClouds.push({
      x: random(WIN.w),
      y: random(20, WIN.h - 40),
      s: random(0.35, 0.55),
      v: random(0.15, 0.35),
    });

  // little flecks on the brown paper
  for (let i = 0; i < 90; i++)
    paperSpecks.push({
      x: random(NB.x + 6, NB.x + NB.w - 6),
      y: random(NB.y + 6, NB.y + NB.h - 6),
      r: random(0.5, 1.5),
      a: random(25, 60),
    });

  rebuildScreenStuff();
}

function rebuildScreenStuff() {
  screenLeaves = [];
  for (let i = 0; i < 28; i++)
    screenLeaves.push(makeLeaf(width, height, 9, 20, -0.5, 0.5, 0.8, 2));
  bgClouds = [];
  for (let i = 0; i < 7; i++)
    bgClouds.push({
      x: random(width),
      y: random(height * 0.08, height * 0.85),
      s: random(1, 2.2),
      v: random(0.15, 0.5),
    });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  rebuildScreenStuff();
}

function draw() {
  sc = min(width / W, height / H);
  ox = (width - W * sc) / 2;
  oy = (height - H * sc) / 2;
  shakeX = 0;
  shakeY = 0;
  textStyle(NORMAL);
  if (phase === "title") drawTitle();
  else if (phase === "board") drawBoard();
  else if (phase === "game") drawGame();
  else drawQuestion();
}

// ---------------------------------------------------------------------
//  Starting / detection / audio
// ---------------------------------------------------------------------
function startExperience() {
  userStartAudio(); // browsers need a click before any sound
  audioReady = true;
  osc.start();
  osc2.start();
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  videoStarted = true;
  phase = "board";
  maybeStartDetection();
}

function maybeStartDetection() {
  if (videoStarted && modelReady && !detecting) {
    detecting = true;
    detectLoop();
  }
}

function detectLoop() {
  if (!detecting) return;
  detector.detect(video, (err, results) => {
    if (err) {
      console.error(err);
      setTimeout(detectLoop, 500);
      return;
    }
    if (results) detections = results;
    detectLoop();
  });
}

// finds the seals ("teddy bears") in the latest detection.
// sealXs = their horizontal positions (0 = left, 1 = right, mirrored like a selfie)
function readSeals() {
  const vw = (video && video.elt && video.elt.videoWidth) || 640;
  const bears = (detections || []).filter(
    (d) => d.label === "teddy bear" && d.confidence >= MIN_CONFIDENCE,
  );
  const centers = [];
  for (const d of bears) {
    const cx = d.x + d.width / 2,
      cy = d.y + d.height / 2;
    if (centers.every((c) => dist(c.x, c.y, cx, cy) > vw * 0.12))
      centers.push({ x: cx, y: cy });
  }
  sealXs = centers.map((c) => 1 - c.x / vw);
  if (centers.length) lastSealSeen = millis();
  return centers.length;
}

function updateBoard() {
  const n = readSeals();
  // seal 1 is recognised once, then it stays seated
  if (!seal1Set && (n >= 1 || manual1)) seal1Set = true;
  p1 += ((seal1Set ? 1 : 0) - p1) * 0.1;
  p2 += ((seal2Set ? 1 : 0) - p2) * 0.1;

  updateAudio();

  // both seals seated for a moment -> the mini-game
  if (p1 > 0.7 && p2 > 0.7) {
    if (!bothSince) bothSince = millis();
    if (millis() - bothSince > HOLD_MS) goGame();
  } else {
    bothSince = 0;
  }
}

function updateAudio() {
  if (!songOK) return;
  // song starts in the LEFT ear when his seal sits down...
  if (p1 > 0.7 && !songStarted) {
    songStarted = true;
    song.setVolume(0.9);
    song.pan(-1);
    song.loop();
  }
  // ...and opens up to both ears when the second seal arrives
  if (songStarted) {
    const target = p2 > 0.7 ? 0 : -1;
    panVal = lerp(panVal, target, 0.03);
    song.pan(panVal);
  }
}

function goGame() {
  phase = "game";
  p1 = 1;
  p2 = 1;
  gameScore = 0;
  gameLeaves = [];
  lastSpawn = millis();
  sealX = width / 2;
  ding();
}

function goQuestion() {
  phase = "question";
  questionStart = millis();
  popFired = false;
  stampHit = false;
  detecting = false; // stops the detection loop
}

function blip(freq) {
  if (!audioReady) return;
  osc.freq(freq);
  env.play();
}
function ding() {
  blip(1318);
  setTimeout(() => blip(988), 220);
}
function thump() {
  if (!audioReady) return;
  env2.play();
}

// ---------------------------------------------------------------------
//  Screens
// ---------------------------------------------------------------------
function drawTitle() {
  skyGradient(TODAY_TOP, TODAY_BOTTOM);
  noStroke();
  fill(255, 255, 255, 170);
  for (const c of bgClouds) {
    c.x += c.v;
    if (c.x > width + 120) c.x = -120;
    drawCloud(c.x, c.y, c.s * 1.4);
  }

  inScene(() => {
    // paper plane
    push();
    translate(500, 70 + sin(frameCount * 0.04) * 6);
    rotate(-0.12);
    noStroke();
    fill(255);
    triangle(44, 0, -30, -18, -16, 0);
    fill("#e9defa");
    triangle(44, 0, -30, 18, -16, 0);
    pop();

    noStroke();
    fill(INK);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(62);
    text("International Date Line", 500, 210);

    // boarding pass (his ticket)
    fill(255, 255, 255, 245);
    rect(180, 290, 640, 250, 30);
    stroke("#d9ccf5");
    strokeWeight(3);
    drawingContext.setLineDash([8, 10]);
    line(640, 312, 640, 518);
    drawingContext.setLineDash([]);
    noStroke();

    textAlign(LEFT, CENTER);
    fill("#a08cd0");
    textStyle(BOLD);
    textSize(16);
    text("BOARDING PASS", 215, 325);
    fill(INK);
    textSize(40);
    text(FROM_CITY + "  \u2192  " + TO_CITY, 215, 385);
    textStyle(NORMAL);
    textSize(22);
    text("FLIGHT " + FLIGHT + "   \u00b7   " + DURATION, 215, 445);
    textSize(18);
    fill("#8b79b8");
    text(
      HIS_NAME ? "PASSENGER: X" : "left side \u00b7 window & aisle",
      215,
      490,
    );

    textAlign(CENTER, CENTER);
    fill("#a08cd0");
    textStyle(BOLD);
    textSize(16);
    text("SEAT", 730, 335);
    fill(INK);
    textSize(64);
    text(SEAT_HIS, 730, 410);
    textStyle(NORMAL);
    textSize(18);
    fill("#8b79b8");
    text("window", 730, 475);

    // tap button
    const pulse = 1 + sin(frameCount * 0.08) * 0.03;
    push();
    translate(500, 625);
    scale(pulse);
    fill("#ff9ebd");
    rect(-130, -34, 260, 68, 34);
    fill(255);
    textStyle(BOLD);
    textSize(26);
    text("Tap to board", 0, 2);
    pop();
  });
  cursor(HAND);
}

function drawBoard() {
  updateBoard();
  skyGradient(TODAY_TOP, TODAY_BOTTOM);
  noStroke();
  fill(255, 255, 255, 150);
  for (const c of bgClouds) {
    c.x += c.v;
    if (c.x > width + 120) c.x = -120;
    drawCloud(c.x, c.y, c.s * 1.4);
  }

  inScene(() => {
    drawCabin(false);
    drawCaption();
  });
  drawCamPreview();
  cursor(ARROW);
}

// ---- mini-game: catch the autumn leaves with your seal ----
function updateGame() {
  readSeals();
  let target;
  if (sealXs.length && millis() - lastSealSeen < 800) {
    const avg = sealXs.reduce((a, b) => a + b, 0) / sealXs.length;
    target = map(avg, 0.1, 0.9, width * 0.06, width * 0.94, true);
  } else {
    target = mouseX > 0 ? mouseX : width / 2; // fallback: use the mouse
  }
  sealX = lerp(sealX, target, 0.2);

  if (millis() - lastSpawn > 650) {
    lastSpawn = millis();
    gameLeaves.push({
      x: random(width * 0.06, width * 0.94),
      y: -30,
      s: random(13, 19),
      rot: random(TWO_PI),
      vr: random(-0.05, 0.05),
      vx: random(-0.4, 0.4),
      vy: random(2.2, 3.2) * sc,
      col: random(CRACKER_COLS),
    });
  }

  const k = 0.6 * sc;
  const sealY = height - 103 * k - 12;
  for (let i = gameLeaves.length - 1; i >= 0; i--) {
    const l = gameLeaves[i];
    l.x += l.vx;
    l.y += l.vy;
    l.rot += l.vr;
    const caught =
      abs(l.x - sealX) < 56 * k + 28 &&
      l.y > sealY - 75 * k &&
      l.y < sealY + 25 * k;
    if (caught) {
      gameLeaves.splice(i, 1);
      gameScore++;
      blip(1568);
      for (let j = 0; j < 5; j++) hearts.push(sparkHeart(l.x, l.y));
      continue;
    }
    if (l.y > height + 40) gameLeaves.splice(i, 1);
  }
  if (gameScore >= GAME_TARGET) goQuestion();
}

function drawGame() {
  updateGame();
  updateAudio();
  // a little "turbulence" wobble
  shakeX = (noise(frameCount * 0.3) - 0.5) * 5;
  shakeY = (noise(frameCount * 0.3 + 50) - 0.5) * 5;

  skyGradient(TODAY_TOP, TODAY_BOTTOM);
  noStroke();
  fill(255, 255, 255, 150);
  for (const c of bgClouds) {
    c.x += c.v;
    if (c.x > width + 120) c.x = -120;
    drawCloud(c.x, c.y, c.s * 1.4);
  }

  inScene(() => {
    drawCabin(false);
    drawGameCaption();
  });

  for (const l of gameLeaves) drawCracker(l);
  const k = 0.6 * sc;
  drawSeal(sealX, height - 103 * k - 12, k, false);
  drawHearts();
  drawCamPreview();
  cursor(ARROW);
}

function drawGameCaption() {
  push();
  textAlign(CENTER, CENTER);
  noStroke();
  fill(INK);
  textStyle(BOLD);
  textSize(32);
  text("Turbulence!", 775, 200);
  textStyle(NORMAL);
  textSize(21);
  textLeading(28);
  text(
    "Move your seal left and right to catch the rice crackers.",
    605,
    255,
    340,
    110,
  );
  // cracker counter
  for (let i = 0; i < GAME_TARGET; i++) {
    const x = 775 - (GAME_TARGET * 38) / 2 + 19 + i * 38;
    if (i < gameScore) {
      drawCracker({
        x,
        y: 440,
        rot: -0.4,
        s: 13,
        col: CRACKER_COLS[i % CRACKER_COLS.length],
      });
    } else {
      noStroke();
      fill("#eadff9");
      circle(x, 440, 30);
    }
  }
  textSize(22);
  text(gameScore + " / " + GAME_TARGET, 775, 480);
  fill(INK + "88");
  textSize(14);
  text("no seal in view? use your mouse", 775, 520);
  pop();
}

// ---- the question ----
function drawQuestion() {
  const t = millis() - questionStart;
  const sweep = constrain(t / SWEEP_MS, 0, 1);
  const e = sweep < 0.5 ? 2 * sweep * sweep : 1 - pow(-2 * sweep + 2, 2) / 2;
  const lineX = e * width;

  // one-time moments
  if (t > POP_AT && !popFired) {
    popFired = true;
    ding();
    for (let i = 0; i < 30; i++) hearts.push(makeHeart(true));
  }
  const stampT = answered ? millis() - answeredAt - 250 : -1;
  if (answered && stampT >= 260 && !stampHit) {
    stampHit = true;
    stampHitAt = millis();
    thump();
    for (let i = 0; i < 60; i++) hearts.push(makeHeart(true));
  }
  const shake = stampHit ? 1 - (millis() - stampHitAt) / 450 : 0;
  if (shake > 0) {
    shakeX = random(-1, 1) * 10 * shake;
    shakeY = random(-1, 1) * 10 * shake;
  }

  // "today" sky, with "tomorrow" sky sweeping in from the left
  skyGradient(TODAY_TOP, TODAY_BOTTOM);
  skyGradient(TOM_TOP, TOM_BOTTOM, lineX);

  inScene(() => {
    drawCabin(true);
    if (sweep < 1) {
      noStroke();
      fill(INK);
      textAlign(CENTER, CENTER);
      textStyle(NORMAL);
      textSize(22);
      text("Crossing the International Date Line...", 500, 645);
    }
  });

  // soft pink glow on the tomorrow side
  noStroke();
  fill(255, 150, 190, 28);
  rect(0, 0, lineX, height);

  // the date line, pulled across the screen by two seals on a motorcycle
  if (sweep < 1) {
    const kb = 1.25 * sc; // motorcycle size
    const groundY = oy + 640 * sc; // the cabin floor
    const wheelY = groundY - 34 * kb;
    const bikeX = lineX + 122 * kb; // the bike's tail sits right on the line
    const tailY = wheelY - 16 * kb;
    push();
    drawingContext.setLineDash([10, 12]);
    stroke(255, 255, 255, 235);
    strokeWeight(4);
    line(lineX, 0, lineX, tailY);
    drawingContext.setLineDash([]);
    pop();
    drawMotorcycle(bikeX, groundY, kb, lineX / (34 * kb));
    if (frameCount % 4 === 0) hearts.push(sparkHeart(lineX, tailY)); // heart exhaust
  }

  // falling autumn leaves
  for (const l of screenLeaves) {
    stepLeaf(l, width, height);
    drawLeaf(l);
  }

  // the notebook pops out
  const popT = t - POP_AT;
  let hovering = false;
  if (popT > 0) {
    const pp = constrain(popT / 700, 0, 1);
    const m = mouseScene();
    inScene(() => {
      translate(775, 350);
      scale(max(easeOutBack(pp), 0.001));
      translate(-775, -350);
      drawingContext.globalAlpha = constrain(pp * 2, 0, 1);

      drawNotebook();
      textFont(HAND_FONT);
      noStroke();
      textAlign(CENTER, CENTER);

      // title in black ink
      fill(PEN_BLACK);
      textStyle(BOLD);
      textSize(18);
      text("INTERNATIONAL DATE LINE", 775, 118);

      if (!answered) {
        fill(PEN);
        textStyle(NORMAL);
        textSize(28);
        text(HIS_NAME ? HIS_NAME + "," : "Xander,", 775, 200);

        // "Will you be my boyfriend?" drifts in word by word
        const wt = t - WORDS_AT;
        if (wt > 0)
          drawReveal(
            ["Will you be", "my boyfriend?"],
            775,
            262,
            30,
            30,
            wt,
            260,
            450,
          );

        // buttons fade in afterwards
        const ba = constrain((t - BTN_AT) / 500, 0, 1);
        if (ba > 0) {
          drawingContext.globalAlpha = ba;
          if (ba >= 1) updateDodge(m);
          hovering = drawButton(btnYes, "#dcaebc", m) || hovering;
          hovering = drawButton(btnObv, "#d9c8fa", m) || hovering;
          hovering = drawButton(noBtn, "#ece6f7", m) || hovering;
          drawingContext.globalAlpha = 1;
        }
      } else {
        fill(PEN);
        textStyle(BOLD);
        textSize(30);
        textLeading(30);
        text(
          answerKind === "obv"
            ? "I knew it.\n(Obviously.)"
            : "Best flight ever.",
          610,
          140,
          330,
          100,
        );
        textStyle(NORMAL);
        textSize(22);
        textLeading(22);
        text(
          "  Now boarding for everything after...\n" + LOVE_LINE,
          610,
          240,
          330,
          100,
        );
        if (MY_NAME) {
          textAlign(RIGHT, CENTER);
          textSize(18);
          text("\u2013 " + MY_NAME, 925, 352);
        }
      }
      drawingContext.globalAlpha = 1;
    });
  }

  // the big stamp
  if (answered) inScene(() => drawStamp(775, 488, stampT));

  cursor(hovering ? HAND : ARROW);

  // hearts after he says yes
  if (stampHit && millis() - stampHitAt < 9000 && frameCount % 5 === 0)
    hearts.push(makeHeart(false));
  drawHearts();
}

// brown paper notebook with a spiral binding
function drawNotebook() {
  const { x, y, w, h } = NB;
  noStroke();
  fill(60, 40, 20, 60);
  rect(x + 8, y + 10, w, h, 6, 18, 18, 6); // soft shadow
  fill("#cfa56f");
  rect(x, y, w, h, 6, 18, 18, 6); // kraft paper

  for (const s of paperSpecks) {
    fill(90, 60, 30, s.a);
    circle(s.x, s.y, s.r * 2);
  }

  // stroke(110, 78, 42, 70); // ruled lines
  // strokeWeight(1.5);
  // for (let ly = y + 70; ly < y + h - 16; ly += 36)
  //   line(x + 24, ly, x + w - 14, ly);

  // stroke(190, 70, 70, 110); // margin line
  // strokeWeight(2);
  // line(x + 30, y + 14, x + 30, y + h - 14);

  // for (let sy = y + 30; sy < y + h - 10; sy += 36) {
  //   // spiral binding
  //   noStroke();
  //   fill("#6e4f2c");
  //   circle(x + 14, sy, 9);
  //   stroke("#4a4a55");
  //   strokeWeight(4);
  //   strokeCap(ROUND);
  //   line(x - 14, sy - 6, x + 17, sy + 2);
  //   stroke(225, 225, 235, 170);
  //   strokeWeight(1.5);
  //   line(x - 14, sy - 7, x + 17, sy + 1);
  // }
  // noStroke();
}

// two seals on a red and black motorcycle (facing right)
function drawMotorcycle(x, groundY, k, spin) {
  push();
  translate(x, groundY - 34 * k + sin(frameCount * 0.35) * 1.5 * k);
  scale(k);
  strokeCap(ROUND);

  // wheels
  for (const wx of [-70, 70]) {
    push();
    translate(wx, 0);
    noFill();
    stroke("#17171d");
    strokeWeight(10);
    circle(0, 0, 58);
    stroke("#e6e6ee");
    strokeWeight(2);
    circle(0, 0, 40);
    rotate(spin);
    stroke("#cfcfda");
    for (let i = 0; i < 3; i++) {
      line(-20, 0, 20, 0);
      rotate(PI / 3);
    }
    noStroke();
    fill("#9a9aa8");
    circle(0, 0, 9);
    pop();
  }

  // swing arm, fork, engine, exhaust, tail, seat
  stroke("#17171d");
  strokeWeight(9);
  line(-70, 0, -12, -26);
  strokeWeight(8);
  line(70, 0, 46, -80);
  noStroke();
  fill("#17171d");
  rect(-22, -42, 58, 34, 10);
  fill("#8a8a98");
  rect(-122, -22, 76, 12, 6);
  fill("#d6283e");
  rect(-100, -66, 50, 24, 12);
  fill("#17171d");
  rect(-82, -60, 70, 16, 8);

  // the two seals (hers has the bow)
  drawSeal(-48, -108, 0.42, true);
  drawSeal(2, -104, 0.42, false);

  // red tank in front of the seals, front fender, handlebar, headlight
  noStroke();
  fill("#d6283e");
  ellipse(14, -54, 84, 40);
  fill(255, 255, 255, 70);
  ellipse(2, -62, 34, 10);
  fill("#d6283e");
  rect(44, -38, 52, 10, 5);
  stroke("#17171d");
  strokeWeight(6);
  line(46, -80, 30, -94);
  noStroke();
  fill(255, 243, 196, 90);
  triangle(66, -74, 150, -98, 150, -50);
  fill("#fff3c4");
  stroke("#17171d");
  strokeWeight(3);
  circle(62, -74, 16);
  pop();
}

// words fade and slide up one after another
function drawReveal(lines, cx, y0, size, lineH, t, step, fade) {
  push();
  textStyle(BOLD);
  textSize(size);
  textAlign(LEFT, CENTER);
  noStroke();
  const space = textWidth(" ");
  let idx = 0;
  lines.forEach((line, li) => {
    const words = line.split(" ");
    const widths = words.map((w) => textWidth(w));
    const total =
      widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let x = cx - total / 2;
    words.forEach((w, wi) => {
      const a = constrain((t - idx * step) / fade, 0, 1);
      const eased = 1 - pow(1 - a, 3);
      if (a > 0) {
        fill(38, 35, 47, 255 * eased);
        text(w, x, y0 + li * lineH + (1 - eased) * 18);
      }
      x += widths[wi] + space;
      idx++;
    });
  });
  pop();
}

// "SEAL OF APPROVAL" stamp that slams down
function drawStamp(cx, cy, t) {
  if (t <= 0) return;
  const p = constrain(t / 260, 0, 1);
  const eased = 1 - pow(1 - p, 3);
  const s = lerp(3.4, 0.85, eased);
  const ink = "#d63a5a";
  push();
  translate(cx, cy);
  rotate(-0.2);
  scale(s);
  drawingContext.globalAlpha = constrain(p * 1.4, 0, 1) * 0.94;

  noFill();
  stroke(ink);
  strokeWeight(9);
  circle(0, 0, 290);
  strokeWeight(3);
  circle(0, 0, 258);

  noStroke();
  fill(ink);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(42);
  text("SEAL OF", 0, -76);
  textSize(44);
  text("APPROVAL", 0, -30);

  // little seal silhouette
  push();
  translate(0, 62);
  scale(0.5);
  noStroke();
  fill(ink);
  ellipse(0, 20, 112, 136);
  ellipse(-26, 92, 44, 22);
  ellipse(26, 92, 44, 22);
  push();
  translate(-54, 28);
  rotate(0.5);
  ellipse(0, 0, 26, 56);
  pop();
  push();
  translate(54, 28);
  rotate(-0.5);
  ellipse(0, 0, 26, 56);
  pop();
  ellipse(0, -46, 92, 78);
  noFill();
  stroke(255);
  strokeWeight(4);
  ellipse(0, 34, 62, 90);
  noStroke();
  fill(255);
  ellipse(-19, -54, 11, 13);
  ellipse(19, -54, 11, 13);
  pop();

  drawingContext.globalAlpha = 1;
  pop();
}

// ---------------------------------------------------------------------
//  The cabin: her seat, his seat, then the window
// ---------------------------------------------------------------------
function drawCabin(warm) {
  noStroke();
  fill("#fff7ef");
  rect(30, 20, 940, 660, 44); // cabin wall
  fill("#efe6fb");
  rect(30, 565, 940, 115, 0, 0, 44, 44); // floor
  fill("#e3d6f7");
  rect(590, 585, 350, 34, 17); // aisle carpet

  drawWindow(warm);

  drawSeat(HER_X, SEAT_TOP, SEAT_MINE, p2, true); // her seal (with the bow)
  drawSeat(HIS_X, SEAT_TOP, SEAT_HIS, p1, false); // his seal

  noStroke();
  fill("#cbb9f0");
  rect(213, 395, 34, 120, 14); // shared armrest
}

function drawWindow(warm) {
  const { x, y, w, h } = WIN;
  const ctx = drawingContext;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 60);
  else ctx.rect(x, y, w, h);
  ctx.clip();

  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, warm ? TOM_TOP : "#bfe3f5");
  g.addColorStop(1, warm ? TOM_BOTTOM : "#ffe6d6");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  push();
  translate(x, y);
  noStroke();
  fill(255, 255, 255, 215);
  for (const c of windowClouds) {
    c.x += c.v;
    if (c.x > w + 60) c.x = -60;
    drawCloud(c.x, c.y, c.s);
  }
  for (const l of windowLeaves) {
    stepLeaf(l, w, h);
    drawLeaf(l);
  }
  pop();
  ctx.restore();

  noFill();
  stroke("#f0e4ff");
  strokeWeight(14);
  rect(x, y, w, h, 60);
  noStroke();
}

function drawSeat(cx, top, label, p, bow) {
  noStroke();
  fill("#ddd0f7");
  rect(cx - 80, top, 160, 215, 44); // seat back
  fill("#e9dffb");
  rect(cx - 50, top - 24, 100, 66, 28); // headrest
  fill("#9a86cc");
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(16);
  text(label, cx, top + 8);

  if (p > 0.02) {
    // the seal sits in the seat
    const bob = p > 0.95 ? sin(frameCount * 0.05 + cx) * 3 : 0;
    drawSeal(cx, top + 140 + bob, easeOutBack(p) * 0.95, bow);
  }

  noStroke();
  fill("#c9b7f0");
  rect(cx - 80, top + 185, 160, 86, 30); // cushion (in front of the seal)
}

function drawSeal(x, y, s, bow) {
  push();
  translate(x, y);
  scale(s);
  stroke(SEAL_LINE);
  strokeWeight(2.5);
  fill(SEAL_COL);
  ellipse(0, 20, 112, 136); // body
  ellipse(-26, 92, 44, 22);
  ellipse(26, 92, 44, 22); // tail flippers
  noStroke();
  fill(BELLY_COL);
  ellipse(0, 32, 74, 100); // belly
  stroke(SEAL_LINE);
  strokeWeight(2.5);
  fill(SEAL_COL);
  push();
  translate(-54, 28);
  rotate(0.5);
  ellipse(0, 0, 26, 56);
  pop(); // front flippers
  push();
  translate(54, 28);
  rotate(-0.5);
  ellipse(0, 0, 26, 56);
  pop();
  ellipse(0, -46, 92, 78); // head
  noStroke();
  fill(BELLY_COL);
  ellipse(0, -34, 52, 34); // muzzle
  fill(255, 170, 190, 150);
  ellipse(-34, -38, 16, 10);
  ellipse(34, -38, 16, 10); // cheeks
  fill(60, 50, 90);
  ellipse(-19, -54, 10, 12);
  ellipse(19, -54, 10, 12); // eyes
  fill(255);
  ellipse(-17, -57, 3.5, 3.5);
  ellipse(21, -57, 3.5, 3.5);
  fill(70, 60, 95);
  ellipse(0, -42, 15, 10); // nose
  noFill();
  stroke(70, 60, 95);
  strokeWeight(1.6);
  arc(-5, -35, 10, 8, 0, PI);
  arc(5, -35, 10, 8, 0, PI); // little smile
  noStroke();
  if (bow) {
    // tiny bow so you can tell them apart
    fill("#ff9ebd");
    triangle(28, -80, 50, -94, 50, -66);
    triangle(28, -80, 6, -94, 6, -66);
    fill("#ff7aa6");
    circle(28, -80, 10);
  }
  pop();
}

// ---- typing the magic words to seat the second seal ----
function typingMode() {
  return phase === "board" && seal1Set && p1 > 0.9 && !seal2Set;
}

function normalizePhrase(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function checkPhrase(enterPressed) {
  if (normalizePhrase(typed) === normalizePhrase(SECRET_PHRASE))
    seatSecondSeal();
  else if (enterPressed) {
    wrongAt = millis();
    typed = "";
  }
}

function seatSecondSeal() {
  seal2Set = true;
  typed = "";
  ding();
}

function drawTypingBox() {
  const wrong = millis() - wrongAt < 1500;
  push();
  translate(wrong ? sin(millis() * 0.08) * 6 : 0, 0);
  fill(255, 255, 255, 235);
  stroke(wrong ? "#ff7aa6" : "#d9ccf5");
  strokeWeight(3);
  rect(605, 420, 340, 64, 32);
  noStroke();
  fill(INK);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(22);
  const caret = floor(millis() / 500) % 2 === 0 ? "|" : "";
  text(typed + caret, 775, 453);
  pop();

  noStroke();
  textAlign(CENTER, CENTER);
  fill(INK + "aa");
  textSize(15);
  text(PHRASE_HINT, 775, 505);
  if (wrong) {
    fill("#ff7aa6");
    textSize(18);
    text("Not quite... try again!", 775, 535);
  }
}

function drawCaption() {
  push();
  textAlign(CENTER, CENTER);
  noStroke();
  fill(INK);
  let l1, l2;
  if (p1 < 0.5) {
    l1 = "Now boarding";
    l2 = "Hold the seal up to the camera to find your seat.";
  } else if (!seal2Set) {
    l1 = SEAT_HIS + ", window seat";
    l2 =
      "Taken. But " +
      SEAT_MINE +
      ", on the aisle, is still empty. Type the magic words to call me to you.";
  } else {
    l1 = "Together at last";
    l2 = "Stay right there for a moment...";
  }
  textStyle(BOLD);
  textSize(32);
  textLeading(38);
  text(l1, 605, 190, 340, 80);
  textStyle(NORMAL);
  textSize(21);
  textLeading(28);
  text(l2, 605, 285, 340, 120);
  if (typingMode()) drawTypingBox();

  if (p1 > 0.7 && p2 > 0.7 && bothSince) {
    // progress ring
    const prog = constrain((millis() - bothSince) / HOLD_MS, 0, 1);
    noFill();
    strokeWeight(10);
    stroke("#e9defa");
    circle(775, 480, 80);
    stroke("#ff9ebd");
    strokeCap(ROUND);
    arc(775, 480, 80, 80, -HALF_PI, -HALF_PI + TWO_PI * prog);
  }

  noStroke();
  fill(INK + "55");
  textSize(13); // tiny keyboard hints (delete this line to hide)
  text(
    "keys: 1 = seat seal 1 \u00b7 C = camera \u00b7 Q = skip \u00b7 Tab = skip the phrase",
    775,
    655,
  );
  pop();
}

function drawCamPreview() {
  if (!video || !showCam) return;
  const pw = 200,
    ph = 150,
    px = 16,
    py = height - ph - 16;
  push();
  translate(px + pw, py);
  scale(-1, 1); // mirror it, like a selfie
  image(video, 0, 0, pw, ph);
  noFill();
  stroke(255, 158, 189);
  strokeWeight(2);
  const vw = video.elt.videoWidth || 640,
    vh = video.elt.videoHeight || 480;
  for (const d of detections || []) {
    if (d.label === "teddy bear" && d.confidence >= MIN_CONFIDENCE) {
      rect(
        (d.x * pw) / vw,
        (d.y * ph) / vh,
        (d.width * pw) / vw,
        (d.height * ph) / vh,
      );
    }
  }
  pop();
  noFill();
  stroke(255);
  strokeWeight(3);
  rect(px, py, pw, ph, 12);
  noStroke();
}

// ---------------------------------------------------------------------
//  Input
// ---------------------------------------------------------------------
function mousePressed() {
  if (phase === "title") {
    startExperience();
    return;
  }
  if (
    phase === "question" &&
    !answered &&
    millis() - questionStart > BTN_AT + 500
  ) {
    const m = mouseScene();
    if (hit(btnYes, m)) answer("yes");
    else if (hit(btnObv, m)) answer("obv");
    else if (hit(noBtn, m)) dodge();
  }
}

function keyPressed() {
  // while he's typing the phrase, keys go to the text box
  if (phase === "board" && typingMode()) {
    if (keyCode === BACKSPACE) {
      typed = typed.slice(0, -1);
      return false;
    }
    if (keyCode === ENTER) {
      checkPhrase(true);
      return false;
    }
    if (keyCode === TAB) {
      seatSecondSeal(); // backup so you're never stuck
      return false;
    }
    return; // letters are handled in keyTyped()
  }

  if (key === "c" || key === "C") showCam = !showCam;
  if (phase === "board") {
    if (key === "1") manual1 = !manual1;
    if (key === "q" || key === "Q") goGame();
  } else if (phase === "game") {
    if (key === "q" || key === "Q") goQuestion();
  }
}

function keyTyped() {
  if (typingMode()) {
    if (key.length === 1 && typed.length < 28) {
      typed += key;
      checkPhrase(false);
    }
    return false;
  }
}

function answer(kind) {
  answered = true;
  answerKind = kind;
  answeredAt = millis();
  blip(1318);
}

function updateDodge(m) {
  // the "Emergency exit" button runs away
  if (answered) return;
  const cx = noBtn.x + noBtn.w / 2,
    cy = noBtn.y + noBtn.h / 2;
  if (dist(m.x, m.y, cx, cy) < 95) dodge();
}
function dodge() {
  noBtn.x = noBtn.x < 700 ? 770 : 610;
  noBtn.y = random(528, 540);
}

// ---------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------
function inScene(fn) {
  push();
  translate(ox + shakeX, oy + shakeY);
  scale(sc);
  fn();
  pop();
}
function mouseScene() {
  return { x: (mouseX - ox) / sc, y: (mouseY - oy) / sc };
}
function hit(b, m) {
  return m.x > b.x && m.x < b.x + b.w && m.y > b.y && m.y < b.y + b.h;
}

function drawButton(b, col, m) {
  const hover = hit(b, m);
  const e = hover ? 4 : 0;
  push();
  noStroke();
  fill(col);
  rect(b.x - e, b.y - e, b.w + 2 * e, b.h + 2 * e, (b.h + 2 * e) / 2);
  fill(INK);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(b.size || 26);
  text(b.label, b.x + b.w / 2, b.y + b.h / 2 + 2);
  pop();
  return hover;
}

function skyGradient(c1, c2, clipX) {
  const ctx = drawingContext;
  ctx.save();
  if (clipX !== undefined) {
    ctx.beginPath();
    ctx.rect(0, 0, clipX, height);
    ctx.clip();
  }
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawCloud(x, y, s) {
  ellipse(x, y, 90 * s, 46 * s);
  ellipse(x - 26 * s, y + 6 * s, 60 * s, 38 * s);
  ellipse(x + 28 * s, y + 8 * s, 64 * s, 36 * s);
  ellipse(x + 6 * s, y - 14 * s, 50 * s, 40 * s);
}

function makeLeaf(w, h, smin, smax, vxmin, vxmax, vymin, vymax) {
  return {
    x: random(w),
    y: random(-h * 0.2, h),
    s: random(smin, smax),
    rot: random(TWO_PI),
    vr: random(-0.03, 0.03),
    vx: random(vxmin, vxmax),
    vy: random(vymin, vymax),
    seed: random(100),
    col: random(LEAF_COLS),
  };
}

function stepLeaf(l, w, h) {
  l.x += l.vx;
  l.y += l.vy + sin(frameCount * 0.03 + l.seed) * 0.3;
  l.rot += l.vr;
  if (l.y > h + 30) {
    l.y = -30;
    l.x = random(w);
  }
  if (l.x < -30) l.x = w + 30;
  if (l.x > w + 30) l.x = -30;
}

function drawCracker(l) {
  const r = l.s * 1.15;
  push();
  translate(l.x, l.y);
  rotate(l.rot);
  noStroke();
  fill("#d9a964");
  circle(0, 1.5, r * 2); // darker edge
  fill(l.col);
  circle(0, 0, r * 2); // the cracker
  fill(255, 255, 255, 70);
  circle(-r * 0.25, -r * 0.25, r * 1.1); // soft highlight
  fill(190, 130, 60, 110); // toasted spots
  circle(-r * 0.4, r * 0.2, r * 0.22);
  circle(r * 0.35, -r * 0.35, r * 0.18);
  circle(r * 0.1, r * 0.45, r * 0.16);
  // fill("#2f3b34");
  // rect(-r * 0.97, -r * 0.22, r * 1.94, r * 0.44, 2); // nori strip
  // stroke(255, 255, 255, 60);
  // strokeWeight(1);
  // line(-r * 0.9, -r * 0.08, r * 0.9, -r * 0.08); // sheen on the nori
  pop();
}

function drawLeaf(l) {
  push();
  translate(l.x, l.y);
  rotate(l.rot);
  noStroke();
  fill(l.col);
  ellipse(0, 0, l.s * 2, l.s * 1.1);
  stroke(255, 255, 255, 130);
  strokeWeight(1.2);
  line(-l.s, 0, l.s, 0);
  pop();
}

function makeHeart(spread) {
  return {
    x: random(width),
    y: height + 20 + (spread ? random(0, 500) : 0),
    vx: random(-0.6, 0.6),
    vy: random(-3.2, -1.4),
    s: random(8, 20),
    rot: random(-0.4, 0.4),
    col: random(HEART_COLS),
  };
}

function sparkHeart(x, y) {
  return {
    x,
    y,
    vx: random(-1.2, 1.2),
    vy: random(-2.6, -1),
    s: random(5, 9),
    rot: random(-0.4, 0.4),
    col: random(HEART_COLS),
    life: 45,
  };
}

function drawHearts() {
  noStroke();
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.x += h.vx + sin(frameCount * 0.04 + h.rot * 10) * 0.3;
    h.y += h.vy;
    h.rot += 0.01;
    if (h.life !== undefined) h.life--;
    if (h.y < -40 || (h.life !== undefined && h.life <= 0)) {
      hearts.splice(i, 1);
      continue;
    }
    const c = color(h.col);
    if (h.life !== undefined && h.life < 20)
      c.setAlpha(map(h.life, 0, 20, 0, 255));
    push();
    translate(h.x, h.y);
    rotate(h.rot * 0.5);
    fill(c);
    drawHeart(h.s);
    pop();
  }
}

function drawHeart(s) {
  beginShape();
  vertex(0, s * 0.9);
  bezierVertex(-s * 1.4, -s * 0.2, -s * 0.6, -s * 1.1, 0, -s * 0.4);
  bezierVertex(s * 0.6, -s * 1.1, s * 1.4, -s * 0.2, 0, s * 0.9);
  endShape(CLOSE);
}

function easeOutBack(t) {
  const c1 = 1.70158,
    c3 = c1 + 1;
  t = constrain(t, 0, 1);
  return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
}
