// hands.js - turns ml5 handPose results into gestures
//
// ml5 gives back an array of hands. Each hand has:
//   keypoints[0..20] -> {x, y} for the wrist, thumb and fingers (webcam pixels)
//   handedness       -> "Left" or "Right"
// Wrist = 0, fingertips = 8 (index), 12 (middle), 16 (ring), 20 (pinky)
// Middle joint of each finger = 6, 10, 14, 18

let lastGesture = {}; // each hand's previous gesture, to see when it CHANGES

function readHands() {
  handInfo = [];

  for (let hand of hands) {
    // webcam coordinates -> canvas coordinates
    let pts = hand.keypoints.map((k) => ({
      x: (k.x * width) / VW,
      y: (k.y * height) / VH,
    }));

    let gesture = getGesture(pts);
    let fresh = gesture !== lastGesture[hand.handedness]; // just changed pose?
    lastGesture[hand.handedness] = gesture;

    // knuckle of the middle finger = roughly the center of the hand
    handInfo.push({ pts: pts, palm: pts[9], gesture: gesture, fresh: fresh });
  }
}

// Look at which fingers are straight to decide the pose
function getGesture(pts) {
  let wrist = pts[0];

  // a finger is straight when its tip is farther from the wrist than its middle joint
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
  return color(GESTURE_INFO[g].col[0], GESTURE_INFO[g].col[1], GESTURE_INFO[g].col[2]);
}

function drawHands() {
  for (let info of handInfo) {
    let col = gestureColor(info.gesture);
    noStroke();

    // dots on every finger joint
    fill(red(col), green(col), blue(col), 200);
    for (let p of info.pts) circle(p.x, p.y, 9);

    // glow on the palm
    fill(red(col), green(col), blue(col), 50);
    circle(info.palm.x, info.palm.y, 110);

    // name of the technique above the hand
    if (info.gesture !== "none") {
      fill(255);
      stroke(0);
      strokeWeight(4);
      textAlign(CENTER, CENTER);
      textSize(22);
      text(GESTURE_INFO[info.gesture].tech.toUpperCase(), info.palm.x, info.palm.y - 70);
    }
  }
}
