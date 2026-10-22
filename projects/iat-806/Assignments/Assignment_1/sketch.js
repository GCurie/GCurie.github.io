let bubbles = [];
let jellyX = 300;
let jellyY = 250;
let jellySize = 1;
let discoMode = false;
let sleeping = false;
let bubblesEaten = 0;

let jellyColours = ["#B9A7FF", "#A8E6CF", "#FFB7D5", "#9DE0FF", "#FFF0A8"];

let jellyColour;
let popSound;
let underwater;
let techno;

async function setup() {
  createCanvas(800, 500);

  underwater = await loadImage("underwater.jpg");
  popSound = await loadSound("pop.mp3");
  techno = await loadSound("techno.mp3");

  jellyColour = random(jellyColours);
}

function draw() {
  if (underwater) {
    image(underwater, 0, 0, width, height);
  } else {
    background(20, 40, 80);
    noStroke();
    fill(120, 190, 220, 60);

    for (let i = 0; i < 20; i++) {
      circle((i * 83) % width, (i * 47) % height, 4);
    }
  }

  //Jellyfish follows the mouse
  //lerp (start, end, amount)
  if (!sleeping) {
    jellyX = lerp(jellyX, mouseX, 0.02);
    jellyY = lerp(jellyY, mouseY, 0.02);
  }

  //bubblessss
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];

    b.y -= b.speed;

    stroke(b.colour);
    strokeWeight(2);
    noFill();
    circle(b.x, b.y, b.size);

    noStroke();
    fill(255, 255, 255, 180);
    circle(b.x - b.size * 0.2, b.y - b.size * 0.2, 4);

    //eat bubble when jellyfish touches it by checking the dist b/w the two
    if (dist(jellyX, jellyY, b.x, b.y) < 35 * jellySize + b.size / 2) {
      bubbles.splice(i, 1);
      bubblesEaten++;

      //grow in size
      jellySize = min(1 + bubblesEaten * 0.05, 2);

      //pop
      userStartAudio();
      popSound.play();
    } else if (b.y < -20) {
      bubbles.splice(i, 1);
    }
  }

  drawJellyfish();

  noStroke();
  fill(255);
  textSize(14);
  textAlign(LEFT);
  text("Bubbles eaten: " + bubblesEaten, 15, 25);

  if (bubblesEaten >= 20) {
    textAlign(CENTER);
    textSize(24);
    fill(255, 240, 160);
    text("You've eaten all the bubbles!!", width / 2, 145);
  }
  if (sleeping) {
    textAlign(CENTER);
    textSize(20);
    text("Z z z ...", jellyX, jellyY - 55);
  }
}

function drawJellyfish() {
  push();
  translate(jellyX, jellyY);

  //disco mode
  if (discoMode && frameCount % 8 === 0) {
    jellyColour = color(random(255), random(255), random(255));
  } else if (!discoMode) {
    jellyColour = color(jellyColours[0]);
  }

  //tentacles wiggle
  stroke(jellyColour);
  strokeWeight(4);
  noFill();

  //using sin() to make the tentacles wiggle back and forth
  //frameCount increases by 1, so mul by 0.8 will control the wiggle speed, and i just adds more varation
  for (let i = -2; i <= 2; i++) {
    let tentacleX = i * 12 * jellySize;
    let wiggle = sin(frameCount * 0.08 + i) * 8;

    line(tentacleX, 12 * jellySize, tentacleX + wiggle, 30 * jellySize);

    line(
      tentacleX + wiggle,
      30 * jellySize,
      tentacleX - wiggle,
      45 * jellySize,
    );
  }

  //head
  noStroke();
  fill(jellyColour);
  ellipse(0, 0, 65 * jellySize, 48 * jellySize);
  fill(255, 255, 255, 100);
  ellipse(-10 * jellySize, -10 * jellySize, 18 * jellySize, 8 * jellySize);

  //eyes
  fill(30, 35, 65);
  if (sleeping) {
    stroke(30, 35, 65);
    strokeWeight(2);
    line(-12 * jellySize, 0, -5 * jellySize, 0);
    line(5 * jellySize, 0, 12 * jellySize, 0);
  } else {
    noStroke();
    circle(-10 * jellySize, 0, 6 * jellySize);
    circle(10 * jellySize, 0, 6 * jellySize);
  }

  //mouth
  noFill();
  stroke(30, 35, 65);
  strokeWeight(2);
  arc(0, 8 * jellySize, 12 * jellySize, 8 * jellySize, 0, PI);
  //pi is half a circle, so this makes a smile

  pop();
}

//new bubble
function createBubble(x, y) {
  let bubble = {
    x: x,
    y: y,
    size: random(12, 30),
    speed: random(1, 3),
    colour: random(jellyColours),
  };

  bubbles.push(bubble);
}

//clicking creates a bubble
function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    userStartAudio();

    if (bubblesEaten < 20) {
      createBubble(mouseX, mouseY);
    }
  }
}

//controls
function keyPressed() {
  if (key === "d" || key === "D") {
    discoMode = !discoMode;

    if (discoMode) {
      userStartAudio();
      techno.play();
    } else {
      techno.pause();
    }
  }

  if (key === "s" || key === "S") {
    sleeping = !sleeping;
  }
}
