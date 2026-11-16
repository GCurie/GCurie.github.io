// sound.js - sound effects (with synth fallback if a file is missing)

// ---------- Sound ----------
function loadSounds() {
  for (let name in SOUND_FILES) {
    sfx[name] = loadSound(
      SOUND_FILES[name],
      () => {},               // loaded OK
      () => { sfx[name] = null; } // file missing -> use the synth fallback
    );
  }
}

function playSfx(name, rate = 1, vol = 0.8) {
  let s = sfx[name];
  if (s && s.isLoaded && s.isLoaded()) {
    s.rate(rate);
    s.setVolume(vol);
    s.play();
  } else {
    synthBeep(name);
  }
}

// Fallback beeps so the game still has sound with no files
function synthBeep(name) {
  const table = {
    pop: [700, 350], bolt: [1200, 300], flash: [160, 60], slash: [900, 200],
    shock: [220, 70], hit: [400, 300], hurt: [120, 50], levelup: [500, 1000], gameover: [300, 80],
  };
  let t = table[name] || [440, 440];
  if (!synthOsc) {
    synthOsc = new p5.Oscillator("square");
    synthEnv = new p5.Envelope();
    synthEnv.setADSR(0.001, 0.12, 0, 0.05);
    synthEnv.setRange(0.25, 0);
    synthOsc.amp(0);
    synthOsc.start();
  }
  synthOsc.freq(t[0]);
  synthOsc.freq(t[1], 0.15); // sweep to the second pitch
  synthEnv.play(synthOsc);
}
