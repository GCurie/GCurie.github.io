class Ball {
  constructor(x, y, c, r, maxR = 10) {
    this.x = x;
    this.y = y;
    this.originalColor = c;
    this.highlightColor = "purple";
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

  isOnBody(mask) {
    let pixel = mask.get(floor(this.x), floor(this.y)); //(returns r g b a array of pixel values)
    return pixel[3] < 128; // Check if the pixel is part of the segmented body
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
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = color(20, 130, 140 + random(-100, 100), 120);
  let ballR = 10;

  let ball = new Ball(ballX, ballY, ballC, ballR);
  return ball;
}
