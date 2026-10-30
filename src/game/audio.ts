export type SoundName = 'hit' | 'hurt' | 'miss' | 'coin' | 'level' | 'aggro' | 'death' | 'ui' | 'cast' | 'snare';

export interface AudioBus {
  unlock(): void;
  toggleMute(): boolean;
  readonly muted: boolean;
  play(name: SoundName): void;
}

export function createAudio(): AudioBus {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = false;
  try {
    muted = localStorage.getItem('aldmoor-muted') === '1';
  } catch {
    muted = false;
  }

  function context(): AudioContext | null {
    if (!ctx) return null;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0): void {
    const audio = context();
    if (!audio || !master || muted) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), audio.currentTime + dur);
    amp.gain.setValueAtTime(gain, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start();
    osc.stop(audio.currentTime + dur + 0.02);
  }

  function noise(dur: number, gain: number, freq: number): void {
    const audio = context();
    if (!audio || !master || muted) return;
    const length = Math.floor(audio.sampleRate * dur);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const amp = audio.createGain();
    amp.gain.setValueAtTime(gain, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    src.start();
  }

  return {
    unlock() {
      if (!ctx) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new Ctx();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.22;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') void ctx.resume();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.22;
      try {
        localStorage.setItem('aldmoor-muted', muted ? '1' : '0');
      } catch {
        /* private mode */
      }
      return muted;
    },
    get muted() {
      return muted;
    },
    play(name) {
      if (name === 'hit') {
        noise(0.06, 0.18, 400);
        tone(180, 0.08, 'square', 0.05);
      } else if (name === 'hurt') {
        tone(120, 0.14, 'sawtooth', 0.05, -70);
      } else if (name === 'miss') {
        noise(0.04, 0.08, 1800);
      } else if (name === 'coin') {
        tone(880, 0.07, 'square', 0.04);
        tone(1320, 0.1, 'square', 0.04);
      } else if (name === 'level') {
        tone(523, 0.1, 'square', 0.05);
        tone(659, 0.12, 'square', 0.05);
        tone(784, 0.16, 'square', 0.05);
      } else if (name === 'aggro') {
        noise(0.12, 0.12, 220);
        tone(90, 0.16, 'sawtooth', 0.04, -30);
      } else if (name === 'death') {
        tone(220, 0.3, 'triangle', 0.06, -160);
      } else if (name === 'ui') {
        tone(660, 0.04, 'square', 0.03);
      } else if (name === 'cast') {
        tone(740, 0.09, 'sine', 0.05, 420);
      } else if (name === 'snare') {
        tone(220, 0.18, 'triangle', 0.05, -80);
        noise(0.12, 0.06, 900);
      }
    },
  };
}
