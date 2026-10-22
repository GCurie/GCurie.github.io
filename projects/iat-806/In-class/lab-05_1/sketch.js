let balls = [];
let bodySegmentation;
let video;
let segmentation;

let numBalls = 500;

let options = {
  maskType: "parts",
};

async function setup() {
  const canvas = createCanvas(640, 480);

  bodySegmentation = await ml5.bodySegmentation("BodyPix", options);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide(); //cause the model gives you a new video
  bodySegmentation.detectStart(video, gotResults);

  for (let i = 0; i < numBalls; i++) {
    let ball = createRandomBall();
    balls.push(ball);
  }
}

function draw() {
  background(120);
  //image(video, 0, 0);
  if (segmentation) {
    image(segmentation.mask, 0, 0, width, height);
  }
  for (let ball of balls) {
    let byHowMuch = 1;
    //let active = ball.contains(mouseX, mouseY);
    let active = ball.isOnBody(segmentation.mask);
    ball.respond(active);
    ball.update(byHowMuch);
  }
}

// function mousePressed() {
//   balls.forEach((ball) => {
//     if (ball.contains(mouseX, mouseY)) {
//       ball.highlight();
//     } else {
//       ball.deHighlight();
//     }
//   });
// }

function mousePressed() {
  balls.forEach((ball) => {
    let active = ball.contains(mouseX, mouseY);
    ball.respond(active);
  });
}

function gotResults(result) {
  segmentation = result;
}
