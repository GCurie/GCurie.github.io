class Particle {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.vx = random(-5, 5);
    this.vy = random(-5, 5);
    this.life = 35;
    this.size = random(5, 14);
    this.col = col;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
  show() {
    noStroke();
    fill(
      red(this.col),
      green(this.col),
      blue(this.col),
      (this.life / 35) * 255,
    );
    circle(this.x, this.y, this.size);
  }
  isDead() {
    return this.life <= 0;
  }
}

//technique
class AttackFX {
  constructor(type, x, y, dx = 0, dy = -1) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.maxLife = type === "shock" ? 28 : 18;
    this.life = this.maxLife;
  }
  update() {
    this.life--;
  }
  show() {
    let k = this.life / this.maxLife;
    push();
    if (this.type === "shock") {
      noFill();
      stroke(200, 150, 255, k * 255);
      strokeWeight(14 * k + 2);
      circle(this.x, this.y, (1 - k) * 340);
    } else if (this.type === "slash") {
      stroke(80, 230, 255, k * 255);
      strokeWeight(50 * k + 2);
      line(0, this.y, width, this.y);
    } else if (this.type === "bolt") {
      stroke(255, 80, 120, k * 255);
      strokeWeight(26 * k + 2);
      line(this.x, this.y, this.x + this.dx * 2000, this.y + this.dy * 2000);
    }
    pop();
  }
  isDead() {
    return this.life <= 0;
  }
}
