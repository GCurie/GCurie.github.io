// An example sketch, so the page has something to show.
// Delete all of this and write your own.

function setup() {
  const canvas = createCanvas(600, 400);

  // Puts the canvas inside the <div id="sketch-holder"> in index.html,
  // instead of dropping it at the bottom of the page.
  canvas.parent("sketch-holder");
}

function draw() {
  background(253, 253, 251);

  noStroke();
  fill(47, 79, 216);
  circle(width / 2, height / 2, 160);

  fill(255, 180, 60);
  circle(mouseX, mouseY, 40);
}
