// config.js - settings you can tweak (loaded first)

const VW = 640; // webcam size (what ml5 sees)
const VH = 480;

// Put your sound files in the same folder as index.html.
// If a file is missing, that sound just stays silent.
const SOUND_FILES = {
  pop: "pop.mp3", // a spirit dies
  bolt: "bolt.mp3", // point
  slash: "slash.mp3", // peace
  shock: "shock.mp3", // palm
  hurt: "hurt.mp3", // a spirit crossed the line
  levelup: "levelup.mp3", // level cleared
  gameover: "gameover.mp3", // you lose
};

// the three hand signs: name shown on screen, technique name, color [r,g,b]
const GESTURE_INFO = {
  point: { label: "POINT", tech: "Cursed Bolt", col: [255, 90, 130] },
  peace: { label: "PEACE", tech: "Slash", col: [80, 230, 255] },
  palm: { label: "PALM", tech: "Shockwave", col: [190, 130, 255] },
};
const GESTURE_ORDER = ["point", "peace", "palm"];

// how long (milliseconds) before a technique can be used again
const COOLDOWN = { point: 450, peace: 1800, palm: 2200 };

// goal = spirits to defeat, spawnEvery = frames between spirits, speed = [min, max]
const LEVELS = [
  {
    name: "Cursed Spirits Awaken",
    goal: 8,
    spawnEvery: 90,
    speed: [0.7, 1.1],
    unlock: ["point"],
  },
  {
    name: "Grade 1 Curses",
    goal: 14,
    spawnEvery: 65,
    speed: [1.0, 1.5],
    unlock: ["point", "peace"],
  },
  {
    name: "Domain Expansion",
    goal: 20,
    spawnEvery: 45,
    speed: [1.3, 2.0],
    unlock: ["point", "peace", "palm"],
  },
];
