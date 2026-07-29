import correctSfx from "../assets/Correct.wav";
import wrongSfx from "../assets/Wrong.mp3";
import pauseSfx from "../assets/Pause.mp3";
import resumeSfx from "../assets/Resume.mp3";
import startSfx from "../assets/Start.mp3";
import levelUpSfx from "../assets/Level Up.mp3";
import victorySfx from "../assets/Victory.mp3";
import endSfx from "../assets/End.mp3";
import timer10sSfx from "../assets/10s Timer.mp3";
import timer30sSfx from "../assets/30s Timer.mp3";
import tickSfx from "../assets/Tick.wav";

// Utility to play a sound if enabled
function playSound(src, soundOn = true, volume = 0.7) {
  if (!soundOn) return;
  const audio = new window.Audio(src);
  audio.volume = volume;
  audio.play();
}

// Exported sound effect functions
export function playCorrect(soundOn) {
  playSound(correctSfx, soundOn, 0.7);
}

export function playWrong(soundOn) {
  playSound(wrongSfx, soundOn, 0.7);
}

export function playPause(soundOn) {
  playSound(pauseSfx, soundOn, 0.7);
}

export function playResume(soundOn) {
  playSound(resumeSfx, soundOn, 0.7);
}

export function playStart(soundOn) {
  playSound(startSfx, soundOn, 0.7);
}

export function playLevelUp(soundOn) {
  playSound(levelUpSfx, soundOn, 0.7);
}

export function playVictory(soundOn) {
  playSound(victorySfx, soundOn, 0.7);
}

export function playEnd(soundOn) {
  playSound(endSfx, soundOn, 0.7);
}

export function playTimer10s(soundOn = true) {
  if (!soundOn) return;
  const audio = new window.Audio(timer10sSfx);
  audio.volume = 1.0;
  audio.play().catch(() => {});
  return audio;
}

export function playTimer30s(soundOn) {
  playSound(timer30sSfx, soundOn, 0.7);
}

export function playTick(soundOn = true) {
  if (!soundOn) return;
  const audio = new window.Audio(tickSfx);
  audio.volume = 1.0;
  audio.play().catch(() => {});
  return audio;
}
