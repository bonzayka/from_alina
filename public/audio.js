// Процедурный генератор ночного звукового эмбиента на Web Audio API
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

class NightAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.currentPreset = 'cosmic';
    this.volume = 0.35;
    this.masterGain = null;
    this.activeNodes = [];
    this.cricketInterval = null;
    this.rainInterval = null;
    this.bellInterval = null;
  }

  // Инициализация аудио-контекста после жеста пользователя
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stopAll() {
    if (this.cricketInterval) {
      clearInterval(this.cricketInterval);
      this.cricketInterval = null;
    }
    if (this.rainInterval) {
      clearInterval(this.rainInterval);
      this.rainInterval = null;
    }
    if (this.bellInterval) {
      clearInterval(this.bellInterval);
      this.bellInterval = null;
    }

    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // Игнорируем уже остановленные узлы
      }
    });
    this.activeNodes = [];
  }

  toggle() {
    this.initContext();
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play(this.currentPreset);
    }
    return this.isPlaying;
  }

  stop() {
    this.stopAll();
    this.isPlaying = false;
  }

  play(presetName) {
    this.initContext();
    this.stopAll();
    this.currentPreset = presetName || this.currentPreset;
    this.isPlaying = true;

    switch (this.currentPreset) {
      case 'crickets':
        this.playCrickets();
        break;
      case 'rain':
        this.playRain();
        break;
      case 'cosmic':
        this.playCosmic();
        break;
      case 'bells':
        this.playBells();
        break;
      default:
        this.playCrickets();
    }
  }

  // Генератор шума для ветра и дождя
  createNoiseBuffer(seconds = 3) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Розовый шум
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }
    return buffer;
  }

  // Пресет: Сверчки и ночной сад
  playCrickets() {
    // Фоновый мягкий ветерок
    const windBuffer = this.createNoiseBuffer(5);
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windSource.start();

    this.activeNodes.push(windSource, windFilter, windGain);

    // Функция единичного стрекотания сверчка
    const chirp = () => {
      if (!this.isPlaying || this.currentPreset !== 'crickets') return;
      const now = this.ctx.currentTime;
      const freq = 4500 + Math.random() * 800;

      const osc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(12, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Быстрая серия 3 импульсов
      chirpGain.gain.setValueAtTime(0, now);
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.035;
        chirpGain.gain.setValueAtTime(0.08, t);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      }

      osc.connect(filter);
      filter.connect(chirpGain);
      chirpGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.15);
    };

    // Периодическое повторение сверчков
    this.cricketInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        chirp();
        setTimeout(chirp, 90);
      }
    }, 900);
  }

  // Пресет: Ночной дождь
  playRain() {
    const rainBuffer = this.createNoiseBuffer(5);
    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterGain);
    rainSource.start();

    this.activeNodes.push(rainSource, rainFilter, rainGain);

    // Случайные капли дождя
    const drop = () => {
      if (!this.isPlaying || this.currentPreset !== 'rain') return;
      const now = this.ctx.currentTime;
      const dropOsc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      dropOsc.type = 'sine';
      const startFreq = 800 + Math.random() * 600;
      dropOsc.frequency.setValueAtTime(startFreq, now);
      dropOsc.frequency.exponentialRampToValueAtTime(250, now + 0.06);

      dropGain.gain.setValueAtTime(0.04, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      dropOsc.connect(dropGain);
      dropGain.connect(this.masterGain);

      dropOsc.start(now);
      dropOsc.stop(now + 0.07);
    };

    this.rainInterval = setInterval(() => {
      drop();
      if (Math.random() > 0.5) setTimeout(drop, 60);
    }, 250);
  }

  // Пресет: Космос 432 Гц (бинауральные гармоники для глубокого сна)
  playCosmic() {
    const baseFreq = 108; // Космическая октава 432 Гц

    const freqs = [
      baseFreq,
      baseFreq * 2,
      baseFreq * 4,
      baseFreq * 4 + 1.8 // Бинауральное биение дельта-волны
    ];

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      const amp = 0.12 / (idx + 1);
      gain.gain.setValueAtTime(amp, this.ctx.currentTime);

      // Плавное мерцание
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(amp * 0.4, this.ctx.currentTime);
      lfo.connect(lfoGain.gain);
      lfo.start();

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.activeNodes.push(osc, gain, lfo, lfoGain);
    });
  }

  // Пресет: Хрустальный звон
  playBells() {
    // Фоновый мягкий гул
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(144, this.ctx.currentTime);
    droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();
    this.activeNodes.push(drone, droneGain);

    const ringBell = () => {
      if (!this.isPlaying || this.currentPreset !== 'bells') return;
      const now = this.ctx.currentTime;
      const chord = [528, 660, 792, 1056];
      const root = chord[Math.floor(Math.random() * chord.length)];

      [1, 2.02, 3.01].forEach((multiplier, i) => {
        const bellOsc = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();

        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(root * multiplier, now);

        const bellVol = (0.1 / (i + 1)) * (0.8 + Math.random() * 0.4);
        bellGain.gain.setValueAtTime(bellVol, now);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

        bellOsc.connect(bellGain);
        bellGain.connect(this.masterGain);

        bellOsc.start(now);
        bellOsc.stop(now + 4.6);
      });
    };

    ringBell();
    this.bellInterval = setInterval(ringBell, 4200);
  }
}

window.NightAudio = new NightAudioEngine();
