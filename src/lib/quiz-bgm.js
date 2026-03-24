/**
 * Quiz BGM — Haydn Trumpet Concerto 3rd Movement (Public Domain)
 *
 * Synthesizes the iconic opening melody of the Allegro using Web Audio API.
 * Trumpet-like timbre: square wave + slight detune + gain envelope.
 * Used when quiz questions activate for dramatic tension (나락 퀴즈쇼 스타일).
 *
 * Original: Joseph Haydn (1796), died 1809 → Public Domain.
 * This is a programmatic synthesis, not a recording — no copyright issues.
 */

let audioCtx = null;
let currentBgm = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Note frequency helper (A4 = 440Hz) */
function noteFreq(note, octave) {
  const semitones = { C: -9, D: -7, Eb: -6, E: -5, F: -4, G: -2, Ab: -1, A: 0, Bb: 1, B: 2 };
  return 440 * Math.pow(2, (semitones[note] + (octave - 4) * 12) / 12);
}

/**
 * Haydn Trumpet Concerto 3rd Movement — opening theme
 * Key: Eb major, Tempo: Allegro (~140 BPM)
 * Simplified melody transcription for synthesis.
 */
const TEMPO = 150; // BPM
const BEAT = 60 / TEMPO; // seconds per beat

// [note, octave, duration_in_beats]
const MELODY = [
  // Bar 1-2: Opening fanfare
  ['Eb', 5, 0.5], ['Eb', 5, 0.5], ['Eb', 5, 0.5], ['G', 5, 0.5],
  ['Bb', 5, 1], ['Bb', 5, 0.5], ['Ab', 5, 0.5],
  // Bar 3-4: Descending run
  ['G', 5, 0.5], ['F', 5, 0.5], ['Eb', 5, 0.5], ['F', 5, 0.5],
  ['G', 5, 1.5], ['Eb', 5, 0.5],
  // Bar 5-6: Rising phrase
  ['Ab', 5, 0.5], ['Ab', 5, 0.5], ['Ab', 5, 0.5], ['Bb', 5, 0.5],
  ['G', 5, 1], ['F', 5, 0.5], ['Eb', 5, 0.5],
  // Bar 7-8: Cadence
  ['F', 5, 0.5], ['Eb', 5, 0.5], ['D', 5, 0.5], ['Eb', 5, 0.5],
  ['Bb', 4, 2],
];

/**
 * Create a trumpet-like tone using layered oscillators.
 * Square wave (fundamental) + sine (octave above, soft) for brightness.
 */
function createTrumpetNote(ctx, freq, startTime, duration, masterGain) {
  const attack = 0.02;
  const release = Math.min(0.08, duration * 0.3);
  const sustain = duration - attack - release;

  // Fundamental: square wave (trumpet character)
  const osc1 = ctx.createOscillator();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(freq, startTime);

  // Harmonic: sine one octave up (brightness)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  // Slight detune for warmth
  osc1.detune.setValueAtTime(-5, startTime);
  osc2.detune.setValueAtTime(5, startTime);

  // Individual gains
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();

  // Trumpet envelope
  gain1.gain.setValueAtTime(0, startTime);
  gain1.gain.linearRampToValueAtTime(0.12, startTime + attack);
  gain1.gain.setValueAtTime(0.12, startTime + attack + sustain);
  gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  // Harmonic is softer
  gain2.gain.setValueAtTime(0, startTime);
  gain2.gain.linearRampToValueAtTime(0.04, startTime + attack);
  gain2.gain.setValueAtTime(0.04, startTime + attack + sustain);
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(masterGain);
  gain2.connect(masterGain);

  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.05);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.05);

  return [osc1, osc2];
}

/**
 * Play the quiz BGM melody.
 * Returns a stop function to cancel playback.
 * @param {number} volume - 0~1, default 0.5
 */
export function playQuizBgm(volume = 0.5) {
  // Check mute
  if (localStorage.getItem('pinggo_sound_muted') === 'true') return () => {};

  try {
    stopQuizBgm(); // Stop any existing playback

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    const oscillators = [];
    let time = 0;

    for (const [note, octave, beats] of MELODY) {
      const freq = noteFreq(note, octave);
      const duration = beats * BEAT;
      const oscs = createTrumpetNote(ctx, freq, now + time, duration * 0.9, masterGain);
      oscillators.push(...oscs);
      time += duration;
    }

    // Fade out at the end
    const totalDuration = time;
    masterGain.gain.setValueAtTime(volume, now + totalDuration - 0.3);
    masterGain.gain.linearRampToValueAtTime(0, now + totalDuration);

    currentBgm = { oscillators, masterGain, ctx };

    // Auto-cleanup after melody ends
    setTimeout(() => {
      if (currentBgm?.oscillators === oscillators) {
        currentBgm = null;
      }
    }, (totalDuration + 0.5) * 1000);

    return stopQuizBgm;
  } catch {
    return () => {};
  }
}

/** Stop currently playing quiz BGM. */
export function stopQuizBgm() {
  if (!currentBgm) return;
  try {
    const { oscillators, masterGain, ctx } = currentBgm;
    const now = ctx.currentTime;

    // Quick fade out
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.15);

    // Stop oscillators after fade
    setTimeout(() => {
      oscillators.forEach((osc) => {
        try { osc.stop(); } catch { /* already stopped */ }
      });
    }, 200);
  } catch {
    // Silently fail
  }
  currentBgm = null;
}

/** Check if BGM is currently playing. */
export function isQuizBgmPlaying() {
  return currentBgm !== null;
}
