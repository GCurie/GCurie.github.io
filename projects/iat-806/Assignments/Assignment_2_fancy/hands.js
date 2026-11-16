// hands.js - reads ml5 handPose results and turns them into gestures

// ---------- Reading the hands ----------
// ml5 handPose gives back an array of hands. Each hand has:
//   keypoints[0..20] -> {x, y} for wrist, thumb, fingers... (in webcam pixels)
//   handedness       -> "Left" or "Right"
// Fingertips: 4 thumb, 8 index, 12 middle, 16 ring, 20 pinky
// Finger middle joints (PIP): 6, 10, 14, 18      Wrist: 0
function readHands() {
  handInfo = [];
  let sx = width / VW;
  let sy = height / VH;

  for (let hand of hands) {
    // convert webcam coordinates to canvas coordinates
    let pts = hand.keypoints.map((k) => ({ x: k.x * sx, y: k.y * sy }));
    let wrist = pts[0];

    // a finger is "extended" when its tip is farther from the wrist than its middle joint
    let ext = (tip, pip) => dist(pts[tip].x, pts[tip].y, wrist.x, wrist.y) >
                            dist(pts[pip].x, pts[pip].y, wrist.x, wrist.y) * 1.05;
    let idx = ext(8, 6);
    let mid = ext(12, 10);
    let ring = ext(16, 14);
    let pinky = ext(20, 18);

    let raw = "none";
    if (idx && mid && ring && pinky) raw = "palm";
    else if (idx && mid && !ring && !pinky) raw = "peace";
    else if (idx && !mid && !ring && !pinky) raw = "point";
    else if (!idx && !mid && !ring && !pinky) raw = "fist";

    // debounce: the camera is noisy, so a pose must last 3 frames to count
    let key = hand.handedness || "hand";
    if (!gestureMemory[key]) gestureMemory[key] = { stable: "none", cand: "none", n: 0 };
    let m = gestureMemory[key];
    if (raw === m.cand) m.n++;
    else {
      m.cand = raw;
      m.n = 1;
    }
    let fresh = false;
    if (m.n >= 3 && m.stable !== m.cand) {
      m.stable = m.cand;
      fresh = true; // the pose JUST changed -> fire a technique
    }

    // palm center = average of wrist + knuckles
    let ids = [0, 5, 9, 13, 17];
    let px = 0, py = 0;
    for (let id of ids) {
      px += pts[id].x;
      py += pts[id].y;
    }
    let palm = { x: px / ids.length, y: py / ids.length };

    handInfo.push({ pts, palm, gesture: m.stable, fresh, handed: key });
  }
}

function drawHands() {
  for (let info of handInfo) {
    let col = gestureColor(info.gesture);
    // finger dots
    noStroke();
    fill(red(col), green(col), blue(col), 200);
    for (let p of info.pts) circle(p.x, p.y, 9);
    // glow on the palm
    fill(red(col), green(col), blue(col), 50);
    circle(info.palm.x, info.palm.y, 110);
    // label
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

function gestureColor(g) {
  if (g === "point") return color(255, 90, 130);
  if (g === "fist") return color(255, 40, 40);
  if (g === "peace") return color(80, 230, 255);
  if (g === "palm") return color(190, 130, 255);
  return color(200);
}

