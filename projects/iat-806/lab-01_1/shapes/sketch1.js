function setup() {
  createCanvas(1000, 1000);
}

function draw() {
  background(20);
  noStroke();
  fill(243, 114, 32);
  rect(400, 300, 300, 200, 20);
  circle(380, 270, 200);
  triangle(300, 150, 340, 50, 390, 170);
  triangle(420, 170, 480, 50, 520, 150);
  rect(420, 480, 50, 70, 10);
  rect(490, 480, 50, 70, 10);
  rect(580, 480, 50, 70, 10);
  rect(650, 480, 50, 70, 10);

  fill(243, 114, 32);
  strokeWeight(50);
  line(700, 400, 850, 500);

  fill(255, 255, 255);
  stroke("white");
  strokeWeight(20);
  point(350, 250);
  point(420, 250);

  fill(255, 255, 255);
  strokeWeight(5);
  line(330, 300, 220, 280);
  line(330, 320, 210, 320);
  line(330, 340, 220, 360);

  line(450, 300, 560, 280);
  line(450, 320, 570, 320);
  line(450, 340, 560, 360);
}
