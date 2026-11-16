// =====================================================================
//  JUTSU DOJO  -  a hand-sign game (p5.js + ml5.js handPose)
//
//  Cursed spirits float down the screen. Make hand signs to destroy
//  them before they cross the red line. 3 lives, 3 levels.
//
//  A technique fires the moment you CHANGE into the pose:
//    POINT (index finger only)      -> Cursed Bolt : laser from your fingertip
//    PEACE (index + middle finger)  -> Slash       : cuts the screen at hand height
//    PALM  (open hand)              -> Shockwave   : big ring around your palm
//
//  Other files: config.js (settings), game.js (game logic), hands.js (handPose),
//  ui.js (screens), sound.js, and the classes in Spirit.js and Effects.js.
// =====================================================================

// ---------- Globals ----------
let handPose;
let video;
let hands = []; // raw results from ml5
let handInfo = []; // our version: one entry per hand (see hands.js)

let state = "start"; // "start" | "levelIntro" | "playing" | "gameOver" | "win"
let stateTimer = 0;  // frames since the state started

let level = 1;
let score = 0;
let lives = 3;
let kills = 0; // spirits defeated in this level
let spawnTimer = 0;

// arrays of objects
let spirits = [];
let particles = [];
let fxs = [];

let lastUsed = { point: -9999, peace: -9999, palm: -9999 }; // for cooldowns
let sfx = {}; // sound files

// ---------- p5 ----------
function preload() {
  // flipped: true = mirror image, so moving your hand right moves it right on screen
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(960, 720);
  video = createCapture(VIDEO, { flipped: true });
  video.size(VW, VH);
  video.hide();
  handPose.detectStart(video, (results) => {
    hands = results;
  });
  loadSounds();
  textFont("Impact");
}

function draw() {
  readHands();
  stateTimer++;
  drawBackdrop();

  if (state === "start") {
    drawHands();
    drawStart();
  } else if (state === "levelIntro") {
    drawHands();
    drawIntro();
  } else if (state === "playing") {
    runGame();
  } else if (state === "gameOver") {
    drawHands();
    runList(particles);
    drawGameOver();
  } else if (state === "win") {
    drawHands();
    runList(particles);
    drawWin();
  }

  // exit button on every screen except the title screen
  if (state !== "start") drawExitButton();
}

// ---------- Input ----------
function mousePressed() {
  userStartAudio(); // browsers need a click before sound can play
  if (state !== "start" && exitButtonHit()) exitToMenu();
}

function keyPressed() {
  userStartAudio();
  if (keyCode === ESCAPE && state !== "start") exitToMenu();
  if (key === " " && (state === "start" || state === "gameOver" || state === "win")) {
    resetGame();
  }
}
