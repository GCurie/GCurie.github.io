function loadSounds() {
  for (let name in SOUND_FILES) {
    sfx[name] = loadSound(SOUND_FILES[name]);
  }
}

function playSfx(name) {
  let s = sfx[name];
  if (s && s.isLoaded()) {
    s.stop();
    s.play();
  }
}
