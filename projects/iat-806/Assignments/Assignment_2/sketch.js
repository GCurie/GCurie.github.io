let handPose;
let video;
let hands = [];
let handInfo = []; //our hand array

let state = "start";
let stateTimer = 0;

let level = 1;
let score = 0;
let lives = 3;
let kills = 0;
let spawnTimer = 0;

let spirits = [];
let particles = [];
let fxs = [];

let lastUsed = { point: -9999, peace: -9999, palm: -9999 };
let sfx = {};

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  let cnv = createCanvas(960, 720);
  cnv.parent("sketch-holder");
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

  if (state !== "start") drawExitButton();
}

function mousePressed() {
  userStartAudio();
  if (state !== "start" && exitButtonHit()) exitToMenu();
}

function keyPressed() {
  userStartAudio();
  if (keyCode === ESCAPE && state !== "start") exitToMenu();
  if (
    key === " " &&
    (state === "start" || state === "gameOver" || state === "win")
  ) {
    resetGame();
  }
}
