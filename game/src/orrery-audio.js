// ORRERY — tiny synth: every sound is an oscillator, no audio files.
export function createOrreryAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(gain || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }
  return {
    unlock() { ensure(); },
    setMuted(m) { muted = m; },
    isMuted() { return muted; },
    burn() { tone(720 + Math.random() * 240, 0.09, 'square', 0.05, 320); },
    dialLit() { tone(523, 0.12, 'sine', 0.09); setTimeout(() => tone(784, 0.16, 'sine', 0.09), 90); },
    heartHit() { tone(140, 0.3, 'sawtooth', 0.12, 60); },
    flare() { tone(220, 0.4, 'triangle', 0.1, 880); },
    place() { tone(440, 0.08, 'triangle', 0.07, 660); },
    relic() { tone(392, 0.12, 'sine', 0.09); setTimeout(() => tone(587, 0.14, 'sine', 0.09), 100); setTimeout(() => tone(784, 0.2, 'sine', 0.09), 200); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sine', 0.1), i * 130)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.09), i * 160)); },
    nightClear() { [659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.09), i * 120)); },
  };
}
