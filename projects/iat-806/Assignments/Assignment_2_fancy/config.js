// config.js - settings you can tweak (loaded first)

// ---------- Settings you can tweak ----------
const VW = 640; // webcam size (what ml5 sees)
const VH = 480;

// Put your sound files in the same folder as index.html.
// Any file that is missing is replaced by a synthesized beep.
const SOUND_FILES = {
  pop: "pop.mp3",           // a spirit dies
  bolt: "bolt.mp3",         // point
  flash: "flash.mp3",       // fist
  slash: "slash.mp3",       // peace
  shock: "shock.mp3",       // palm
  hit: "hit.mp3",           // tough spirit hurt but not dead
  hurt: "hurt.mp3",         // a spirit crossed the line (you lose a life)
  levelup: "levelup.mp3",   // level cleared
  gameover: "gameover.mp3", // lose
};

// cooldowns in milliseconds
const COOLDOWN = { point: 450, fist: 350, peace: 1800, palm: 2200 };

const LEVELS = [
  { name: "Cursed Spirits Awaken", goal: 8,  spawnEvery: 90, speed: [0.7, 1.1], tough: 0,    swift: 0,   unlock: ["point", "fist"] },
  { name: "Grade 1 Curses",        goal: 14, spawnEvery: 65, speed: [1.0, 1.5], tough: 0.35, swift: 0,   unlock: ["point", "fist", "peace"] },
  { name: "Domain Expansion",      goal: 20, spawnEvery: 45, speed: [1.3, 2.0], tough: 0.4,  swift: 0.3, unlock: ["point", "fist", "peace", "palm"] },
];

const GESTURE_INFO = {
  point: { label: "POINT", tech: "Cursed Bolt" },
  fist:  { label: "FIST",  tech: "Black Flash" },
  peace: { label: "PEACE", tech: "Slash" },
  palm:  { label: "PALM",  tech: "Shockwave" },
};
const GESTURE_ORDER = ["point", "fist", "peace", "palm"];
