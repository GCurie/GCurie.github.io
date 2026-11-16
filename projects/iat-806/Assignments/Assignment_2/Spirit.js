// Spirit.js
// A cursed spirit that floats down the screen toward the player.

class Spirit {
  constructor(speedMin, speedMax) {
    this.r = 40;
    this.x = random(this.r, width - this.r);
    this.baseX = this.x;
    this.y = -this.r;
    this.speed = random(speedMin, speedMax);
    this.phase = random(TWO_PI);
    this.col = random([color(150, 70, 210), color(210, 60, 120), color(60, 170, 220)]);
  }

  update() {
    this.y += this.speed;
    this.phase += 0.08;
    this.x = this.baseX + sin(this.phase) * 20; // sway left/right
  }

  reachedLine(lineY) {
    return this.y > lineY;
  }

  // ---------- Collision tests (the body -> object connection) ----------

  // Circle attack (shockwave)
  hitByCircle(cx, cy, cr) {
    return dist(this.x, this.y, cx, cy) < cr + this.r;
  }

  // Horizontal band across the whole screen (slash)
  hitByBand(bandY, bandH) {
    return abs(this.y - bandY) < bandH / 2 + this.r;
  }

  // Ray from (x1,y1) in direction (dx,dy), which must be length 1 (bolt)
  hitByRay(x1, y1, dx, dy, w) {
    let px = this.x - x1;
    let py = this.y - y1;
    let t = px * dx + py * dy; // how far along the ray
    if (t < 0) return false; // behind the fingertip
    let d = abs(px * dy - py * dx); // sideways distance from the ray
    return d < w / 2 + this.r;
  }

  show() {
    push();
    translate(this.x, this.y);
    noStroke();

    // glow
    fill(red(this.col), green(this.col), blue(this.col), 60);
    circle(0, 0, this.r * 2.7);

    // body
    fill(this.col);
    circle(0, 0, this.r * 2);

    // eyes
    fill(255);
    ellipse(-this.r * 0.35, -this.r * 0.15, this.r * 0.5, this.r * 0.65);
    ellipse(this.r * 0.35, -this.r * 0.15, this.r * 0.5, this.r * 0.65);
    fill(0);
    circle(-this.r * 0.35, -this.r * 0.1, this.r * 0.22);
    circle(this.r * 0.35, -this.r * 0.1, this.r * 0.22);

    // mouth
    noFill();
    stroke(0);
    strokeWeight(3);
    arc(0, this.r * 0.3, this.r * 0.8, this.r * 0.5, 0, PI);
    pop();
  }
}
