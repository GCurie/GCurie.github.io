// An example sketch, so the page has something to show.
// Delete all of this and write your own.
let circleX = 150; // This is a global variable. It can be used anywhere in the sketch.
let circleY = 150;
let speedX = 5;
let speedY = 5;
let size = 100;
let radius = size / 2;
let sizeIncrement = 1;
let rightColor = "blue";
let leftColor = "red";
let color;

function setup() {
  const canvas = createCanvas(600, 400);

  // Puts the canvas inside the <div id="sketch-holder"> in index.html,
  // instead of dropping it at the bottom of the page.

  //Whatever is here runs once before the sketch starts. It's a good place to set up your canvas and any other initial settings.
  canvas.parent("sketch-holder");
  //watermelon = 300; //More importance is given to the value of watermelon here, since this is the last place it was set before draw() runs.
}

//runs forever, we can change stuff here to make the sketch interactive. This is where we draw shapes, change colors, etc.
function draw() {
  background(253, 253, 251);
  fill(55, 180, 190);
  //noStroke();
  //fill(47, 79, 216);
  //circle(width / 2, height / 2, 160);
  //watermelon = 400; //Even more importance is given to the value of watermelon here, since this is the last place it was set before draw() runs.
  //console.log(watermelon); //This will print the value of watermelon to the console every time draw() runs. You can open the console in your browser to see it.
  //circle(watermelonX, watermelonY, 40);
  //console.log(circleX);

  //fill(color);
  //circleY = height / 2;
  //circleX = width / 2;
  circleX = circleX + speedX;
  circleY = circleY + speedY;
  size = size + sizeIncrement;
  radius = size / 2;

  if (circleX >= width - radius || circleX < radius) {
    speedX = speedX * -1;
    sizeIncrement = sizeIncrement * -1;
  }

  if (circleY >= height - radius || circleY < radius) {
    speedY = speedY * -1;
  }

  //fill(random(255), 255, random(255));
  circle(circleX, circleY, size);
}

function mousePressed() {
  //This function runs once every time the mouse is pressed. You can use it to change variables, play sounds, etc.
}

//use mouse position to change color of circle/or do something weird to it
//when you click chnage the direction of the circle/colour/weirder due friday night
