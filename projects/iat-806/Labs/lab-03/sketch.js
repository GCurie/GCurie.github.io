// IAT 806 · Lab 03 starter: the dancers from Week 3, ready for your website.
// Run with Live Server. Uses p5 2.x (async setup, await loadImage).

const FRAME_COUNT = 8;

// one array holds all eight poses
let frames = [];

// which frame the click-controlled dancer shows
let index = 0;

//keeping track of the sounds
let sounds = [];
let soundIndex = 0;

// parallel arrays, one entry per animated dancer
let xs = [200, 360, 520];
let speeds = [4, 8, 16]; // draw-frames per pose: smaller = faster

// pastel colours that change every time the user clicks the mouse
let discoColours = [
  "#d9c2ff",
  "#bde7ff",
  "#ffc6e8",
  "#d5f5c8",
  "#fff0a8",
  "#c9c2ff",
];

let backgroundIndex = 0;
let dancerPaused = false;
let pausedPose = 0;

async function setup() {
  const canvas = createCanvas(800, 520);

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");

  textFont("monospace");
  textSize(14);

  // load all eight poses with a loop and string concatenation
  for (let i = 0; i < FRAME_COUNT; i++) {
    frames.push(await loadImage("dance_frames/dance" + i + ".png"));
  }

  //I added four sounds that will play one after another when I click
  for (let i = 0; i < 4; i++) {
    sounds.push(await loadSound("sounds/sound" + i + ".mp3"));
  }
}

function draw() {
  //this is where I change the background colour every time the user clicks
  background(discoColours[backgroundIndex]);

  //discooooo stars (in the background)
  //they also change colour every time the user clicks
  noStroke();
  for (let x = 40; x < width; x += 90) {
    for (let y = 110; y < height; y += 100) {
      fill(
        discoColours[
          (backgroundIndex + floor(x / 90) + floor(y / 100)) %
            discoColours.length
        ],
      );
      beginShape();
      vertex(x, y - 8);
      vertex(x + 3, y - 3);
      vertex(x + 8, y);
      vertex(x + 3, y + 3);
      vertex(x, y + 8);
      vertex(x - 3, y + 3);
      vertex(x - 8, y);
      vertex(x - 3, y - 3);
      endShape(CLOSE);
    }
  }

  // contact sheet: every pose, side by side
  for (let i = 0; i < frames.length; i++) {
    image(frames[i], i * 100, 0, 80, 100);
  }

  // click-controlled dancer
  image(frames[index], 20, 140, 160, 260);
  fill("purple");
  text("Frames clicked: " + index + "", 20, 470);

  // one loop draws every dancer, each at its own x and speed
  for (let i = 0; i < xs.length; i++) {
    let pose = floor(frameCount / speeds[i]) % frames.length;

    if (i === 0 && dancerPaused) {
      pose = pausedPose;
    } else if (i === 0) {
      pausedPose = pose;
    }

    image(frames[pose], xs[i], 140, 160, 260);
  }
}

function mousePressed() {
  //needed to search this up, browsers require the user to interact before sound can play
  userStartAudio();

  //play first sound
  if (sounds.length > 0) {
    sounds[soundIndex].play();

    //move to the next one and go back to sound 0
    soundIndex = (soundIndex + 1) % sounds.length;
  }

  // going to the next pose
  index = (index + 1) % frames.length;

  // disco background change
  backgroundIndex = (backgroundIndex + 1) % discoColours.length;
}

//Using the spacebar so I can play and pause the animation
function keyPressed() {
  if (key === " ") {
    dancerPaused = !dancerPaused;

    return false;
  }
}
