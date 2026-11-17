// ============================================================
// С добрым утром, моё солнышко | Главный клиентский движок
// WebGL шейдер рассвета + физика лепестков сакуры + студия Oneheart
// Правило: только обычные дефисы (-), без длинных тире.
// ============================================================

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const body = document.body;

  // ----------------------------------------------------------
  // 1. Интеграция с Telegram WebApp и тактильный отклик
  // ----------------------------------------------------------
  const tg = window.Telegram && window.Telegram.WebApp;
  function syncTelegramColors(hex) {
    if (!tg) return;
    try {
      if (tg.setHeaderColor) tg.setHeaderColor(hex);
      if (tg.setBackgroundColor) tg.setBackgroundColor(hex);
    } catch (e) { /* безопасно игнорируем */ }
  }

  if (tg) {
    try {
      tg.ready();
      tg.expand();
      syncTelegramColors('#160a14');
    } catch (e) { /* безопасно игнорируем */ }
  }

  function haptic(type = 'light') {
    try {
      if (tg && tg.HapticFeedback) {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(type);
      } else if (navigator.vibrate) {
        navigator.vibrate(type === 'success' ? [12, 36, 14] : 8);
      }
    } catch (e) { /* не критично */ }
  }

  // ----------------------------------------------------------
  // 2. Всплывающие тосты и сердечки
  // ----------------------------------------------------------
  const toastsEl = $('#toasts');
  function toast(text) {
    if (!toastsEl) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    toastsEl.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function spawnHeart(x, y) {
    const el = document.createElement('div');
    el.className = 'float-heart';
    el.textContent = '♥';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ----------------------------------------------------------
  // 3. Живые дата, время и переключение света неба
  // ----------------------------------------------------------
  const now = new Date();
  const introDate = $('#introDate');
  if (introDate) {
    const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    introDate.textContent = `${dateStr} • доброе утро`;
  }

  const issueNo = $('#issueNo');
  if (issueNo) {
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000);
    issueNo.textContent = pad(dayOfYear, 3);
  }

  const heroTime = $('#heroTime');
  function tickClock() {
    if (!heroTime) return;
    const d = new Date();
    heroTime.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  tickClock();
  setInterval(tickClock, 15000);

  let targetWarmth = 0.0;
  let currentWarmth = 0.0;
  const moodToggle = $('#moodToggle');
  const moodLabel = $('#moodLabel');
  if (moodToggle) {
    moodToggle.addEventListener('click', () => {
      haptic('light');
      const isGolden = root.getAttribute('data-theme') === 'golden-silk';
      const nextTheme = isGolden ? 'rose-dawn' : 'golden-silk';
      root.setAttribute('data-theme', nextTheme);
      targetWarmth = isGolden ? 0.0 : 1.0;
      if (moodLabel) moodLabel.textContent = isGolden ? 'Розовый свет' : 'Золотой шёлк';
      syncTelegramColors(isGolden ? '#160a14' : '#1d1115');
      toast(isGolden ? 'Включён нежный розовый рассвет' : 'Включён тёплый солнечный шёлк');
    });
  }

  // ----------------------------------------------------------
  // 4. Плавный скролл Lenis + GSAP ScrollTrigger (Golden Loop)
  // ----------------------------------------------------------
  let lenis = null;
  function initSmoothScroll() {
    if (reduceMotion || lenis) return;
    if (typeof window.Lenis === 'function') {
      try {
        lenis = new window.Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          syncTouch: false,
          wheelMultiplier: 1.0
        });

        if (window.gsap && window.ScrollTrigger) {
          window.gsap.registerPlugin(window.ScrollTrigger);
          lenis.on('scroll', window.ScrollTrigger.update);
          window.gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
          });
          window.gsap.ticker.lagSmoothing(0);
        } else {
          const raf = (time) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
          };
          requestAnimationFrame(raf);
        }
      } catch (e) {
        lenis = null;
      }
    }

    // Плавный переход по якорным ссылкам
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -68 });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ----------------------------------------------------------
  // 5. Магнитные кнопки и 3D-карточки с прожектором
  // ----------------------------------------------------------
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((btn) => {
      const strength = parseFloat(btn.dataset.strength || '0.24');
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });

    const attachTilt = (el, maxDeg = 4.5) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        el.style.setProperty('--ry', `${((px - 0.5) * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - py) * maxDeg).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    };

    $$('.tilt-card').forEach((card) => attachTilt(card, 3.6));

    // Мягкое свечение за курсором
    const glow = $('#cursorGlow');
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });
    const glowLoop = () => {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      if (glow) glow.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      requestAnimationFrame(glowLoop);
    };
    requestAnimationFrame(glowLoop);
  }

  // ----------------------------------------------------------
  // 6. Плейлист в стиле Oneheart + Web Audio Спектр + Природа
  // ----------------------------------------------------------
  const TRACKS = [
    {
      src: 'morning-ambient.mp3',
      title: 'Horizon (Morning Ambient)',
      short: 'Horizon',
      artist: 'StimiBeats • спокойный рассвет в духе Oneheart',
      shortArtist: 'calm dawn pad',
      dur: '04:55'
    },
    {
      src: 'dawn-dreamscape.mp3',
      title: 'Cylinder Four (Dreamscape)',
      short: 'Cylinder IV',
      artist: 'Chris Zabriskie • тёплый аналоговый эмбиент',
      shortArtist: 'warm tape pad',
      dur: '02:57'
    },
    {
      src: 'eternity-dawn.mp3',
      title: 'Eternity (Dawn Reprise)',
      short: 'Eternity',
      artist: 'Stellardrone • невесомое утреннее небо',
      shortArtist: 'celestial dawn',
      dur: '03:33'
    },
    {
      src: 'snowfall.mp3',
      title: 'Snowfall',
      short: 'Snowfall',
      artist: 'Oneheart, Reidenshi • культовая нежность',
      shortArtist: 'oneheart, reidenshi',
      dur: '02:03'
    },
    {
      src: 'stardome.mp3',
      title: 'Stardome',
      short: 'Stardome',
      artist: 'Oneheart, Antent, Dean Korso • звёздная дымка',
      shortArtist: 'oneheart, antent',
      dur: '03:39'
    }
  ];

  const music = $('#bgMusic');
  const navPlayer = $('#navPlayer');
  const navPlayBtn = $('#navPlayBtn');
  const navNextBtn = $('#navNextBtn');
  const navTrackTitle = $('#navTrackTitle');
  const navTrackArtist = $('#navTrackArtist');

  const vinylWrap = $('#vinylWrap');
  const studioTitle = $('#studioTrackTitle');
  const studioArtist = $('#studioTrackArtist');
  const studioPlayBtn = $('#studioPlayBtn');
  const studioPrevBtn = $('#studioPrevBtn');
  const studioNextBtn = $('#studioNextBtn');
  const playlistEl = $('#playlist');
  const seekBar = $('#seekBar');
  const seekFill = $('#seekFill');
  const timeCurrent = $('#timeCurrent');
  const timeTotal = $('#timeTotal');
  const specCanvas = $('#audioSpectrum');
  const specCtx = specCanvas ? specCanvas.getContext('2d') : null;

  let trackIndex = 0;
  let actx = null;
  let gainNode = null;
  let analyser = null;
  let freqData = null;
  let fadeRaf = 0;
  let audioEnergy = 0;

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${pad(m)}:${pad(s)}`;
  }

  function setupAudioGraph() {
    if (actx || !music) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      actx = new AC();
      const src = actx.createMediaElementSource(music);
      analyser = actx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.84;
      freqData = new Uint8Array(analyser.frequencyBinCount);

      gainNode = actx.createGain();
      gainNode.gain.value = 1;

      src.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(actx.destination);
    } catch (e) {
      actx = null;
      gainNode = null;
      analyser = null;
    }
  }

  function fadeVolume(target, ms) {
    if (gainNode && actx) {
      const t = actx.currentTime;
      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(gainNode.gain.value, t);
      gainNode.gain.linearRampToValueAtTime(target, t + ms / 1000);
      return;
    }
    if (!music) return;
    cancelAnimationFrame(fadeRaf);
    const startVol = music.volume;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      music.volume = Math.max(0, Math.min(1, startVol + (target - startVol) * k));
      if (k < 1) fadeRaf = requestAnimationFrame(tick);
    };
    fadeRaf = requestAnimationFrame(tick);
  }

  function syncPlayerUI(playing) {
    if (navPlayer) navPlayer.classList.toggle('is-playing', playing);
    if (studioPlayBtn) studioPlayBtn.classList.toggle('is-playing', playing);
    if (vinylWrap) vinylWrap.classList.toggle('is-spinning', playing);
  }

  function renderPlaylist() {
    if (!playlistEl) return;
    playlistEl.innerHTML = '';
    TRACKS.forEach((tr, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `track-item${idx === trackIndex ? ' is-active' : ''}`;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', idx === trackIndex ? 'true' : 'false');
      btn.innerHTML = `
        <span class="track-info">
          <span class="track-name">${pad(idx + 1)}. ${tr.short}</span>
          <span class="track-sub">${tr.shortArtist}</span>
        </span>
        <span class="track-dur">${tr.dur}</span>
      `;
      btn.addEventListener('click', () => {
        haptic('light');
        loadTrack(idx, true);
      });
      playlistEl.appendChild(btn);
    });
  }

  function updateTrackLabels() {
    const tr = TRACKS[trackIndex];
    if (navTrackTitle) navTrackTitle.textContent = tr.short;
    if (navTrackArtist) navTrackArtist.textContent = tr.shortArtist;
    if (studioTitle) studioTitle.textContent = tr.title;
    if (studioArtist) studioArtist.textContent = tr.artist;
    if (timeTotal) timeTotal.textContent = tr.dur;
    $$('.track-item', playlistEl || document).forEach((el, i) => {
      el.classList.toggle('is-active', i === trackIndex);
      el.setAttribute('aria-selected', i === trackIndex ? 'true' : 'false');
    });
  }

  function playMusic() {
    if (!music) return;
    setupAudioGraph();
    if (actx && actx.state === 'suspended') {
      actx.resume().catch(() => {});
    }
    const p = music.play();
    if (p && p.catch) p.catch(() => syncPlayerUI(false));
  }

  function loadTrack(idx, autoPlay = true) {
    trackIndex = (idx + TRACKS.length) % TRACKS.length;
    const tr = TRACKS[trackIndex];
    updateTrackLabels();
    if (!music) return;
    music.src = tr.src;
    music.load();
    if (seekFill) seekFill.style.width = '0%';
    if (timeCurrent) timeCurrent.textContent = '00:00';
    if (autoPlay) playMusic();
  }

  function toggleMusic() {
    haptic('light');
    if (!music) return;
    if (!music.paused) music.pause();
    else playMusic();
  }

  renderPlaylist();
  updateTrackLabels();

  if (music) {
    music.addEventListener('play', () => syncPlayerUI(true));
    music.addEventListener('pause', () => syncPlayerUI(false));
    music.addEventListener('ended', () => loadTrack(trackIndex + 1, true));
    music.addEventListener('loadedmetadata', () => {
      if (timeTotal && Number.isFinite(music.duration) && music.duration > 0) {
        timeTotal.textContent = formatTime(music.duration);
      }
    });
    music.addEventListener('timeupdate', () => {
      if (!music.duration) return;
      const pct = Math.min(100, (music.currentTime / music.duration) * 100);
      if (seekFill) seekFill.style.width = `${pct.toFixed(2)}%`;
      if (seekBar) seekBar.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (timeCurrent) timeCurrent.textContent = formatTime(music.currentTime);
    });
  }

  if (navPlayBtn) navPlayBtn.addEventListener('click', toggleMusic);
  if (studioPlayBtn) studioPlayBtn.addEventListener('click', toggleMusic);
  if (navNextBtn) navNextBtn.addEventListener('click', () => { haptic(); loadTrack(trackIndex + 1, true); });
  if (studioNextBtn) studioNextBtn.addEventListener('click', () => { haptic(); loadTrack(trackIndex + 1, true); });
  if (studioPrevBtn) studioPrevBtn.addEventListener('click', () => { haptic(); loadTrack(trackIndex - 1, true); });

  if (seekBar && music) {
    const seekFromClientX = (clientX) => {
      if (!music.duration) return;
      const r = seekBar.getBoundingClientRect();
      const k = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      music.currentTime = k * music.duration;
    };
    seekBar.addEventListener('click', (e) => seekFromClientX(e.clientX));
    seekBar.addEventListener('keydown', (e) => {
      if (!music.duration) return;
      if (e.key === 'ArrowRight') music.currentTime = Math.min(music.duration, music.currentTime + 5);
      if (e.key === 'ArrowLeft') music.currentTime = Math.max(0, music.currentTime - 5);
    });
  }

  // Переключатели живой утренней природы (поверх музыки)
  const natureChips = $$('#natureChips .chip');
  natureChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      haptic('light');
      if (!window.MorningAudio) return;
      const preset = chip.dataset.preset;
      const active = window.MorningAudio.togglePreset(preset);
      natureChips.forEach((c) => c.classList.toggle('is-active', c.dataset.preset === active));
      if (active) {
        const labels = {
          breeze: 'Добавлено пение утренних птиц и ветерок',
          chimes: 'Добавлены солнечные колокольчики',
          dew: 'Добавлен шёпот утренней росы',
          vinyl: 'Добавлен уют тёплого винила'
        };
        toast(labels[active] || 'Фоновая атмосфера включена');
      } else {
        toast('Фоновый звук природы выключен');
      }
    });
  });

  // Отрисовка спектра музыки
  function drawSpectrum(t) {
    if (specCtx && specCanvas) {
      const w = specCanvas.width;
      const h = specCanvas.height;
      specCtx.clearRect(0, 0, w, h);

      const bars = 36;
      const gap = 5;
      const barW = (w - gap * (bars - 1)) / bars;
      const playing = music && !music.paused;

      let sumEnergy = 0;
      let hasRealFFT = false;
      if (playing && analyser && freqData) {
        analyser.getByteFrequencyData(freqData);
        for (let k = 0; k < 24; k++) {
          if (freqData[k] > 0) { hasRealFFT = true; break; }
        }
      }

      for (let i = 0; i < bars; i++) {
        let val = 0.12;
        if (playing) {
          if (hasRealFFT && freqData) {
            const bin = Math.min(freqData.length - 1, Math.floor(i * 1.15));
            val = Math.max(0.1, (freqData[bin] / 255) * 0.94);
          } else {
            // Мягкая органическая волна, если браузер ограничивает чтение буфера
            val = 0.22 + 0.52 * (0.5 + 0.5 * Math.sin(t * 0.0032 + i * 0.36)) * (0.6 + 0.4 * Math.cos(t * 0.0019 - i * 0.2));
          }
        }
        sumEnergy += val;

        const bh = Math.max(4, val * (h - 8));
        const x = i * (barW + gap);
        const y = h - bh;

        const grad = specCtx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, 'rgba(255, 224, 175, 0.95)');
        grad.addColorStop(1, 'rgba(255, 158, 187, 0.45)');
        specCtx.fillStyle = grad;

        specCtx.beginPath();
        if (specCtx.roundRect) specCtx.roundRect(x, y, barW, bh, 4);
        else specCtx.rect(x, y, barW, bh);
        specCtx.fill();
      }

      const avg = sumEnergy / bars;
      audioEnergy += (avg - audioEnergy) * 0.08;
    }
    requestAnimationFrame(drawSpectrum);
  }
  requestAnimationFrame(drawSpectrum);

  // ----------------------------------------------------------
  // 7. Открытие интро-вуали и старт страницы
  // ----------------------------------------------------------
  const intro = $('#intro');
  requestAnimationFrame(() => setTimeout(() => intro && intro.classList.add('in'), 70));

  function startReveals() {
    const els = $$('.reveal, main .lines');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    els.forEach((el) => io.observe(el));
  }

  function enterDawn() {
    if (body.classList.contains('is-ready')) return;
    haptic('medium');

    setupAudioGraph();
    if (gainNode) gainNode.gain.value = 0;
    else if (music) music.volume = 0;
    playMusic();
    fadeVolume(1, 2800);

    if (intro) intro.classList.add('is-gone');
    body.classList.remove('is-locked');
    body.classList.add('is-ready');

    initSmoothScroll();
    petalBurst(window.innerWidth / 2, window.innerHeight * 0.45, 36);
    setTimeout(startReveals, 220);
  }

  const introBtn = $('#introBtn');
  if (introBtn) introBtn.addEventListener('click', enterDawn);
  else enterDawn();

  // ----------------------------------------------------------
  // 8. Индикатор скролла и шапка
  // ----------------------------------------------------------
  const nav = $('#nav');
  const progress = $('#progress');
  let scrollTicking = false;

  function onScroll() {
    const y = window.scrollY || root.scrollTop;
    const max = Math.max(1, root.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, y / max));
    if (progress) progress.style.transform = `scaleX(${p.toFixed(4)})`;
    root.style.setProperty('--sp', p.toFixed(3));
    if (nav) nav.classList.toggle('is-scrolled', y > 36);
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // ----------------------------------------------------------
  // 9. Утренний чек-лист заботы (#habitList)
  // ----------------------------------------------------------
  const habitBtns = $$('#habitList .habit-item');
  const habitScore = $('#habitScore');
  const savedHabits = new Set();

  try {
    const raw = sessionStorage.getItem('morning_habits_done');
    if (raw) JSON.parse(raw).forEach((k) => savedHabits.add(String(k)));
  } catch (e) { /* не критично */ }

  function renderHabits() {
    habitBtns.forEach((btn) => {
      btn.classList.toggle('is-done', savedHabits.has(btn.dataset.habit));
    });
    if (habitScore) habitScore.textContent = `${savedHabits.size} / ${habitBtns.length}`;
  }

  habitBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.habit;
      if (savedHabits.has(id)) {
        savedHabits.delete(id);
        haptic('light');
      } else {
        savedHabits.add(id);
        haptic('success');
        const r = btn.getBoundingClientRect();
        petalBurst(e.clientX || (r.left + 30), e.clientY || (r.top + r.height / 2), 16);
        if (savedHabits.size === habitBtns.length) {
          petalBurst(window.innerWidth / 2, window.innerHeight * 0.4, 55);
          toast('Умничка моя любимая! Идеальное утро началось');
        }
      }
      try {
        sessionStorage.setItem('morning_habits_done', JSON.stringify(Array.from(savedHabits)));
      } catch (err) { /* не критично */ }
      renderHabits();
    });
  });
  renderHabits();

  // ----------------------------------------------------------
  // 10. Галерея из 8 открыток + лайки + Lightbox
  // ----------------------------------------------------------
  const CARDS = [
    {
      src: 'photo/1.jpg',
      tag: 'БУКЕТ С УТРА',
      caption: 'Первые цветы этого рассвета - только для тебя'
    },
    {
      src: 'photo/2.jpg',
      tag: 'ЛЮБИМОЕ ДЕЛО',
      caption: 'С самой первой секунды после пробуждения'
    },
    {
      src: 'photo/3.jpg',
      tag: 'ВЕРА В ТЕБЯ',
      caption: 'Твой главный талисман: у тебя сегодня всё получится!'
    },
    {
      src: 'photo/4.jpg',
      tag: 'НЕЖНОСТЬ',
      caption: 'Осторожно: повышенная вероятность утренних поцелуев'
    },
    {
      src: 'photo/5.jpg',
      tag: 'ЗАВТРАК',
      caption: 'Самый сладкий солнечный котик (не кусать!)'
    },
    {
      src: 'photo/6.jpg',
      tag: 'УЛЫБКА',
      caption: 'Зато решение любить тебя - самое гениальное в жизни'
    },
    {
      src: 'photo/7.jpg',
      tag: 'ВАЖНЫЙ ВОПРОС',
      caption: 'Серьёзное утреннее предложение с весомым аргументом'
    },
    {
      src: 'photo/8.jpg',
      tag: 'САМОЕ ГЛАВНОЕ',
      caption: 'В моём сердце всегда и без очереди - только Ты'
    }
  ];

  let cardLikes = {};
  try {
    cardLikes = JSON.parse(localStorage.getItem('morning_card_likes') || '{}');
  } catch (e) { cardLikes = {}; }

  const gallery = $('#gallery');
  if (gallery) {
    CARDS.forEach((item, i) => {
      const count = cardLikes[i] || 1;
      const isLiked = Boolean(cardLikes[`liked_${i}`]);
      const fig = document.createElement('figure');
      fig.className = 'pic reveal';
      fig.style.setProperty('--d', `${(i % 4) * 0.06}s`);

      fig.innerHTML = `
        <div class="pic-frame" tabindex="0" role="button" aria-label="Открыть открытку ${pad(i + 1)}: ${item.caption}">
          <span class="pic-badge">${item.tag}</span>
          <img class="pic-bg" src="${item.src}" alt="" aria-hidden="true" loading="lazy" decoding="async">
          <img class="pic-img" src="${item.src}" alt="${item.caption}" loading="lazy" decoding="async">
          <button type="button" class="pic-like${isLiked ? ' is-liked' : ''}" aria-label="Поставить сердечко открытке">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            <span class="like-num">${count}</span>
          </button>
        </div>
        <figcaption class="pic-meta">
          <div class="pic-row">
            <span class="pic-num">${pad(i + 1)}</span>
            <span class="pic-line"></span>
          </div>
          <p class="pic-caption">${item.caption}</p>
        </figcaption>
      `;

      const frame = $('.pic-frame', fig);
      const likeBtn = $('.pic-like', fig);
      const likeNum = $('.like-num', fig);

      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        haptic('success');
        cardLikes[i] = (cardLikes[i] || 1) + 1;
        cardLikes[`liked_${i}`] = true;
        likeBtn.classList.add('is-liked');
        likeNum.textContent = String(cardLikes[i]);
        spawnHeart(e.clientX, e.clientY);
        petalBurst(e.clientX, e.clientY, 12);
        try {
          localStorage.setItem('morning_card_likes', JSON.stringify(cardLikes));
        } catch (err) { /* не критично */ }
      });

      frame.addEventListener('click', () => openLb(i));
      frame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLb(i);
        }
      });

      if (finePointer && !reduceMotion) {
        frame.addEventListener('pointermove', (e) => {
          const r = frame.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          frame.style.setProperty('--ry', `${((px - 0.5) * 7).toFixed(2)}deg`);
          frame.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
          frame.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
          frame.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        });
        frame.addEventListener('pointerleave', () => {
          frame.style.setProperty('--rx', '0deg');
          frame.style.setProperty('--ry', '0deg');
        });
      }

      gallery.appendChild(fig);
    });
  }

  // Lightbox
  const lb = $('#lb');
  const lbImg = $('#lbImg');
  const lbCount = $('#lbCount');
  const lbTag = $('#lbTag');
  const lbCaption = $('#lbCaption');
  let lbIndex = 0;

  function showLb(i) {
    lbIndex = (i + CARDS.length) % CARDS.length;
    const item = CARDS[lbIndex];
    if (!lbImg) return;
    lbImg.classList.add('is-switching');
    const pre = new Image();
    pre.onload = pre.onerror = () => {
      lbImg.src = item.src;
      lbImg.alt = item.caption;
      requestAnimationFrame(() => lbImg.classList.remove('is-switching'));
    };
    pre.src = item.src;
    if (lbCount) lbCount.textContent = `${pad(lbIndex + 1)} / ${pad(CARDS.length)}`;
    if (lbTag) lbTag.textContent = `ОТКРЫТКА ${pad(lbIndex + 1)} • ${item.tag}`;
    if (lbCaption) lbCaption.textContent = item.caption;
  }

  function openLb(i) {
    haptic('light');
    showLb(i);
    if (!lb) return;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
  }

  function closeLb() {
    if (!lb) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
  }

  if ($('#lbClose')) $('#lbClose').addEventListener('click', closeLb);
  if ($('#lbPrev')) $('#lbPrev').addEventListener('click', () => { haptic(); showLb(lbIndex - 1); });
  if ($('#lbNext')) $('#lbNext').addEventListener('click', () => { haptic(); showLb(lbIndex + 1); });
  if ($('#lbStage')) {
    $('#lbStage').addEventListener('click', (e) => {
      if (e.target.id === 'lbStage') closeLb();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });

  if (lb) {
    let sx = 0;
    let sy = 0;
    lb.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        haptic('light');
        showLb(lbIndex + (dx < 0 ? 1 : -1));
      } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
        closeLb();
      }
    }, { passive: true });
  }

  // ----------------------------------------------------------
  // 11. Шкатулка утренних пожеланий и обратная весточка
  // ----------------------------------------------------------
  let categories = window.CATEGORIES_DATABASE || [];
  let wishes = window.WISHES_DATABASE || [];
  let activeCategory = 'all';
  let wishPool = wishes.slice();
  let wishIdx = 0;

  const wishCatsEl = $('#wishCategories');
  const wishBody = $('#wishBody');
  const wishTagEl = $('#wishTag');
  const wishTitleEl = $('#wishTitle');
  const wishTextEl = $('#wishText');
  const wishAuthorEl = $('#wishAuthor');
  const wishCounterEl = $('#wishCounter');
  const nextWishBtn = $('#nextWishBtn');
  const shareWishBtn = $('#shareWishBtn');

  function rebuildWishPool() {
    wishPool = activeCategory === 'all'
      ? wishes.slice()
      : wishes.filter((w) => w.category === activeCategory);
    if (wishPool.length === 0) wishPool = wishes.slice();
    wishIdx = 0;
  }

  function renderWish(animate = false) {
    if (!wishPool.length) return;
    const item = wishPool[wishIdx % wishPool.length];
    const apply = () => {
      if (wishTagEl) wishTagEl.textContent = (item.tags || ['утро', 'любовь']).join(' • ').toUpperCase();
      if (wishTitleEl) wishTitleEl.textContent = item.title;
      if (wishTextEl) wishTextEl.textContent = item.text;
      if (wishAuthorEl) wishAuthorEl.textContent = item.author;
      if (wishCounterEl) wishCounterEl.textContent = `${pad((wishIdx % wishPool.length) + 1)} / ${pad(wishPool.length)}`;
    };

    if (!animate || !wishBody) {
      apply();
      return;
    }
    wishBody.classList.add('is-fading');
    setTimeout(() => {
      apply();
      wishBody.classList.remove('is-fading');
    }, 220);
  }

  function renderWishCategories() {
    if (!wishCatsEl) return;
    wishCatsEl.innerHTML = '';
    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cat-btn${cat.id === activeCategory ? ' is-active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', cat.id === activeCategory ? 'true' : 'false');
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        haptic('light');
        activeCategory = cat.id;
        $$('.cat-btn', wishCatsEl).forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        rebuildWishPool();
        renderWish(true);
      });
      wishCatsEl.appendChild(btn);
    });
  }

  renderWishCategories();
  rebuildWishPool();
  renderWish(false);

  // Подгружаем свежие данные с сервера, если он активен
  fetch('/api/wishes')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.wishes) && data.wishes.length > 0) {
        wishes = data.wishes;
        rebuildWishPool();
        renderWish(false);
      }
    })
    .catch(() => { /* используем локальную базу */ });

  if (nextWishBtn) {
    nextWishBtn.addEventListener('click', (e) => {
      haptic('light');
      wishIdx = (wishIdx + 1) % Math.max(1, wishPool.length);
      renderWish(true);
      const r = nextWishBtn.getBoundingClientRect();
      petalBurst(e.clientX || (r.left + r.width / 2), e.clientY || r.top, 18);
    });
  }

  if (shareWishBtn) {
    shareWishBtn.addEventListener('click', (e) => {
      haptic('success');
      const current = wishPool[wishIdx % Math.max(1, wishPool.length)];
      if (!current) return;
      petalBurst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, 24);

      if (tg && tg.initData) {
        try {
          tg.sendData(JSON.stringify({
            type: 'wish_shared',
            text: `${current.title}. ${current.text}`
          }));
          toast('Утренний лучик сохранён в чат');
          return;
        } catch (err) { /* fallback ниже */ }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`«${current.text}»`).catch(() => {});
      }
      toast('Тёплое пожелание бережно сохранено в сердечко');
    });
  }

  // Быстрые реакции и форма ответной весточки
  const replyInput = $('#replyInput');
  const replyForm = $('#replyForm');

  $$('#quickReactions .reaction-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      haptic('light');
      const msg = pill.dataset.msg || '';
      if (replyInput) {
        replyInput.value = msg;
        replyInput.focus();
      }
      spawnHeart(e.clientX, e.clientY);
    });
  });

  if (replyForm) {
    replyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = replyInput ? replyInput.value.trim() : '';
      if (!text) {
        toast('Напиши хотя бы пару нежных слов или выбери кнопку выше');
        return;
      }
      haptic('success');
      const r = replyForm.getBoundingClientRect();
      petalBurst(r.left + r.width / 2, r.top + 30, 46);

      if (tg && tg.initData) {
        try {
          tg.sendData(JSON.stringify({
            type: 'custom_wish',
            recipient: 'Любимого',
            text
          }));
        } catch (err) { /* безопасно продолжаем */ }
      }

      if (replyInput) replyInput.value = '';
      toast('Твоя утренняя весточка улетела с лепестками сакуры!');
    });
  }

  // ----------------------------------------------------------
  // 12. WebGL GLSL Шейдер рассветных лучей (#dawnShader)
  // ----------------------------------------------------------
  function initDawnShader() {
    const canvas = $('#dawnShader');
    if (!canvas || reduceMotion) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;

    const vertSrc = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fragSrc = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform vec2 u_mouse;
      uniform float u_warmth;
      uniform float u_audio;

      vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.7928429 - 0.8537347 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        float t = u_time * 0.16;
        vec2 mOff = (uv - u_mouse) * 0.18;

        // Диагональные солнечные лучи сверху слева
        float rayCoord = (uv.x * 0.85 + (1.0 - uv.y) * 0.45) * 4.2;
        float rays = snoise(vec2(rayCoord - t * 0.35, uv.y * 0.9 + t * 0.18));
        rays = smoothstep(-0.2, 0.85, rays) * smoothstep(0.05, 0.95, uv.y);

        // Шёлковая утренняя дымка
        float silk = snoise(uv * 2.1 + vec2(t * 0.25, -t * 0.15) + mOff);
        float glow = smoothstep(-0.35, 0.8, silk);

        vec3 roseColor = mix(vec3(0.98, 0.58, 0.74), vec3(1.0, 0.76, 0.58), u_warmth);
        vec3 sunColor = mix(vec3(1.0, 0.86, 0.68), vec3(1.0, 0.9, 0.62), u_warmth);

        vec3 col = roseColor * glow * 0.42 + sunColor * rays * (0.44 + u_audio * 0.28);
        gl_FragColor = vec4(col, 0.85);
      }
    `;

    const compile = (src, type) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(vertSrc, gl.VERTEX_SHADER);
    const fs = compile(fragSrc, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uWarmth = gl.getUniformLocation(prog, 'u_warmth');
    const uAudio = gl.getUniformLocation(prog, 'u_audio');

    let mx = 0.35;
    let my = 0.75;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX / Math.max(1, window.innerWidth);
      my = 1.0 - e.clientY / Math.max(1, window.innerHeight);
    }, { passive: true });

    canvas.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const tStart = performance.now();
    const renderShader = () => {
      requestAnimationFrame(renderShader);
      if (document.hidden) return;
      currentWarmth += (targetWarmth - currentWarmth) * 0.04;
      const elapsed = (performance.now() - tStart) * 0.001;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uWarmth, currentWarmth);
      gl.uniform1f(uAudio, audioEnergy);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    requestAnimationFrame(renderShader);
  }
  initDawnShader();

  // ----------------------------------------------------------
  // 13. Холст лепестков сакуры и солнечных пылинок (#petalsCanvas)
  // ----------------------------------------------------------
  const pCanvas = $('#petalsCanvas');
  const pCtx = pCanvas ? pCanvas.getContext('2d') : null;
  let W = window.innerWidth;
  let H = window.innerHeight;
  const ambientPetals = [];
  const burstParticles = [];
  const dewMotes = [];
  let windX = 0;
  let lastPX = W / 2;

  window.addEventListener('pointermove', (e) => {
    const dx = e.clientX - lastPX;
    lastPX = e.clientX;
    windX = Math.max(-2.4, Math.min(2.4, windX + dx * 0.015));
  }, { passive: true });

  function resizePetals() {
    if (!pCtx || !pCanvas) return;
    const dpr = Math.min(1.75, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    pCanvas.width = Math.round(W * dpr);
    pCanvas.height = Math.round(H * dpr);
    pCanvas.style.width = `${W}px`;
    pCanvas.style.height = `${H}px`;
    pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ambientPetals.length = 0;
    const pCount = reduceMotion ? 10 : Math.min(34, Math.max(16, Math.round((W * H) / 42000)));
    for (let i = 0; i < pCount; i++) {
      ambientPetals.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 5.5 + Math.random() * 6.5,
        vy: 0.38 + Math.random() * 0.65,
        vx: -0.25 + Math.random() * 0.55,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.022,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.014,
        alpha: 0.35 + Math.random() * 0.45,
        tint: Math.random() < 0.68 ? 'sakura' : 'gold'
      });
    }

    dewMotes.length = 0;
    const mCount = reduceMotion ? 18 : Math.min(55, Math.round((W * H) / 24000));
    for (let i = 0; i < mCount; i++) {
      dewMotes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.3
      });
    }
  }

  function petalBurst(x, y, count = 36) {
    if (!pCtx || reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.4 + Math.random() * 5.6;
      burstParticles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.9,
        size: 4.5 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        life: 1,
        decay: 0.009 + Math.random() * 0.011,
        isPetal: Math.random() < 0.68
      });
    }
  }

  function drawSakuraPetal(ctx, size, alpha, tint) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.85, -size * 0.75, size * 0.9, size * 0.45, 0, size);
    ctx.bezierCurveTo(-size * 0.9, size * 0.45, -size * 0.85, -size * 0.75, 0, -size);
    ctx.closePath();
    if (tint === 'gold') {
      ctx.fillStyle = `rgba(255, 224, 172, ${alpha.toFixed(3)})`;
    } else {
      ctx.fillStyle = `rgba(255, 182, 206, ${alpha.toFixed(3)})`;
    }
    ctx.fill();
  }

  function animatePetals(t) {
    if (pCtx && !document.hidden) {
      pCtx.clearRect(0, 0, W, H);
      windX *= 0.96;

      // Сияющие утренние пылинки света
      for (const m of dewMotes) {
        const a = 0.16 + 0.54 * (0.5 + 0.5 * Math.sin(t * 0.0012 * m.speed + m.phase));
        pCtx.fillStyle = `rgba(255, 236, 205, ${a.toFixed(3)})`;
        pCtx.beginPath();
        pCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        pCtx.fill();
      }

      // Парящие лепестки сакуры
      if (!reduceMotion) {
        for (const p of ambientPetals) {
          p.sway += p.swaySpeed;
          p.x += p.vx + Math.sin(p.sway) * 0.42 + windX * 0.35;
          p.y += p.vy;
          p.rot += p.vRot;

          if (p.y > H + 24) {
            p.y = -20;
            p.x = Math.random() * W;
          }
          if (p.x > W + 24) p.x = -20;
          if (p.x < -24) p.x = W + 20;

          pCtx.save();
          pCtx.translate(p.x, p.y);
          pCtx.rotate(p.rot);
          pCtx.scale(1, 0.65 + 0.35 * Math.abs(Math.cos(p.sway)));
          drawSakuraPetal(pCtx, p.size, p.alpha, p.tint);
          pCtx.restore();
        }
      }

      // Праздничные вспышки лепестков и солнечных искр
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const b = burstParticles[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.985;
        b.vy = b.vy * 0.985 + 0.045;
        b.rot += b.vRot;
        b.life -= b.decay;
        if (b.life <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }
        pCtx.save();
        pCtx.translate(b.x, b.y);
        pCtx.rotate(b.rot);
        if (b.isPetal) {
          drawSakuraPetal(pCtx, b.size * (0.5 + b.life * 0.5), b.life * 0.9, 'sakura');
        } else {
          pCtx.fillStyle = `rgba(255, 224, 165, ${b.life.toFixed(3)})`;
          pCtx.beginPath();
          pCtx.arc(0, 0, b.size * 0.36, 0, Math.PI * 2);
          pCtx.fill();
        }
        pCtx.restore();
      }
    }
    requestAnimationFrame(animatePetals);
  }

  window.addEventListener('resize', resizePetals);
  resizePetals();
  requestAnimationFrame(animatePetals);

  // ----------------------------------------------------------
  // 14. Финал: Солнечный поцелуй (#sunKissBtn)
  // ----------------------------------------------------------
  const SUN_KISSES = [
    'Лови самый тёплый утренний поцелуй в сонную щёчку!',
    'Улыбнись, моё солнышко - сегодня всё сложится чудесно',
    'Ты моя самая большая гордость и любимая умничка',
    'Крепко-крепко обнимаю и делюсь с тобой всем своим теплом',
    'Моё любимое дело с самого утра - думать только о тебе',
    'Пусть каждая минута этого дня радует тебя так же, как ты меня!'
  ];
  let kissCounter = 0;

  const sunKissBtn = $('#sunKissBtn');
  const sunKissHint = $('#sunKissHint');
  if (sunKissBtn) {
    sunKissBtn.addEventListener('click', (e) => {
      haptic('success');
      const r = sunKissBtn.getBoundingClientRect();
      const cx = e.clientX || (r.left + r.width / 2);
      const cy = e.clientY || (r.top + r.height / 2);

      petalBurst(cx, cy, 64);
      setTimeout(() => petalBurst(window.innerWidth * 0.25, window.innerHeight * 0.35, 28), 180);
      setTimeout(() => petalBurst(window.innerWidth * 0.75, window.innerHeight * 0.35, 28), 340);

      spawnHeart(cx, cy - 12);
      toast(SUN_KISSES[kissCounter % SUN_KISSES.length]);
      kissCounter++;

      if (sunKissHint) {
        sunKissHint.textContent = 'солнечный поцелуй пойман и уже греет твои щёчки';
        sunKissHint.classList.add('is-done');
      }
    });
  }
})();
