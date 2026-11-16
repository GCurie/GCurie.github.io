// =====================================================================
//  JUTSU DOJO  -  a hand-sign game (p5.js + ml5.js handPose)
//
//  Cursed spirits float down the screen. Make hand signs to destroy
//  them before they cross the red line. 3 lives, 3 levels.
//
//  Techniques (each one is "fired" the moment you CHANGE into the pose):
//    POINT  (index finger only)     -> Cursed Bolt   : laser from your fingertip
//    FIST   (closed hand)           -> Black Flash   : punch, 2x points, small radius
//    PEACE  (index + middle finger) -> Slash         : cuts the whole screen at hand height
//    PALM   (open hand)             -> Shockwave     : big ring, blasts spirits back
//
//  Testing without a camera: press 1/2/3/4 to fire a technique at the mouse.
//  (1 = point, 2 = fist, 3 = peace, 4 = palm)
// =====================================================================

// The rest of the game lives in: config.js, game.js, hands.js, ui.js, sound.js
// and the classes in Spirit.js and Effects.js. This file holds the globals,
// the p5 setup/draw loop, and keyboard/mouse input.

// ---------- Globals ----------
let handPose;
let video;
let hands = []; // raw results from ml5

let state = "start"; // "start" | "levelIntro" | "playing" | "gameOver" | "win"
let stateTimer = 0;  // frames since the state started

let level = 1;
let score = 0;
let lives = 3;
let kills = 0;       // kills in the current level
let combo = 0;
let lastKillFrame = -999;
let spawnTimer = 0;
let shake = 0;
let holdFrames = 0;  // how long the player has held PALM on menu screens

// arrays of objects
let spirits = [];
let particles = [];
let fxs = [];
let floatTexts = [];

// hand tracking results for the current frame (one entry per hand)
let handInfo = [];
let gestureMemory = {}; // per hand: remembers the stable gesture so it doesn't flicker
let lastUsed = { point: -9999, fist: -9999, peace: -9999, palm: -9999 };

// sound
let sfx = {};
let synthOsc, synthEnv;

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

  push();
  if (shake > 0) {
    translate(random(-shake, shake), random(-shake, shake));
    shake *= 0.85;
    if (shake < 0.5) shake = 0;
  }

  drawBackdrop();

  if (state === "start") {
    drawHands();
    runList(particles);
    runList(fxs);
    drawStart();
  } else if (state === "levelIntro") {
    drawHands();
    drawIntro();
  } else if (state === "playing") {
    runGame();
  } else if (state === "gameOver") {
    drawHands();
    runList(particles);
    runList(floatTexts);
    drawGameOver();
  } else if (state === "win") {
    drawHands();
    runList(particles);
    drawWin();
  }
  pop();

  // exit button on every screen except the title screen
  if (state !== "start") drawExitButton();
}

// ---------- Input (keyboard / mouse for testing) ----------
function mousePressed() {
  userStartAudio(); // browsers need a click before audio can play
  if (state !== "start" && exitButtonHit()) exitToMenu();
}

function keyPressed() {
  userStartAudio();
  if (keyCode === ESCAPE && state !== "start") exitToMenu();
  if (key === " " && (state === "start" || state === "gameOver" || state === "win")) {
    resetGame();
  }
  // test mode: fire a technique at the mouse
  if (state === "playing") {
    let map = { "1": "point", "2": "fist", "3": "peace", "4": "palm" };
    if (map[key]) tryFire(map[key], fakeInfo(), true);
  }
}

function fakeInfo() {
  let pts = [];
  pts[5] = { x: mouseX, y: mouseY + 60 }; // base of index finger
  pts[8] = { x: mouseX, y: mouseY };      // fingertip (points up)
  return { pts, palm: { x: mouseX, y: mouseY }, gesture: "none", fresh: false };
}

