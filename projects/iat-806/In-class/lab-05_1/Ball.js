class Ball {
  constructor(x, y, c, r, maxR = 10) {
    this.x = x;
    this.y = y;
    this.originalColor = c;
    this.highlightColor = "red";
    this.r = r;
    this.maxR = maxR;
  }

  update(byHowMuch) {
    this.changeSize(byHowMuch);
    this.move(byHowMuch);
    this.show();
  }

  respond(active) {
    if (active) {
      this.highlight();
    } else {
      this.deHighlight();
    }
  }

  highlight() {
    this.color = this.highlightColor;
  }

  deHighlight() {
    this.color = this.originalColor;
  }

  contains(externalX, externalY) {
    let distance = dist(this.x, this.y, externalX, externalY);
    return distance < this.r;
  }

  move(byHowMuch) {
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }

  changeSize(byHowMuch) {
    this.r = constrain(this.r + random(-byHowMuch, byHowMuch), 2, this.maxR);
  }

  show() {
    fill(this.color);
    circle(this.x, this.y, this.r * 2);
  }
} // The Ball class ends here!

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = color(20, 130, 140 + random(-100, 100), 120);
  let ballR = 10;

  let ball = new Ball(ballX, ballY, ballC, ballR);
  return ball;
}
