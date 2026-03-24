/**
 * Quiz Tension BGM — Original Composition (Web Audio API)
 *
 * Synthesizes a dramatic quiz show countdown BGM:
 * - Tick-tock clock pattern (creates urgency)
 * - Low bass pulse (heartbeat tension)
 * - Rising chromatic tones (building suspense)
 * - Tempo accelerates over time (increasing pressure)
 *
 * 100% original, synthesized in-browser. No copyright issues.
 * Respects pinggo_sound_muted localStorage setting.
 */

let audioCtx = null;
let currentBgm = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

/**
 * Create a click/tick sound at a specific time.
 */
function scheduleTick(ctx, time, gain, high = false) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(high ? 1200 : 800, time);
  osc.frequency.exponentialRampToValueAtTime(high ? 600 : 400, time + 0.03);
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(high ? 0.15 : 0.08, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
  osc.connect(g);
  g.connect(gain);
  osc.start(time);
  osc.stop(time + 0.08);
  return osc;
}

/**
 * Create a bass pulse (heartbeat effect).
 */
function scheduleBass(ctx, time, gain) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(55, time); // Low A
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(0.12, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
  osc.connect(g);
  g.connect(gain);
  osc.start(time);
  osc.stop(time + 0.3);
  return osc;
}

/**
 * Create a tension tone (rising pad).
 */
function scheduleTone(ctx, time, freq, duration, gain) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.linearRampToValueAtTime(freq * 1.02, time + duration); // slight rise
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(0.06, time + 0.1);
  g.gain.setValueAtTime(0.06, time + duration - 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, time + duration);
  osc.connect(g);
  g.connect(gain);
  osc.start(time);
  osc.stop(time + duration + 0.05);
  return osc;
}

/**
 * Play quiz tension BGM.
 *
 * Structure (total ~8 seconds, loops):
 * - Phase 1 (0-4s): Slow tick-tock + bass pulse + low pad
 * - Phase 2 (4-6s): Faster ticking + rising tone
 * - Phase 3 (6-8s): Rapid ticking + high tension
 *
 * @param {number} volume - 0~1, default 0.4
 * @param {boolean} loop - whether to loop (default true)
 */
export function playQuizBgm(volume = 0.4, loop = true) {
  if (localStorage.getItem('pinggo_sound_muted') === 'true') return () => {};

  try {
    stopQuizBgm();

    const ctx = getCtx();
    const now = ctx.currentTime;
    const oscs = [];

    // Master gain
    const master = ctx.createGain();
    master.gain.setValueAtTime(volume, now);
    master.connect(ctx.destination);

    function scheduleLoop(startTime) {
      let t = startTime;

      // Phase 1: Slow tick-tock (BPM ~100), 4 seconds
      const slowInterval = 0.6; // 100 BPM
      for (let i = 0; i < 7; i++) {
        oscs.push(scheduleTick(ctx, t, master, i % 2 === 0));
        if (i % 2 === 0) oscs.push(scheduleBass(ctx, t, master));
        t += slowInterval;
      }

      // Background pad (Dm chord feel: D3 + A3)
      oscs.push(scheduleTone(ctx, startTime, 147, 4, master)); // D3
      oscs.push(scheduleTone(ctx, startTime, 220, 4, master)); // A3

      // Phase 2: Medium tick (BPM ~140), 2 seconds
      const medInterval = 0.43;
      for (let i = 0; i < 5; i++) {
        oscs.push(scheduleTick(ctx, t, master, i % 2 === 0));
        t += medInterval;
      }

      // Rising pad (E3 + B3 — tension)
      oscs.push(scheduleTone(ctx, startTime + 4, 165, 2, master)); // E3
      oscs.push(scheduleTone(ctx, startTime + 4, 247, 2, master)); // B3

      // Phase 3: Fast tick (BPM ~200), 2 seconds
      const fastInterval = 0.3;
      for (let i = 0; i < 7; i++) {
        oscs.push(scheduleTick(ctx, t, master, true));
        if (i % 3 === 0) oscs.push(scheduleBass(ctx, t, master));
        t += fastInterval;
      }

      // High tension pad (F3 + C4)
      oscs.push(scheduleTone(ctx, startTime + 6, 175, 2, master)); // F3
      oscs.push(scheduleTone(ctx, startTime + 6, 262, 2, master)); // C4

      return t - startTime; // total duration
    }

    const loopDuration = scheduleLoop(now);

    // Loop handling
    let loopTimer = null;
    if (loop) {
      function nextLoop() {
        if (!currentBgm) return;
        const loopStart = ctx.currentTime + 0.05;
        scheduleLoop(loopStart);
        loopTimer = setTimeout(nextLoop, loopDuration * 1000 - 100);
      }
      loopTimer = setTimeout(nextLoop, loopDuration * 1000 - 100);
    }

    currentBgm = { oscs, master, ctx, loopTimer };

    if (!loop) {
      setTimeout(() => {
        if (currentBgm?.oscs === oscs) currentBgm = null;
      }, (loopDuration + 0.5) * 1000);
    }

    return stopQuizBgm;
  } catch {
    return () => {};
  }
}

/** Stop currently playing quiz BGM with fade-out. */
export function stopQuizBgm() {
  if (!currentBgm) return;
  try {
    const { oscs, master, ctx, loopTimer } = currentBgm;
    const now = ctx.currentTime;

    if (loopTimer) clearTimeout(loopTimer);

    // Fade out
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.3);

    setTimeout(() => {
      oscs.forEach((osc) => { try { osc.stop(); } catch { /* */ } });
    }, 400);
  } catch { /* */ }
  currentBgm = null;
}

/** Check if BGM is currently playing. */
export function isQuizBgmPlaying() {
  return currentBgm !== null;
}
