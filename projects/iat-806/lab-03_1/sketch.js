let frames = [];
let myAge = 10;
let myName = "Alireza";
let myStudentsAges = [];
let numFrames = 8;

let numCols = 12;
let numRows = 7;
let colWidth;
let rowHeight;

let colors = [];
let speeds = [];

// let origWidth = currentFrame.width;
// let origHeight = currentFrame.height;
// text(origWidth + " x " + origHeight, 100, 200);

async function setup() {
  createCanvas(800, 420);

  for (let i = 0; i < numCols; i++) {
    colors[i] = [];
    speeds[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = [random(0, 255), random(0, 255), random(0, 255)];
      speeds[i][j] = random(1, 10);
    }
  }

  colWidth = width / numCols;
  rowHeight = height / numRows;

  for (let i = 0; i < numFrames; i++) {
    // let fileName = `dance_frames/dance${i}.png`;
    let fileName = "dance_frames/dance" + i + ".png";

    frames.push(await loadImage(fileName));
  }
}

function draw() {
  background(125);

  if (mouseX < width) {
    numCols = Math.floor(map(mouseX, 0, width, 0, 12));
    colwWidth = width / numCols;
  }
  if (mouseX < height) {
    numRows = Math.floor(map(mouseX, 0, height, 0, 7));
    rowHeight = height / numRows;
  }

  let speed = 10;
  let imgWidth = 100;
  let imgHeight = 200;

  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      //fill(random(0, 255), random(0, 255), random(0, 255), 120);
      fill(colors[i][j][0], colors[i][j][1], colors[i][j][2], 100);
      rect(i * colWidth, j * rowHeight, colWidth, rowHeight);
      animate(
        frames,
        speeds[i][j],
        i * colWidth,
        j * rowHeight,
        imgWidth,
        imgHeight,
      );
    }
  }
}

function animate(frames, speed, xPosition, yPosition, imgWidth, imgHeight) {
  let index = getFrameIndex(speed);
  let currentFrame = frames[index];
  let origWidth = currentFrame.width;
  let origHeight = currentFrame.height;
  // if (imageWidth && !imahgeHeight) {
  //   let scale = imageWidth / origWidth;

  image(currentFrame, xPosition, yPosition, imgWidth, imgHeight);
}

function getFrameIndex(speed) {
  let slowFrame = floor(frameCount / speed);
  let index = slowFrame % frames.length;
  return index;
}
