let lastGesture = {}; //to see when it gesture changes

function readHands() {
  handInfo = [];

  for (let hand of hands) {
    //webcam to canvas coordinates
    let pts = hand.keypoints.map((k) => ({
      x: (k.x * width) / VW,
      y: (k.y * height) / VH,
    }));

    let gesture = getGesture(pts);
    let fresh = gesture !== lastGesture[hand.handedness]; //just changed pose
    lastGesture[hand.handedness] = gesture;

    handInfo.push({ pts: pts, palm: pts[9], gesture: gesture, fresh: fresh });
  }
}

function getGesture(pts) {
  let wrist = pts[0];

  //joint calc logic
  let straight = (tip, joint) =>
    dist(pts[tip].x, pts[tip].y, wrist.x, wrist.y) >
    dist(pts[joint].x, pts[joint].y, wrist.x, wrist.y) * 1.05;

  let index = straight(8, 6);
  let middle = straight(12, 10);
  let ring = straight(16, 14);
  let pinky = straight(20, 18);

  if (index && middle && ring && pinky) return "palm";
  if (index && middle && !ring && !pinky) return "peace";
  if (index && !middle && !ring && !pinky) return "point";
  return "none";
}

function gestureColor(g) {
  if (g === "none") return color(200);
  return color(
    GESTURE_INFO[g].col[0],
    GESTURE_INFO[g].col[1],
    GESTURE_INFO[g].col[2],
  );
}

function drawHands() {
  for (let info of handInfo) {
    let col = gestureColor(info.gesture);
    noStroke();

    //dots on finger joints
    fill(red(col), green(col), blue(col), 200);
    for (let p of info.pts) circle(p.x, p.y, 9);

    //palm
    fill(red(col), green(col), blue(col), 50);
    circle(info.palm.x, info.palm.y, 110);

    //ui of the name of the technique above the hand
    if (info.gesture !== "none") {
      fill(255);
      stroke(0);
      strokeWeight(4);
      textAlign(CENTER, CENTER);
      textSize(22);
      text(
        GESTURE_INFO[info.gesture].tech.toUpperCase(),
        info.palm.x,
        info.palm.y - 70,
      );
    }
  }
}
