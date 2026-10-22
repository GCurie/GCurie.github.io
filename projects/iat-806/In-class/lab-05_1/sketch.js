let balls = [];

let numBalls = 500;

function setup() {
  const canvas = createCanvas(600, 600);

  for (let i = 0; i < numBalls; i++) {
    let ball = createRandomBall();
    balls.push(ball);
  }
}

function draw() {
  background(120);

  for (let ball of balls) {
    let byHowMuch = 1;
    let active = ball.contains(mouseX, mouseY);
    ball.respond(active);
    ball.update(byHowMuch);
  }
}

function mousePressed() {
  balls.forEach((ball) => {
    let active = ball.contains(mouseX, mouseY);
    ball.respond(active);
  });
}
