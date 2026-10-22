let circleX = 50;
let circleY = 50;
let speedX = 5;
let speedY = 5;
let size = 100;
let sizeIncrement = 1;
let radius = size / 2;
let topRightColor = "blue";
let topLeftColor = "red";
let bottomLeftColor = "green";
let bottomRightColor = "yellow";
let ballColor;

//I'm adding a second squareball using the same circle code
let circleX2 = 70;
let circleY2 = 80;
let speedX2 = -3;
let speedY2 = -3;

function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");
}

function draw() {
  background(20, 30); //leaves a trail of the ball as it moves

  // each quadrant gets its own colour!
  if (circleX < width / 2 && circleY < height / 2) {
    ballColor = topLeftColor;
  } else if (circleX > width / 2 && circleY < height / 2) {
    ballColor = topRightColor;
  } else if (circleX < width / 2 && circleY > height / 2) {
    ballColor = bottomLeftColor;
  } else {
    ballColor = bottomRightColor;
  }
  fill(ballColor);

  // move
  circleX = circleX + speedX;
  circleY = circleY + speedY;

  // grow (or shrink)
  size = size + sizeIncrement;
  radius = size / 2;

  // bounce off the left and right walls, and flip growing/shrinking
  if (circleX >= width - radius || circleX < radius) {
    speedX = speedX * -1;
    sizeIncrement = sizeIncrement * -1;
  }

  // bounce off the top and bottom walls
  if (circleY >= height - radius || circleY < radius) {
    speedY = speedY * -1;
  }

  circle(circleX, circleY, size);

  // second squareball does the same thing, just slower and smaller
  circleX2 = circleX2 + speedX2;
  circleY2 = circleY2 + speedY2;

  if (circleX2 >= width - radius || circleX2 < radius) {
    speedX2 = speedX2 * -1;
  }

  if (circleY2 >= height - radius || circleY2 < radius) {
    speedY2 = speedY2 * -1;
  }

  let randomColor = color(random(255), random(255), random(255));
  fill(randomColor);
  square(circleX2 - radius, circleY2 - radius, size);
}

function mousePressed() {
  circleX = 100;
  speedY = speedY * -3;
  speedX = speedX * 3;
}
