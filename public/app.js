// ============================================================
// Доброе утро | логика страницы
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
  // 1. Telegram WebApp
  // ----------------------------------------------------------
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#150a13');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#150a13');
    } catch (e) { /* вне Telegram не критично */ }
  }

  function haptic(type = 'light') {
    try {
      if (tg && tg.HapticFeedback) {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(type);
      } else if (navigator.vibrate) {
        navigator.vibrate(type === 'success' ? [12, 36, 12] : 8);
      }
    } catch (e) { /* игнор */ }
  }

  // ----------------------------------------------------------
  // 2. Уведомления
  // ----------------------------------------------------------
  const toastsEl = $('#toasts');
  function toast(text) {
    if (!toastsEl) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    toastsEl.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ----------------------------------------------------------
  // 3. Дата, часы и переключатель света
  // ----------------------------------------------------------
  const now = new Date();
  const hour = now.getHours();
  const partOfDay = hour < 5 || hour >= 22 ? 'ночь' : hour >= 18 ? 'вечер' : hour >= 12 ? 'день' : 'утро';
  const introDate = $('#introDate');
  if (introDate) {
    const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    introDate.textContent = `${dateStr} • ${partOfDay}`;
  }

  const issueNo = $('#issueNo');
  if (issueNo) {
    const start = new Date(now.getFullYear(), 0, 0);
    issueNo.textContent = pad(Math.floor((now - start) / 86400000), 3);
  }

  const heroTime = $('#heroTime');
  function tickClock() {
    if (!heroTime) return;
    const d = new Date();
    heroTime.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  tickClock();
  setInterval(tickClock, 15000);

  let isSunlitMood = false;
  const moodToggle = $('#moodToggle');
  const moodLabel = $('#moodLabel');
  if (moodToggle) {
    moodToggle.addEventListener('click', () => {
      haptic('light');
      isSunlitMood = !isSunlitMood;
      if (isSunlitMood) {
        root.setAttribute('data-mood', 'sunlit');
        if (moodLabel) moodLabel.textContent = 'Тёплый свет';
      } else {
        root.removeAttribute('data-mood');
        if (moodLabel) moodLabel.textContent = 'Розовый свет';
      }
    });
  }

  // ----------------------------------------------------------
  // 4. Плавный скролл Lenis + GSAP
  // ----------------------------------------------------------
  let lenis = null;

  function initSmoothMotion() {
    if (reduceMotion || lenis) return;

    if (window.Lenis) {
      try {
        lenis = new window.Lenis({
          duration: 1.18,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          syncTouch: false
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

    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (target && lenis) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -24 });
        }
      });
    });
  }

  window.addEventListener('load', initSmoothMotion);

  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.22;
        btn.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  if (finePointer) {
    $$('.bento-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
        if (!reduceMotion) {
          const px = x / r.width - 0.5;
          const py = y / r.height - 0.5;
          card.style.setProperty('--ry', `${(px * 3.5).toFixed(2)}deg`);
          card.style.setProperty('--rx', `${(-py * 3.5).toFixed(2)}deg`);
        }
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ----------------------------------------------------------
  // 5. Плеер и визуализатор спектра
  // ----------------------------------------------------------
  const PLAYLIST = [
    {
      id: 'eternity',
      src: 'eternity.mp3',
      short: '01 • Eternity',
      title: 'Eternity',
      artist: 'Stellardrone',
      durHint: '03:33'
    },
    {
      id: 'reverie',
      src: 'reverie.mp3',
      short: '02 • Reverie',
      title: 'Reverie',
      artist: 'Scott Buckley',
      durHint: '03:43'
    },
    {
      id: 'stardome',
      src: 'stardome.mp3',
      short: '03 • Stardome',
      title: 'Stardome',
      artist: 'oneheart, antent, dean korso',
      durHint: '03:38'
    },
    {
      id: 'snowfall',
      src: 'snowfall.mp3',
      short: '04 • Snowfall',
      title: 'Snowfall',
      artist: 'oneheart, reidenshi',
      durHint: '02:03'
    },
    {
      id: 'apathy',
      src: 'oneheart.mp3',
      short: '05 • Apathy',
      title: 'Apathy',
      artist: 'oneheart',
      durHint: '02:23'
    },
    {
      id: 'horizon',
      src: 'morning-ambient.mp3',
      short: '06 • Horizon',
      title: 'Horizon',
      artist: 'StimiBeats',
      durHint: '04:55'
    }
  ];

  const music = $('#bgMusic');
  const navPlayer = $('#navPlayer');
  const navPlayBtn = $('#navPlayBtn');
  const studioPlayBtn = $('#studioPlayBtn');
  const prevTrackBtn = $('#prevTrackBtn');
  const nextTrackBtn = $('#nextTrackBtn');
  const vinylWrap = $('#vinylWrap');
  const npTitle = $('#npTitle');
  const npArtist = $('#npArtist');
  const studioTitle = $('#studioTitle');
  const studioArtist = $('#studioArtist');
  const scrubBar = $('#scrubBar');
  const scrubFill = $('#scrubFill');
  const timeCur = $('#timeCur');
  const timeDur = $('#timeDur');
  const trackPillsEl = $('#trackPills');
  const spectrumCv = $('#audioSpectrum');
  const spectrumCtx = spectrumCv ? spectrumCv.getContext('2d') : null;

  let trackIndex = 0;
  let actx = null;
  let gainNode = null;
  let analyser = null;
  let freqData = null;
  let audioEnergy = 0;
  let fadeRaf = 0;

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
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.84;
      freqData = new Uint8Array(analyser.frequencyBinCount);

      gainNode = actx.createGain();
      gainNode.gain.value = 0.92;

      src.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(actx.destination);
    } catch (e) {
      actx = null;
      gainNode = null;
      analyser = null;
    }
  }

  function fadeMusicTo(target, ms) {
    if (gainNode && actx) {
      const t = actx.currentTime;
      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(gainNode.gain.value, t);
      gainNode.gain.linearRampToValueAtTime(target, t + ms / 1000);
      return;
    }
    if (!music) return;
    cancelAnimationFrame(fadeRaf);
    const from = music.volume;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      music.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k < 1) fadeRaf = requestAnimationFrame(step);
    };
    fadeRaf = requestAnimationFrame(step);
  }

  function syncPlayerUI(playing) {
    if (navPlayer) navPlayer.classList.toggle('is-playing', playing);
    if (studioPlayBtn) studioPlayBtn.classList.toggle('is-playing', playing);
    if (vinylWrap) vinylWrap.classList.toggle('is-spinning', playing);
  }

  function renderTrackMeta() {
    const tr = PLAYLIST[trackIndex];
    if (npTitle) npTitle.textContent = tr.title;
    if (npArtist) npArtist.textContent = tr.artist;
    if (studioTitle) studioTitle.textContent = tr.title;
    if (studioArtist) studioArtist.textContent = tr.artist;
    if (timeDur) timeDur.textContent = tr.durHint;

    if (trackPillsEl) {
      $$('.track-pill', trackPillsEl).forEach((btn, idx) => {
        btn.classList.toggle('is-active', idx === trackIndex);
        btn.setAttribute('aria-selected', idx === trackIndex ? 'true' : 'false');
      });
    }
  }

  function playMusic() {
    if (!music) return;
    setupAudioGraph();
    if (actx && actx.state === 'suspended') {
      actx.resume().catch(() => {});
    }
    const p = music.play();
    if (p && p.catch) {
      p.catch(() => syncPlayerUI(false));
    }
  }

  function loadTrack(idx, autoplay = true) {
    trackIndex = (idx + PLAYLIST.length) % PLAYLIST.length;
    const tr = PLAYLIST[trackIndex];
    renderTrackMeta();
    if (!music) return;
    music.src = tr.src;
    music.load();
    if (scrubFill) scrubFill.style.width = '0%';
    if (timeCur) timeCur.textContent = '00:00';
    if (autoplay) {
      playMusic();
    }
  }

  function toggleMusic() {
    haptic('light');
    if (!music) return;
    if (!music.paused) {
      music.pause();
    } else {
      playMusic();
    }
  }

  if (trackPillsEl) {
    PLAYLIST.forEach((tr, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `track-pill${idx === 0 ? ' is-active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.textContent = tr.short;
      btn.addEventListener('click', () => {
        haptic('light');
        loadTrack(idx, true);
      });
      trackPillsEl.appendChild(btn);
    });
  }
  renderTrackMeta();

  if (music) {
    music.addEventListener('play', () => syncPlayerUI(true));
    music.addEventListener('pause', () => syncPlayerUI(false));
    music.addEventListener('ended', () => loadTrack(trackIndex + 1, true));
    music.addEventListener('loadedmetadata', () => {
      if (timeDur && Number.isFinite(music.duration) && music.duration > 0) {
        timeDur.textContent = formatTime(music.duration);
      }
    });
    music.addEventListener('timeupdate', () => {
      if (!Number.isFinite(music.duration) || music.duration <= 0) return;
      const pct = (music.currentTime / music.duration) * 100;
      if (scrubFill) scrubFill.style.width = `${pct.toFixed(2)}%`;
      if (timeCur) timeCur.textContent = formatTime(music.currentTime);
      if (scrubBar) scrubBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    });
  }

  if (navPlayBtn) navPlayBtn.addEventListener('click', toggleMusic);
  if (studioPlayBtn) studioPlayBtn.addEventListener('click', toggleMusic);
  if (prevTrackBtn) prevTrackBtn.addEventListener('click', () => { haptic(); loadTrack(trackIndex - 1, true); });
  if (nextTrackBtn) nextTrackBtn.addEventListener('click', () => { haptic(); loadTrack(trackIndex + 1, true); });

  if (scrubBar && music) {
    scrubBar.addEventListener('click', (e) => {
      if (!Number.isFinite(music.duration) || music.duration <= 0) return;
      const r = scrubBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      music.currentTime = ratio * music.duration;
    });
  }

  $$('.layer-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      haptic('light');
      const preset = chip.dataset.layer || 'off';
      $$('.layer-chip').forEach((c) => c.classList.toggle('is-active', c === chip));
      if (window.MorningAudio) {
        window.MorningAudio.play(preset);
      }
    });
  });

  function drawSpectrum(t) {
    if (spectrumCtx && spectrumCv) {
      const w = spectrumCv.width;
      const h = spectrumCv.height;
      spectrumCtx.clearRect(0, 0, w, h);

      const bars = 28;
      const gap = 5;
      const barW = (w - gap * (bars + 1)) / bars;
      const playing = music && !music.paused;

      if (analyser && freqData && playing) {
        analyser.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < 12; i++) sum += freqData[i];
        audioEnergy = sum / (12 * 255);
      } else {
        audioEnergy *= 0.92;
      }

      for (let i = 0; i < bars; i++) {
        let norm = 0.14;
        if (analyser && freqData && playing) {
          const bin = Math.min(freqData.length - 1, Math.floor((i / bars) * 20));
          norm = Math.max(0.12, (freqData[bin] / 255) * 0.92);
        } else if (playing) {
          norm = 0.18 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.003 + i * 0.45));
        }

        const bh = Math.max(5, norm * (h - 14));
        const x = gap + i * (barW + gap);
        const y = (h - bh) / 2;

        const grad = spectrumCtx.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, isSunlitMood ? 'rgba(253, 230, 138, 0.92)' : 'rgba(249, 168, 212, 0.92)');
        grad.addColorStop(1, isSunlitMood ? 'rgba(251, 113, 133, 0.55)' : 'rgba(253, 230, 138, 0.55)');

        spectrumCtx.fillStyle = grad;
        spectrumCtx.beginPath();
        if (spectrumCtx.roundRect) spectrumCtx.roundRect(x, y, barW, bh, 4);
        else spectrumCtx.rect(x, y, barW, bh);
        spectrumCtx.fill();
      }
    }
    requestAnimationFrame(drawSpectrum);
  }
  requestAnimationFrame(drawSpectrum);

  // ----------------------------------------------------------
  // 6. Интро
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

  function enterMorningPortal() {
    if (body.classList.contains('is-ready')) return;
    haptic('medium');

    setupAudioGraph();
    if (gainNode) gainNode.gain.value = 0;
    else if (music) music.volume = 0;
    playMusic();
    fadeMusicTo(0.92, 2600);

    if (intro) intro.classList.add('is-gone');
    body.classList.remove('is-locked');
    body.classList.add('is-ready');

    initSmoothMotion();
    spawnPetalBurst(window.innerWidth / 2, window.innerHeight * 0.42, 36);
    setTimeout(startReveals, 200);
  }

  const introBtn = $('#introBtn');
  if (introBtn) introBtn.addEventListener('click', enterMorningPortal);
  if (new URLSearchParams(window.location.search).get('open') === '1') {
    setTimeout(enterMorningPortal, 120);
  }

  // ----------------------------------------------------------
  // 7. Прогресс скролла и пятно света за курсором
  // ----------------------------------------------------------
  const nav = $('#nav');
  const progress = $('#progress');
  let scrollTick = false;

  function updateScrollProgress() {
    const y = window.scrollY || root.scrollTop;
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    if (progress) progress.style.transform = `scaleX(${p.toFixed(4)})`;
    root.style.setProperty('--sp', p.toFixed(3));
    if (nav) nav.classList.toggle('is-scrolled', y > 36);
    scrollTick = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(updateScrollProgress);
    }
  }, { passive: true });
  updateScrollProgress();

  if (finePointer && !reduceMotion) {
    const glow = $('#cursorGlow');
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });
    const moveGlow = () => {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      if (glow) glow.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      requestAnimationFrame(moveGlow);
    };
    moveGlow();
  }

  // ----------------------------------------------------------
  // 8. План минимум на утро
  // ----------------------------------------------------------
  const ritualItems = $$('.ritual-item');
  const ritualCount = $('#ritualCount');
  let completedCelebrated = false;

  function updateRituals() {
    const done = ritualItems.filter((item) => item.classList.contains('is-done')).length;
    if (ritualCount) ritualCount.textContent = `${done} / ${ritualItems.length}`;
    if (done === ritualItems.length && !completedCelebrated) {
      completedCelebrated = true;
      haptic('success');
      spawnPetalBurst(window.innerWidth / 2, window.innerHeight / 2, 55);
      toast('План выполнен, ты умничка 💛');
    } else if (done < ritualItems.length) {
      completedCelebrated = false;
    }
  }

  ritualItems.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      haptic('light');
      btn.classList.toggle('is-done');
      if (btn.classList.contains('is-done')) {
        const r = btn.getBoundingClientRect();
        spawnPetalBurst(e.clientX || (r.left + 24), e.clientY || (r.top + 20), 12);
      }
      updateRituals();
    });
  });

  // ----------------------------------------------------------
  // 9. Галерея (8 картинок без лишних подписей)
  // ----------------------------------------------------------
  const PICS = Array.from({ length: 8 }, (_, i) => `photo/${i + 1}.jpg`);

  const gallery = $('#gallery');
  const viewGridBtn = $('#viewGridBtn');
  const viewLargeBtn = $('#viewLargeBtn');

  if (viewGridBtn && viewLargeBtn && gallery) {
    viewGridBtn.addEventListener('click', () => {
      haptic('light');
      gallery.classList.remove('is-large');
      viewGridBtn.classList.add('is-active');
      viewLargeBtn.classList.remove('is-active');
    });
    viewLargeBtn.addEventListener('click', () => {
      haptic('light');
      gallery.classList.add('is-large');
      viewLargeBtn.classList.add('is-active');
      viewGridBtn.classList.remove('is-active');
    });
  }

  if (gallery) {
    PICS.forEach((src, i) => {
      const fig = document.createElement('figure');
      fig.className = 'pic reveal';
      fig.style.setProperty('--d', `${(i % 4) * 0.07}s`);

      fig.innerHTML = `
        <div class="pic-frame" tabindex="0" role="button" aria-label="Картинка ${pad(i + 1)}">
          <img class="pic-bg" src="${src}" alt="" aria-hidden="true" loading="lazy" decoding="async">
          <img class="pic-img" src="${src}" alt="Картинка ${pad(i + 1)}" loading="lazy" decoding="async">
        </div>
        <figcaption class="pic-caption">
          <span class="pic-num">${pad(i + 1)}</span>
          <span class="pic-line"></span>
          <span class="pic-of">/ ${pad(PICS.length)}</span>
        </figcaption>
      `;

      const frame = $('.pic-frame', fig);

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

  // Просмотр картинки
  const lb = $('#lb');
  const lbImg = $('#lbImg');
  const lbCount = $('#lbCount');
  let lbIndex = 0;

  function showLb(i) {
    lbIndex = (i + PICS.length) % PICS.length;
    const src = PICS[lbIndex];
    if (!lbImg) return;
    lbImg.classList.add('is-switching');
    const pre = new Image();
    pre.onload = pre.onerror = () => {
      lbImg.src = src;
      lbImg.alt = `Картинка ${pad(lbIndex + 1)}`;
      requestAnimationFrame(() => lbImg.classList.remove('is-switching'));
    };
    pre.src = src;
    if (lbCount) lbCount.textContent = `${pad(lbIndex + 1)} / ${pad(PICS.length)}`;
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
        haptic();
        showLb(lbIndex + (dx < 0 ? 1 : -1));
      } else if (dy > 85 && Math.abs(dy) > Math.abs(dx)) {
        closeLb();
      }
    }, { passive: true });
  }

  // ----------------------------------------------------------
  // 10. WebGL шейдер утренних лучей
  // ----------------------------------------------------------
  function initDawnShader() {
    const canvas = $('#dawnShader');
    if (!canvas || reduceMotion) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;

    const vertSrc = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragSrc = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_audio;
      uniform float u_sunlit;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float t = u_time * 0.18;

        vec2 rayCoord = vec2(uv.x * 2.6 - uv.y * 1.1 + (u_mouse.x - 0.5) * 0.25, t * 0.5);
        float rays = noise(rayCoord * 2.4) * 0.65 + noise(rayCoord * 5.2 - t) * 0.35;
        float topMask = smoothstep(0.05, 0.98, uv.y);
        float sunGlow = pow(max(0.0, 1.0 - length(uv - vec2(0.32 + (u_mouse.x - 0.5) * 0.12, 0.92))), 2.2);
        float mist = noise(uv * 3.0 + vec2(t * 0.4, -t * 0.25));

        vec3 roseDawn = vec3(0.96, 0.54, 0.74);
        vec3 goldSun  = vec3(1.00, 0.84, 0.56);
        vec3 warmCoral = vec3(0.98, 0.62, 0.52);

        vec3 tintA = mix(roseDawn, goldSun, u_sunlit * 0.65);
        vec3 tintB = mix(goldSun, warmCoral, u_sunlit * 0.5);

        float intensity = (rays * topMask * 0.32 + sunGlow * 0.42 + mist * 0.10) * (1.0 + u_audio * 0.45);
        vec3 col = mix(tintA, tintB, smoothstep(0.2, 0.85, uv.y + mist * 0.2)) * intensity;

        gl_FragColor = vec4(col, clamp(intensity, 0.0, 0.75));
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

    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uAudio = gl.getUniformLocation(prog, 'u_audio');
    const uSunlit = gl.getUniformLocation(prog, 'u_sunlit');

    let mx = 0.5;
    let my = 0.7;
    let curSunlit = 0;

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX / Math.max(1, window.innerWidth);
      my = 1.0 - e.clientY / Math.max(1, window.innerHeight);
    }, { passive: true });

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

    const t0 = performance.now();
    const render = () => {
      requestAnimationFrame(render);
      if (document.hidden) return;
      const elapsed = (performance.now() - t0) * 0.001;
      curSunlit += ((isSunlitMood ? 1 : 0) - curSunlit) * 0.04;

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uAudio, audioEnergy);
      gl.uniform1f(uSunlit, curSunlit);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    requestAnimationFrame(render);
  }
  initDawnShader();

  // ----------------------------------------------------------
  // 11. Лепестки и солнечные искры
  // ----------------------------------------------------------
  const pCv = $('#petalsCanvas');
  const pCtx = pCv ? pCv.getContext('2d') : null;
  let PW = 0;
  let PH = 0;
  const ambientPetals = [];
  const burstParticles = [];
  let windX = 0;
  let lastPX = null;

  window.addEventListener('pointermove', (e) => {
    if (lastPX !== null) {
      windX = Math.max(-2.4, Math.min(2.4, windX + (e.clientX - lastPX) * 0.015));
    }
    lastPX = e.clientX;
  }, { passive: true });

  function resizePetals() {
    if (!pCtx || !pCv) return;
    const dpr = Math.min(1.75, window.devicePixelRatio || 1);
    PW = window.innerWidth;
    PH = window.innerHeight;
    pCv.width = Math.round(PW * dpr);
    pCv.height = Math.round(PH * dpr);
    pCv.style.width = `${PW}px`;
    pCv.style.height = `${PH}px`;
    pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ambientPetals.length = 0;
    if (reduceMotion) return;
    const count = Math.round(Math.min(44, Math.max(18, (PW * PH) / 36000)));
    for (let i = 0; i < count; i++) {
      ambientPetals.push({
        x: Math.random() * PW,
        y: Math.random() * PH,
        size: 4.5 + Math.random() * 6.5,
        vy: 0.38 + Math.random() * 0.65,
        vx: -0.25 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.022,
        sway: Math.random() * Math.PI * 2,
        isMote: Math.random() < 0.42,
        alpha: 0.32 + Math.random() * 0.45
      });
    }
  }

  function spawnPetalBurst(x, y, count = 48) {
    if (!pCtx || reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 6.2;
      burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2,
        size: 4 + Math.random() * 6.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.09,
        life: 1,
        decay: 0.008 + Math.random() * 0.011,
        isGold: Math.random() < 0.45
      });
    }
  }

  function drawPetalShape(ctx, x, y, size, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.85, -size * 0.55, size * 0.75, size * 0.65, 0, size);
    ctx.bezierCurveTo(-size * 0.75, size * 0.65, -size * 0.85, -size * 0.55, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  function animatePetals(t) {
    if (!pCtx) return;
    if (!document.hidden) {
      pCtx.clearRect(0, 0, PW, PH);
      windX *= 0.96;

      for (const p of ambientPetals) {
        p.sway += 0.016;
        p.x += p.vx + Math.sin(p.sway) * 0.42 + windX * 0.45;
        p.y += p.vy;
        p.rot += p.vRot;

        if (p.y > PH + 20) {
          p.y = -18;
          p.x = Math.random() * PW;
        }
        if (p.x > PW + 20) p.x = -18;
        if (p.x < -20) p.x = PW + 18;

        if (p.isMote) {
          const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.002 + p.sway));
          pCtx.fillStyle = `rgba(253, 230, 138, ${(p.alpha * pulse).toFixed(3)})`;
          pCtx.beginPath();
          pCtx.arc(p.x, p.y, p.size * 0.26, 0, Math.PI * 2);
          pCtx.fill();
        } else {
          const col = isSunlitMood ? '#fed7aa' : '#fbcfe8';
          drawPetalShape(pCtx, p.x, p.y, p.size, p.rot, col, p.alpha);
        }
      }

      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const b = burstParticles[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.985;
        b.vy = b.vy * 0.985 + 0.065;
        b.rot += b.vRot;
        b.life -= b.decay;
        if (b.life <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }
        if (b.isGold) {
          pCtx.fillStyle = `rgba(253, 230, 138, ${b.life.toFixed(3)})`;
          pCtx.beginPath();
          pCtx.arc(b.x, b.y, b.size * 0.36, 0, Math.PI * 2);
          pCtx.fill();
        } else {
          drawPetalShape(pCtx, b.x, b.y, b.size, b.rot, '#f9a8d4', b.life);
        }
      }
    }
    requestAnimationFrame(animatePetals);
  }

  window.addEventListener('resize', resizePetals);
  resizePetals();
  requestAnimationFrame(animatePetals);

  // ----------------------------------------------------------
  // 12. Финал
  // ----------------------------------------------------------
  const MESSAGES = [
    'Доброе утро, моя хорошая ☀️',
    'Не забудь нормально позавтракать ☕',
    'Ты у меня большая умничка 💛',
    'Обнимаю крепко-крепко 🌸',
    'Хорошего тебе дня, я рядом ✨'
  ];
  let msgIdx = 0;

  const sunKissBtn = $('#sunKissBtn');
  const sunHint = $('#sunHint');
  if (sunKissBtn) {
    sunKissBtn.addEventListener('click', (e) => {
      haptic('success');
      const r = sunKissBtn.getBoundingClientRect();
      const cx = e.clientX || (r.left + r.width / 2);
      const cy = e.clientY || (r.top + r.height / 2);
      spawnPetalBurst(cx, cy, 80);
      setTimeout(() => spawnPetalBurst(PW * 0.25, PH * 0.35, 32), 180);
      setTimeout(() => spawnPetalBurst(PW * 0.75, PH * 0.35, 32), 340);

      toast(MESSAGES[msgIdx % MESSAGES.length]);
      msgIdx++;

      if (sunHint) {
        sunHint.textContent = 'летит прямо к тебе';
        sunHint.classList.add('is-done');
      }
    });
  }
})();
