// KardunTurtle — give the turtle instructions and watch it draw.
//
// Everything you need to change is in this file.

let turtle;

async function setup() {
  createCanvas(800, 600);

  // The turtle's face. Drop any image into this folder and point at it here —
  // it gets scaled and cropped into a circle, so anything roughly square works.
  const face = await loadImage("jump.png");

  // Make a turtle near the bottom left, facing up.
  turtle = new KardunTurtle(200, 420, face);

  giveInstructions();
}

// ---------------------------------------------------------------
// YOUR INSTRUCTIONS GO HERE
// ---------------------------------------------------------------

function giveInstructions() {
  turtle.penColor("#217216");
  turtle.penWidth(4);

  // Press a face onto the canvas, so we can see where we started.
  turtle.stamp();

  // A square, the long way round.
  turtle.right(90);

  for (let i = 0; i < 3; i++) {
    turtle.forward(120);
    turtle.left(90);
    turtle.forward(70);

    turtle.penColor("#fc1111");
    turtle.penWidth(4);
    turtle.left(45);

    turtle.forward(60);
    turtle.right(90);
    turtle.forward(30);
    turtle.right(90);
    turtle.forward(50);
    turtle.left(145);

    turtle.forward(60);
    turtle.right(90);
    turtle.forward(30);
    turtle.right(90);
    turtle.forward(50);
    turtle.left(120);

    turtle.forward(40);
    turtle.right(90);
    turtle.forward(30);
    turtle.right(90);
    turtle.forward(70);

    turtle.penColor("#217216");
    turtle.penWidth(4);

    turtle.left(50);
    turtle.forward(70);
    turtle.left(90);
  }

  // Try this once you've met loops — same square, four lines shorter:
  //
  // turtle.repeat(4, function () {
  //   turtle.forward(180);
  //   turtle.right(90);
  // });
}

function draw() {
  background("#14161a");
  turtle.update(); // runs the next bit of the instructions and draws everything
}

// Press R to start over.
function keyPressed() {
  if (key === "r" || key === "R") {
    turtle.reset();
    giveInstructions();
  }
}

// ---------------------------------------------------------------
// Everything the turtle understands
// ---------------------------------------------------------------
//
//   turtle.forward(100)        walk forward, drawing if the pen is down
//   turtle.backward(100)       walk backward
//   turtle.right(90)           turn clockwise, in degrees
//   turtle.left(90)            turn counter-clockwise
//
//   turtle.penUp()             stop drawing
//   turtle.penDown()           start drawing again
//   turtle.penColor("red")     any p5 color
//   turtle.penWidth(8)         line thickness
//
//   turtle.goTo(100, 200)      jump to a point
//   turtle.setHeading(0)       0 = right, 90 = down, -90 = up
//   turtle.home()              back to the start, facing up
//   turtle.stamp()             print the turtle's face onto the drawing
//   turtle.erase()             wipe the drawing, keep the turtle
//   turtle.repeat(4, fn)       do a set of instructions n times
//
//   turtle.setSpeed(4)         pixels per frame — bigger is faster
//   turtle.instant()           no animation, draw it all at once
//   turtle.setSize(80)         how big the turtle is drawn
//   turtle.hide() / .show()    show or hide the turtle itself
//   turtle.reset()             clear everything
