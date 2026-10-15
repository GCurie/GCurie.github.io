// let myBall;
// let myBall2;
let balls = [];
let numBalls = 250;

function setup() {
  createCanvas(800, 600);
  // myBall = new Ball(400, 300, 120, 20);
  // myBall2 = new Ball(200, 300, 70, 40);
  for (let i = 0; i < numBalls; i++) {
    let x = random(width);
    let y = random(height);
    let c = color(random(255), random(255), random(255), random(100, 255));
    let r = random(10, 125);
    balls.push(new Ball(x, y, c, r));
  }
}

function draw() {
  background(20);
  for (let ball of balls) {
    ball.move(random(-5, 5), random(-5, 5));
    ball.changeSize(6);
    ball.show();
  }
}

class Ball {
  constructor(x, y, c, r) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.r = r;
  }

  show() {
    fill(this.c);
    circle(this.x, this.y, this.r);
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  changeSize(s) {
    this.r += random(-1, 7);
  }
}
