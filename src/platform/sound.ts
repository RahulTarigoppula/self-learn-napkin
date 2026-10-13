import { readSettings } from '../db/settings';

/** Tiny synthesised UI sounds (Web Audio, zero bytes of audio files, our own work). Off by default;
 *  never forced: if the AudioContext can't start, nothing plays. Every sound has a visible twin. */
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (!readSettings().sound) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.06, delay = 0): void {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, gain = 0.05, hp = 1200): void {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const sound = {
  tick: () => tone(1800, 0.04, 'triangle', 0.03),
  click: () => tone(900, 0.06, 'square', 0.025),
  flip: () => noise(0.12, 0.05, 2400),
  rip: () => noise(0.22, 0.08, 800),
  ding: () => {
    tone(1318.5, 0.9, 'sine', 0.05);
    tone(1975.5, 0.7, 'sine', 0.02, 0.01);
  },
  good: () => {
    tone(660, 0.12, 'triangle', 0.04);
    tone(990, 0.16, 'triangle', 0.04, 0.07);
  },
};
