// Effects.js
// Small visual objects. They all have update(), show(), isDead()
// so sketch.js can treat them the same way.

// A little burst particle (spawned when a spirit dies)
class Particle {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.vx = random(-5, 5);
    this.vy = random(-5, 5);
    this.life = 35;
    this.maxLife = 35;
    this.size = random(5, 14);
    this.col = col;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.life--;
  }
  show() {
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), (this.life / this.maxLife) * 255);
    circle(this.x, this.y, this.size);
  }
  isDead() {
    return this.life <= 0;
  }
}

// Floating text like "+20" or "x3 COMBO"
class FloatText {
  constructor(x, y, str, col) {
    this.x = x;
    this.y = y;
    this.str = str;
    this.col = col;
    this.life = 50;
  }
  update() {
    this.y -= 1.5;
    this.life--;
  }
  show() {
    textAlign(CENTER, CENTER);
    textSize(28);
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), min(255, this.life * 8));
    text(this.str, this.x, this.y);
  }
  isDead() {
    return this.life <= 0;
  }
}

// The visual of a technique: "shock", "slash", "bolt" or "flash"
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
    let k = this.life / this.maxLife; // 1 -> 0
    push();
    if (this.type === "shock") {
      // expanding purple ring
      let r = (1 - k) * 340;
      noFill();
      stroke(200, 150, 255, k * 255);
      strokeWeight(14 * k + 2);
      circle(this.x, this.y, r);
      fill(160, 100, 255, k * 60);
      noStroke();
      circle(this.x, this.y, r);
    } else if (this.type === "slash") {
      // horizontal white-cyan slash across the whole screen
      stroke(80, 230, 255, k * 255);
      strokeWeight(50 * k + 2);
      line(0, this.y, width, this.y);
      stroke(255, 255, 255, k * 255);
      strokeWeight(10 * k + 1);
      line(0, this.y, width, this.y);
    } else if (this.type === "bolt") {
      // laser out of the fingertip
      let ex = this.x + this.dx * 2000;
      let ey = this.y + this.dy * 2000;
      stroke(255, 80, 120, k * 255);
      strokeWeight(26 * k + 2);
      line(this.x, this.y, ex, ey);
      stroke(255, 255, 255, k * 255);
      strokeWeight(7 * k + 1);
      line(this.x, this.y, ex, ey);
    } else if (this.type === "flash") {
      // Black Flash: black ball with red lightning edge
      noStroke();
      fill(0, 0, 0, k * 230);
      circle(this.x, this.y, 150 * (1.4 - k * 0.4));
      noFill();
      stroke(255, 30, 40, k * 255);
      strokeWeight(6);
      circle(this.x, this.y, 170 * (1.4 - k * 0.4));
      for (let i = 0; i < 6; i++) {
        let a = random(TWO_PI);
        line(this.x, this.y, this.x + cos(a) * 130, this.y + sin(a) * 130);
      }
    }
    pop();
  }
  isDead() {
    return this.life <= 0;
  }
}
