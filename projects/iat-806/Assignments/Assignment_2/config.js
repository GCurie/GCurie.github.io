const VW = 640;
const VH = 480;

const SOUND_FILES = {
  pop: "pop.mp3",
  bolt: "bolt.mp3",
  slash: "slash.mp3",
  shock: "shock.mp3",
  hurt: "hurt.mp3",
  levelup: "levelup.mp3",
  gameover: "gameover.mp3",
};

const GESTURE_INFO = {
  point: { label: "POINT", tech: "Cursed Bolt", col: [255, 90, 130] },
  peace: { label: "PEACE", tech: "Slash", col: [80, 230, 255] },
  palm: { label: "PALM", tech: "Shockwave", col: [190, 130, 255] },
};
const GESTURE_ORDER = ["point", "peace", "palm"];

const COOLDOWN = { point: 450, peace: 1800, palm: 2200 };

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
