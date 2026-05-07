/**
 * Web Audio：可选背景音乐（音频文件）+ 短音效。需在用户手势后 resume（浏览器策略）。
 */

/** 背景音乐资源路径；留空则不播放。后续可把 mp3/ogg 放到 `public/` 下并改成 `/your-bgm.mp3`。 */
export const BACKGROUND_MUSIC_URL = "";

type AudioOpts = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
};

let opts: AudioOpts = { musicEnabled: false, sfxEnabled: true, volume: 0.75 };
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
/** 循环 BGM（有 URL 时使用） */
let bgmAudio: HTMLAudioElement | null = null;

function ensureGraph(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

export function resumeAudioContext(): void {
  const c = ensureGraph();
  if (!c) return;
  if (c.state === "suspended") {
    void c.resume().then(() => refreshMusic());
  }
}

export function setAudioOptions(next: Partial<AudioOpts>): void {
  opts = { ...opts, ...next };
  applyLevels();
  refreshMusic();
}

function applyLevels(): void {
  if (masterGain) masterGain.gain.value = Math.min(1, Math.max(0, opts.volume));
  if (bgmAudio) bgmAudio.volume = Math.min(1, Math.max(0, opts.volume));
}

function stopMusic(): void {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.src = "";
    bgmAudio.load();
    bgmAudio = null;
  }
}

function refreshMusic(): void {
  stopMusic();
  const url = BACKGROUND_MUSIC_URL.trim();
  if (!url || !opts.musicEnabled || opts.volume <= 0.001) return;

  const el = new Audio(url);
  el.loop = true;
  el.volume = Math.min(1, Math.max(0, opts.volume));
  bgmAudio = el;
  void el.play().catch(() => {
    /* autoplay blocked until gesture — next toggle / interaction will call refreshMusic via setAudioOptions */
  });
}

/** 成功消除（短促高音） */
export function playSfxClear(): void {
  if (!opts.sfxEnabled || opts.volume <= 0.001) return;
  playTone(523.25, 0.08, "sine", 0.12);
}

/** 选错抖动 */
export function playSfxShake(): void {
  if (!opts.sfxEnabled || opts.volume <= 0.001) return;
  playTone(180, 0.12, "triangle", 0.08);
}

export function playSfxVictory(): void {
  if (!opts.sfxEnabled || opts.volume <= 0.001) return;
  playTone(392, 0.12, "sine", 0.15);
  window.setTimeout(() => playTone(523.25, 0.15, "sine", 0.12), 90);
}

export function playSfxDefeat(): void {
  if (!opts.sfxEnabled || opts.volume <= 0.001) return;
  playTone(220, 0.2, "sawtooth", 0.06);
}

function playTone(freq: number, duration: number, type: OscillatorType, peak: number): void {
  const c = ensureGraph();
  if (!c || !masterGain) return;
  if (c.state === "suspended") void c.resume();

  const g = c.createGain();
  g.gain.value = 0;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(masterGain);

  const t0 = c.currentTime;
  const vol = peak * opts.volume;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
  g.gain.linearRampToValueAtTime(0.0001, t0 + duration);

  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}
