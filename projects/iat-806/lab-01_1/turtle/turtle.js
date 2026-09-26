// KardunTurtle — turtle graphics for p5.js 2.x
//
// A turtle holds a position, a heading, and a pen. You give it instructions
// ("go forward 100", "turn right 90") and it draws the path it walks.
//
// You don't need to understand this file to use it. Read sketch.js first.
// We come back to how classes like this are written in Week 4.

class KardunTurtle {
  // x, y  — where the turtle starts
  // icon  — a p5.Image to draw as the turtle (optional)
  constructor(x, y, icon) {
    this.startX = x;
    this.startY = y;
    this.startHeading = -90; // facing up

    this.x = x;
    this.y = y;
    this.heading = this.startHeading; // degrees: 0 = right, 90 = down, -90 = up

    // pen state
    this.isPenDown = true;
    this.color = "#ff7a3c";
    this.weight = 3;

    // appearance
    this.icon = icon;
    this.size = 54;
    this.visible = true;
    this.iconBuffer = null;

    // animation: how much the turtle is allowed to do per frame
    this.moveSpeed = 4; // pixels per frame
    this.turnSpeed = 6; // degrees per frame
    this.isInstant = false;

    // instructions waiting to run
    this.queue = [];
    this.current = null;

    // the drawing surface the trail is painted onto, so it survives background()
    this.trail = createGraphics(width, height);
    this.trail.clear();

    this._buildIcon();
  }

  // ---------------------------------------------------------------
  // Instructions — these get queued up and run in order, one at a time
  // ---------------------------------------------------------------

  forward(distance) {
    this.queue.push({ type: "move", left: Math.abs(distance), sign: Math.sign(distance) || 1 });
    return this;
  }

  backward(distance) {
    return this.forward(-distance);
  }

  right(degrees) {
    this.queue.push({ type: "turn", left: Math.abs(degrees), sign: Math.sign(degrees) || 1 });
    return this;
  }

  left(degrees) {
    return this.right(-degrees);
  }

  penUp() {
    this.queue.push({ type: "pen", down: false });
    return this;
  }

  penDown() {
    this.queue.push({ type: "pen", down: true });
    return this;
  }

  penColor(c) {
    this.queue.push({ type: "color", value: c });
    return this;
  }

  penWidth(w) {
    this.queue.push({ type: "weight", value: w });
    return this;
  }

  // jump straight to a point (draws a line if the pen is down)
  goTo(x, y) {
    this.queue.push({ type: "goTo", x, y });
    return this;
  }

  // point in a direction without moving: 0 = right, 90 = down, -90 = up
  setHeading(degrees) {
    this.queue.push({ type: "heading", value: degrees });
    return this;
  }

  // back to the starting point, facing up
  home() {
    this.queue.push({ type: "home" });
    return this;
  }

  // press the turtle's picture onto the drawing
  stamp() {
    this.queue.push({ type: "stamp" });
    return this;
  }

  // wipe the drawing but leave the turtle where it is
  erase() {
    this.queue.push({ type: "erase" });
    return this;
  }

  // do the same set of instructions n times:
  //   turtle.repeat(4, function () { turtle.forward(100); turtle.right(90); });
  repeat(n, instructions) {
    for (let i = 0; i < n; i++) instructions(i);
    return this;
  }

  // ---------------------------------------------------------------
  // Settings — these take effect immediately, not in queue order
  // ---------------------------------------------------------------

  setSpeed(pixelsPerFrame, degreesPerFrame) {
    this.moveSpeed = pixelsPerFrame;
    this.turnSpeed = degreesPerFrame ?? pixelsPerFrame * 1.5;
    this.isInstant = false;
    return this;
  }

  instant() {
    this.isInstant = true;
    return this;
  }

  setSize(pixels) {
    this.size = pixels;
    this._buildIcon();
    return this;
  }

  setIcon(img) {
    this.icon = img;
    this._buildIcon();
    return this;
  }

  hide() {
    this.visible = false;
    return this;
  }

  show() {
    this.visible = true;
    return this;
  }

  // throw away everything: the drawing, the position, and any pending instructions
  reset() {
    this.queue = [];
    this.current = null;
    this.trail.clear();
    this.x = this.startX;
    this.y = this.startY;
    this.heading = this.startHeading;
    this.isPenDown = true;
    return this;
  }

  // true once every instruction has finished
  isDone() {
    return this.current === null && this.queue.length === 0;
  }

  // ---------------------------------------------------------------
  // Called once per frame from draw()
  // ---------------------------------------------------------------

  update() {
    this._tick();
    this._render();
    return this;
  }

  // ---------------------------------------------------------------
  // Inner workings
  // ---------------------------------------------------------------

  // run as much of the queue as this frame's budget allows
  _tick() {
    let moveBudget = this.isInstant ? Infinity : this.moveSpeed;
    let turnBudget = this.isInstant ? Infinity : this.turnSpeed;
    let guard = 0;

    while ((this.current || this.queue.length > 0) && guard++ < 100000) {
      if (!this.current) this.current = this.queue.shift();
      const cmd = this.current;

      if (cmd.type === "move") {
        const step = Math.min(moveBudget, cmd.left);
        this._moveBy(step * cmd.sign);
        cmd.left -= step;
        moveBudget -= step;
        if (cmd.left > 0.001) break; // out of budget, finish next frame
      } else if (cmd.type === "turn") {
        const step = Math.min(turnBudget, cmd.left);
        this.heading += step * cmd.sign;
        cmd.left -= step;
        turnBudget -= step;
        if (cmd.left > 0.001) break;
      } else {
        this._runInstantly(cmd);
      }

      this.current = null;
    }
  }

  _runInstantly(cmd) {
    if (cmd.type === "pen") this.isPenDown = cmd.down;
    else if (cmd.type === "color") this.color = cmd.value;
    else if (cmd.type === "weight") this.weight = cmd.value;
    else if (cmd.type === "heading") this.heading = cmd.value;
    else if (cmd.type === "goTo") this._lineTo(cmd.x, cmd.y);
    else if (cmd.type === "home") {
      this._lineTo(this.startX, this.startY);
      this.heading = this.startHeading;
    } else if (cmd.type === "stamp") this._paintIcon(this.trail, this.x, this.y);
    else if (cmd.type === "erase") this.trail.clear();
  }

  _moveBy(distance) {
    const radians = (this.heading * Math.PI) / 180;
    this._lineTo(this.x + Math.cos(radians) * distance, this.y + Math.sin(radians) * distance);
  }

  // move to a point, leaving ink behind if the pen is down
  _lineTo(x, y) {
    if (this.isPenDown) {
      this.trail.stroke(this.color);
      this.trail.strokeWeight(this.weight);
      this.trail.strokeCap(ROUND);
      this.trail.line(this.x, this.y, x, y);
    }
    this.x = x;
    this.y = y;
  }

  _render() {
    image(this.trail, 0, 0);
    if (!this.visible) return;

    const radius = this.size / 2;
    const radians = (this.heading * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = Math.sin(radians);

    // a little nose showing which way the turtle is pointing
    push();
    noStroke();
    fill(this.color);
    triangle(
      this.x + dx * radius * 1.7,
      this.y + dy * radius * 1.7,
      this.x + dx * radius * 0.8 - dy * radius * 0.5,
      this.y + dy * radius * 0.8 + dx * radius * 0.5,
      this.x + dx * radius * 0.8 + dy * radius * 0.5,
      this.y + dy * radius * 0.8 - dx * radius * 0.5
    );
    pop();

    this._paintIcon(null, this.x, this.y);
  }

  // draw the turtle's picture, either onto the canvas (target = null) or onto the trail
  _paintIcon(target, x, y) {
    const radius = this.size / 2;

    if (target) {
      target.push();
      target.imageMode(CENTER);
      if (this.iconBuffer) target.image(this.iconBuffer, x, y, this.size, this.size);
      target.noFill();
      target.stroke(255);
      target.strokeWeight(2);
      target.circle(x, y, this.size);
      target.pop();
      return;
    }

    push();
    imageMode(CENTER);
    if (this.iconBuffer) {
      image(this.iconBuffer, x, y, this.size, this.size);
    } else {
      noStroke();
      fill(this.color);
      circle(x, y, this.size);
    }
    noFill();
    stroke(255);
    strokeWeight(2);
    circle(x, y, this.size);
    pop();
  }

  // pre-cut the icon into a circle once, so every frame is just one image() call.
  // any picture works here — it gets scaled to fill the circle and cropped to it.
  _buildIcon() {
    if (!this.icon) {
      this.iconBuffer = null;
      return;
    }

    const s = Math.max(16, Math.round(this.size * 2));
    const g = createGraphics(s, s);
    g.clear();

    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = s / Math.min(this.icon.width, this.icon.height);
    g.imageMode(CENTER);
    g.image(this.icon, s / 2, s / 2, this.icon.width * scale, this.icon.height * scale);

    ctx.restore();
    this.iconBuffer = g;
  }
}
