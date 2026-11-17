// Процедурный генератор утренней атмосферы на Web Audio API
// Можно включать поверх основной музыки в стиле Oneheart (сад, роса, винил)
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

class MorningAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.currentPreset = 'off';
    this.volume = 0.24;
    this.masterGain = null;
    this.activeNodes = [];
    this.timers = [];
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
    }
  }

  stopAll() {
    this.timers.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    this.timers = [];

    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // Узел уже остановлен
      }
    });
    this.activeNodes = [];
  }

  stop() {
    this.stopAll();
    this.isPlaying = false;
    this.currentPreset = 'off';
  }

  play(presetName) {
    if (!presetName || presetName === 'off') {
      this.stop();
      return false;
    }
    this.initContext();
    if (!this.ctx) return false;

    this.stopAll();
    this.currentPreset = presetName;
    this.isPlaying = true;

    switch (presetName) {
      case 'birds':
        this.playMorningGarden();
        break;
      case 'chimes':
        this.playDewChimes();
        break;
      case 'tape':
        this.playWarmTapePad();
        break;
      default:
        this.stop();
        return false;
    }
    return true;
  }

  createPinkNoiseBuffer(seconds = 4) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.09;
    }
    return buffer;
  }

  // Пресет 1: Утренний сад (тёплый ветерок в лепестках + пение птиц)
  playMorningGarden() {
    const breezeBuffer = this.createPinkNoiseBuffer(5);
    const breeze = this.ctx.createBufferSource();
    breeze.buffer = breezeBuffer;
    breeze.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.11, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.26, this.ctx.currentTime);

    breeze.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    breeze.start();

    this.activeNodes.push(breeze, filter, lfo, lfoGain, gain);

    const singNote = (delay, fStart, fEnd, dur) => {
      if (!this.isPlaying || this.currentPreset !== 'birds') return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fStart, t);
      osc.frequency.exponentialRampToValueAtTime(fEnd, t + dur);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.055, t + dur * 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };

    const birdPhrase = () => {
      if (!this.isPlaying || this.currentPreset !== 'birds') return;
      const base = 2100 + Math.random() * 900;
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const d = i * (0.13 + Math.random() * 0.06);
        const up = Math.random() > 0.35;
        singNote(d, base, up ? base * 1.28 : base * 0.84, 0.11);
      }
    };

    const t1 = setTimeout(birdPhrase, 700);
    const iv = setInterval(() => {
      if (Math.random() > 0.28) birdPhrase();
    }, 3400);
    this.timers.push(t1, iv);
  }

  // Пресет 2: Хрустальная утренняя роса (пентатонические колокольчики)
  playDewChimes() {
    const padOsc = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(216, this.ctx.currentTime);
    padGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    padOsc.connect(padGain);
    padGain.connect(this.masterGain);
    padOsc.start();
    this.activeNodes.push(padOsc, padGain);

    const scale = [528, 594, 660, 792, 880, 1056];
    const strike = () => {
      if (!this.isPlaying || this.currentPreset !== 'chimes') return;
      const now = this.ctx.currentTime;
      const root = scale[Math.floor(Math.random() * scale.length)];

      [1, 2.01].forEach((mult, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(root * mult, now);

        const amp = (0.075 / (idx + 1)) * (0.75 + Math.random() * 0.35);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 3.9);
      });
    };

    strike();
    const iv = setInterval(() => {
      strike();
      if (Math.random() > 0.55) {
        const t2 = setTimeout(strike, 420);
        this.timers.push(t2);
      }
    }, 3200);
    this.timers.push(iv);
  }

  // Пресет 3: Тёплый виниловый эмбиент-пэд в духе Oneheart
  playWarmTapePad() {
    const chord = [130.81, 164.81, 196.0, 246.94, 293.66]; // Cmaj9 в мягком строе
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.detune.setValueAtTime((idx - 2) * 4.5, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480, this.ctx.currentTime);

      const amp = 0.055 / (1 + idx * 0.28);
      g.gain.setValueAtTime(amp, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);
      osc.start();

      this.activeNodes.push(osc, filter, g);
    });

    // Мягкий шорох аналоговой кассеты
    const tapeBuffer = this.createPinkNoiseBuffer(4);
    const tape = this.ctx.createBufferSource();
    tape.buffer = tapeBuffer;
    tape.loop = true;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0.05, this.ctx.currentTime);

    tape.connect(hp);
    hp.connect(tg);
    tg.connect(this.masterGain);
    tape.start();

    this.activeNodes.push(tape, hp, tg);
  }
}

window.MorningAudio = new MorningAudioEngine();
