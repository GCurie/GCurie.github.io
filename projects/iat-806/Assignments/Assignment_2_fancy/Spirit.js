// Spirit.js
// A cursed spirit that floats down the screen toward the player.
// Three types: "normal" (1 hp), "tough" (2 hp, bigger), "swift" (1 hp, fast + wobbly).

class Spirit {
  constructor(type, speedMin, speedMax) {
    this.type = type;
    this.r = type === "tough" ? 55 : type === "swift" ? 30 : 40;
    this.x = random(this.r, width - this.r);
    this.baseX = this.x;
    this.y = -this.r;
    this.speed = random(speedMin, speedMax) * (type === "swift" ? 1.5 : 1);
    this.maxHp = type === "tough" ? 2 : 1;
    this.hp = this.maxHp;
    this.phase = random(TWO_PI);
    this.flash = 0; // frames left to flash white after a hit

    if (type === "tough") this.col = color(210, 40, 80);
    else if (type === "swift") this.col = color(40, 210, 190);
    else this.col = color(150, 70, 210);
  }

  update() {
    this.y += this.speed;
    this.phase += 0.08;
    // sway left/right (swift ones sway a lot)
    let sway = this.type === "swift" ? 70 : 20;
    this.x = this.baseX + sin(this.phase) * sway;
    if (this.flash > 0) this.flash--;
  }

  // Take damage. Returns true if the spirit is dead.
  damage(amount) {
    this.hp -= amount;
    this.flash = 6;
    return this.hp <= 0;
  }

  // Push the spirit back up the screen (used by the shockwave)
  knockback(amount) {
    this.y -= amount;
  }

  reachedLine(lineY) {
    return this.y > lineY;
  }

  // ---------- Collision tests (the body -> object connection) ----------

  // Circle attacks (shockwave, black flash)
  hitByCircle(cx, cy, cr) {
    return dist(this.x, this.y, cx, cy) < cr + this.r;
  }

  // Horizontal band across the whole screen (slash)
  hitByBand(bandY, bandH) {
    return abs(this.y - bandY) < bandH / 2 + this.r;
  }

  // Ray starting at (x1,y1) going in the direction (dx,dy) (must be normalized)
  hitByRay(x1, y1, dx, dy, w) {
    let px = this.x - x1;
    let py = this.y - y1;
    let t = px * dx + py * dy; // how far along the ray
    if (t < 0) return false; // behind the fingertip
    let d = abs(px * dy - py * dx); // perpendicular distance to the ray
    return d < w / 2 + this.r;
  }

  show() {
    push();
    translate(this.x, this.y);
    noStroke();

    // aura
    fill(red(this.col), green(this.col), blue(this.col), 60);
    circle(0, 0, this.r * 2.7);

    // body
    let c = this.flash > 0 ? color(255) : this.col;
    fill(c);
    ellipse(0, 0, this.r * 2, this.r * 2 * (1 + 0.08 * sin(this.phase * 2)));

    // wispy tail
    for (let i = -1; i <= 1; i++) {
      triangle(
        i * this.r * 0.5 - 10, this.r * 0.7,
        i * this.r * 0.5 + 10, this.r * 0.7,
        i * this.r * 0.5 + sin(this.phase + i) * 8, this.r * 1.4
      );
    }

    // eyes
    fill(255);
    ellipse(-this.r * 0.35, -this.r * 0.15, this.r * 0.5, this.r * 0.65);
    ellipse(this.r * 0.35, -this.r * 0.15, this.r * 0.5, this.r * 0.65);
    fill(0);
    circle(-this.r * 0.35, -this.r * 0.1, this.r * 0.22);
    circle(this.r * 0.35, -this.r * 0.1, this.r * 0.22);

    // creepy mouth
    noFill();
    stroke(0);
    strokeWeight(3);
    arc(0, this.r * 0.3, this.r * 0.8, this.r * 0.5, 0, PI);

    // hp pips for tough spirits
    if (this.maxHp > 1) {
      noStroke();
      for (let i = 0; i < this.maxHp; i++) {
        fill(i < this.hp ? color(255, 230, 80) : color(60));
        circle((i - (this.maxHp - 1) / 2) * 14, -this.r - 14, 10);
      }
    }
    pop();
  }
}
