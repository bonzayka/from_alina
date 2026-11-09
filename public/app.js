// ============================================================
// Спокойной ночи | логика страницы
// Правило: только обычные дефисы (-), без длинных тире.
// ============================================================

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const body = document.body;

  // ----------------------------------------------------------
  // Telegram WebApp
  // ----------------------------------------------------------
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#05060c');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#05060c');
    } catch (e) { /* не критично */ }
  }

  function haptic(type = 'light') {
    try {
      if (tg && tg.HapticFeedback) {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(type);
      } else if (navigator.vibrate) {
        navigator.vibrate(type === 'success' ? [12, 40, 12] : 8);
      }
    } catch (e) { /* не критично */ }
  }

  // ----------------------------------------------------------
  // Иконки
  // ----------------------------------------------------------
  const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.2"/><rect x="14" y="4" width="4" height="16" rx="1.2"/></svg>',
    soundOn: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
    soundOff: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>`,
    full: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>`
  };

  // ----------------------------------------------------------
  // Уведомления
  // ----------------------------------------------------------
  const toastsEl = $('#toasts');
  function toast(text) {
    if (!toastsEl) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    toastsEl.appendChild(el);
    setTimeout(() => el.remove(), 3300);
  }

  // ----------------------------------------------------------
  // Дата, время, номер выпуска
  // ----------------------------------------------------------
  const now = new Date();
  const hour = now.getHours();
  const partOfDay = hour < 5 || hour >= 22 ? 'ночь' : hour >= 18 ? 'вечер' : hour >= 12 ? 'день' : 'утро';
  const introDate = $('#introDate');
  if (introDate) {
    introDate.textContent = `${now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} • ${partOfDay}`;
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
  setInterval(tickClock, 20000);

  // ----------------------------------------------------------
  // Фоновое видео
  // ----------------------------------------------------------
  const bgVideo = $('#bgVideo');
  function startBgVideo() {
    if (!bgVideo) return;
    const p = bgVideo.play();
    if (p && p.catch) p.catch(() => {});
  }
  if (bgVideo) {
    bgVideo.muted = true;
    const showVideo = () => bgVideo.classList.add('is-on');
    bgVideo.addEventListener('playing', showVideo);
    if (!bgVideo.paused) showVideo();
    startBgVideo();
  }

  // ----------------------------------------------------------
  // Музыка + приглушение на 70% во время видео
  // Web Audio GainNode работает и на iPhone (там audio.volume не меняется)
  // ----------------------------------------------------------
  const music = $('#bgMusic');
  const player = $('#player');
  const BASE = 1;
  const DUCK = 0.3; // 30% громкости = тише на 70%

  let actx = null;
  let gain = null;
  let ducked = false;
  let fadeRaf = 0;

  function setupAudioGraph() {
    if (actx || !music) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      actx = new AC();
      const src = actx.createMediaElementSource(music);
      gain = actx.createGain();
      gain.gain.value = BASE;
      src.connect(gain);
      gain.connect(actx.destination);
    } catch (e) {
      actx = null;
      gain = null;
    }
  }

  function setLevel(target, ms) {
    if (gain && actx) {
      const t = actx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(target, t + ms / 1000);
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

  function setMusicUI(on) {
    if (player) player.classList.toggle('is-playing', on);
  }

  function playMusic() {
    if (!music) return;
    setupAudioGraph();
    if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
    const p = music.play();
    if (p && p.catch) p.catch(() => setMusicUI(false));
  }

  if (music) {
    music.addEventListener('play', () => setMusicUI(true));
    music.addEventListener('pause', () => setMusicUI(false));
  }

  function duck(on) {
    if (ducked === on) return;
    ducked = on;
    setLevel(on ? BASE * DUCK : BASE, on ? 450 : 1100);
    if (player) player.classList.toggle('is-ducked', on);
  }

  const playerBtn = $('#playerBtn');
  if (playerBtn) {
    playerBtn.addEventListener('click', () => {
      haptic();
      if (music && !music.paused) music.pause();
      else playMusic();
    });
  }

  // ----------------------------------------------------------
  // Интро
  // ----------------------------------------------------------
  const intro = $('#intro');
  requestAnimationFrame(() => setTimeout(() => intro && intro.classList.add('in'), 80));

  function enter() {
    if (body.classList.contains('is-ready')) return;
    haptic('medium');

    // Мягкий вход музыки с нуля
    setupAudioGraph();
    if (gain) gain.gain.value = 0;
    else if (music) music.volume = 0;
    playMusic();
    setLevel(ducked ? BASE * DUCK : BASE, 2600);

    startBgVideo();
    if (intro) intro.classList.add('is-gone');
    body.classList.remove('is-locked');
    body.classList.add('is-ready');
    setTimeout(startReveals, 250);
  }

  const introBtn = $('#introBtn');
  if (introBtn) introBtn.addEventListener('click', enter);
  else enter();

  // ----------------------------------------------------------
  // Появление элементов при скролле
  // ----------------------------------------------------------
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
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  }

  // ----------------------------------------------------------
  // Скролл: прогресс, навигация, затемнение фона
  // ----------------------------------------------------------
  const nav = $('#nav');
  const progress = $('#progress');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || root.scrollTop;
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    if (progress) progress.style.transform = `scaleX(${p})`;
    root.style.setProperty('--sp', p.toFixed(3));
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // ----------------------------------------------------------
  // Световое пятно за курсором (только мышь)
  // ----------------------------------------------------------
  if (finePointer) {
    const glow = $('#cursorGlow');
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      if (glow) glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ----------------------------------------------------------
  // 01. Галерея
  // ----------------------------------------------------------
  const PICS = Array.from({ length: 9 }, (_, i) => `photo/${i + 1}.jpg`);
  const gallery = $('#gallery');

  PICS.forEach((src, i) => {
    const fig = document.createElement('figure');
    fig.className = 'pic reveal';
    fig.tabIndex = 0;
    fig.style.setProperty('--d', `${(i % 3) * 0.09}s`);
    fig.innerHTML = `
      <div class="pic-frame">
        <img class="pic-bg" src="${src}" alt="" aria-hidden="true" loading="lazy" decoding="async">
        <img class="pic-img" src="${src}" alt="Картинка ${pad(i + 1)}" loading="lazy" decoding="async">
      </div>
      <figcaption>
        <span class="pic-num">${pad(i + 1)}</span>
        <span class="pic-line"></span>
        <span class="pic-of">/ ${pad(PICS.length)}</span>
      </figcaption>`;

    fig.addEventListener('click', () => openLb(i));
    fig.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });

    if (finePointer) {
      const frame = fig.firstElementChild;
      fig.addEventListener('pointermove', (e) => {
        const r = frame.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        frame.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
        frame.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
        frame.style.setProperty('--mx', `${px * 100}%`);
        frame.style.setProperty('--my', `${py * 100}%`);
      });
      fig.addEventListener('pointerleave', () => {
        frame.style.setProperty('--rx', '0deg');
        frame.style.setProperty('--ry', '0deg');
      });
    }

    if (gallery) gallery.appendChild(fig);
  });

  // Просмотр картинки
  const lb = $('#lb');
  const lbImg = $('#lbImg');
  const lbCount = $('#lbCount');
  let lbIndex = 0;

  function showLb(i) {
    lbIndex = (i + PICS.length) % PICS.length;
    const src = PICS[lbIndex];
    lbImg.classList.add('is-switching');
    const pre = new Image();
    pre.onload = pre.onerror = () => {
      lbImg.src = src;
      lbImg.alt = `Картинка ${pad(lbIndex + 1)}`;
      requestAnimationFrame(() => lbImg.classList.remove('is-switching'));
    };
    pre.src = src;
    lbCount.textContent = `${pad(lbIndex + 1)} / ${pad(PICS.length)}`;
  }

  function openLb(i) {
    haptic();
    showLb(i);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
  }

  function closeLb() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
  }

  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => { haptic(); showLb(lbIndex - 1); });
  $('#lbNext').addEventListener('click', () => { haptic(); showLb(lbIndex + 1); });
  $('#lbStage').addEventListener('click', (e) => { if (e.target.id === 'lbStage') closeLb(); });

  window.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });

  let lbSX = 0;
  let lbSY = 0;
  lb.addEventListener('touchstart', (e) => { lbSX = e.touches[0].clientX; lbSY = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - lbSX;
    const dy = e.changedTouches[0].clientY - lbSY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { haptic(); showLb(lbIndex + (dx < 0 ? 1 : -1)); }
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLb();
  }, { passive: true });

  // ----------------------------------------------------------
  // 02. Видео-карусель
  // ----------------------------------------------------------
  const CLIPS = ['video/video1.mp4', 'video/video2.mp4', 'video/video3.mp4'];
  const stage = $('#reelsStage');
  const dotsWrap = $('#reelDots');
  let cur = 0;
  let suppressClick = false;

  const reels = CLIPS.map((src, i) => {
    const el = document.createElement('div');
    el.className = 'reel';
    el.innerHTML = `
      <video src="${src}#t=0.1" playsinline webkit-playsinline preload="metadata"></video>
      <div class="reel-ui">
        <div class="reel-top">
          <span class="reel-num">${pad(i + 1)} / ${pad(CLIPS.length)}</span>
          <button class="reel-icon reel-full" type="button" aria-label="На весь экран">${ICON.full}</button>
        </div>
        <button class="reel-play" type="button" aria-label="Смотреть">${ICON.play}</button>
        <div class="reel-bar">
          <button class="reel-icon reel-sound" type="button" aria-label="Звук видео"><span class="s-on">${ICON.soundOn}</span><span class="s-off">${ICON.soundOff}</span></button>
          <div class="reel-progress" aria-label="Перемотка"><i></i></div>
          <button class="reel-icon reel-pp" type="button" aria-label="Пауза"><span class="p-play">${ICON.play}</span><span class="p-pause">${ICON.pause}</span></button>
        </div>
      </div>`;
    stage.appendChild(el);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Видео ${i + 1}`);
    dot.addEventListener('click', () => { haptic(); go(i); });
    dotsWrap.appendChild(dot);

    return el;
  });

  const videoOf = (el) => el.querySelector('video');

  function syncDuck() {
    duck(reels.some((el) => {
      const v = videoOf(el);
      return !v.paused && !v.ended;
    }));
  }

  function playReel(el) {
    const v = videoOf(el);
    reels.forEach((o) => { if (o !== el && !videoOf(o).paused) videoOf(o).pause(); });
    const p = v.play();
    if (p && p.catch) {
      p.catch(() => {
        // Браузер не дал включить со звуком: пробуем без звука
        v.muted = true;
        el.classList.add('is-muted');
        v.play().catch(() => {});
      });
    }
  }

  reels.forEach((el, i) => {
    const v = videoOf(el);
    const bar = el.querySelector('.reel-progress i');
    const track = el.querySelector('.reel-progress');

    const toggle = () => {
      if (v.paused || v.ended) playReel(el);
      else v.pause();
    };

    el.addEventListener('click', (e) => {
      if (suppressClick) return;
      if (i !== cur) { haptic(); go(i); return; }
      if (e.target.closest('.reel-icon, .reel-progress')) return;
      haptic();
      toggle();
    });

    el.querySelector('.reel-pp').addEventListener('click', (e) => { e.stopPropagation(); haptic(); toggle(); });

    el.querySelector('.reel-sound').addEventListener('click', (e) => {
      e.stopPropagation();
      haptic();
      v.muted = !v.muted;
      el.classList.toggle('is-muted', v.muted);
    });

    el.querySelector('.reel-full').addEventListener('click', (e) => {
      e.stopPropagation();
      haptic();
      if (v.requestFullscreen) {
        const r = v.requestFullscreen();
        if (r && r.catch) r.catch(() => {});
      } else if (v.webkitEnterFullscreen) {
        v.webkitEnterFullscreen();
      } else if (v.webkitRequestFullscreen) {
        v.webkitRequestFullscreen();
      }
      if (v.paused) playReel(el);
    });

    track.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = track.getBoundingClientRect();
      if (v.duration) v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
    });

    v.addEventListener('timeupdate', () => {
      if (v.duration) bar.style.transform = `scaleX(${v.currentTime / v.duration})`;
    });

    v.addEventListener('play', () => { el.classList.add('is-playing'); syncDuck(); });
    v.addEventListener('pause', () => { el.classList.remove('is-playing'); syncDuck(); });
    v.addEventListener('ended', () => {
      el.classList.remove('is-playing');
      syncDuck();
      // Как в рилсах: сразу следующий клип
      if (i === cur && cur < reels.length - 1) setTimeout(() => go(cur + 1, true), 450);
    });
  });

  function layout() {
    const n = reels.length;
    reels.forEach((el, i) => {
      let o = i - cur;
      if (o > n / 2) o -= n;
      if (o < -n / 2) o += n;
      const a = Math.abs(o);
      el.classList.toggle('is-active', o === 0);
      el.style.zIndex = String(10 - a);
      el.style.opacity = a > 1 ? '0' : a === 1 ? '0.5' : '1';
      el.style.filter = a ? 'brightness(0.55) saturate(0.8)' : 'none';
      el.style.pointerEvents = a > 1 ? 'none' : 'auto';
      el.style.transform = `translateX(${o * 74}%) scale(${a ? 0.8 : 1}) rotateY(${o * -14}deg)`;
    });
    $$('button', dotsWrap).forEach((d, i) => d.classList.toggle('is-active', i === cur));
  }

  function go(i, autoplay) {
    const n = reels.length;
    const next = (i + n) % n;
    if (next !== cur) {
      const v = videoOf(reels[cur]);
      if (!v.paused) v.pause();
    }
    cur = next;
    layout();
    if (autoplay) {
      const v = videoOf(reels[cur]);
      v.currentTime = 0;
      playReel(reels[cur]);
    }
  }

  $('#reelPrev').addEventListener('click', () => { haptic(); go(cur - 1); });
  $('#reelNext').addEventListener('click', () => { haptic(); go(cur + 1); });

  let sx = 0;
  let sy = 0;
  stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      haptic();
      go(cur + (dx < 0 ? 1 : -1));
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 350);
    }
  }, { passive: true });

  // Ушла со страницы видео: ставим на паузу
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) reels.forEach((el) => { const v = videoOf(el); if (!v.paused) v.pause(); });
      });
    }, { threshold: 0.15 }).observe($('#reels'));
  }

  layout();

  // ----------------------------------------------------------
  // Небо: звезды, падающие звезды, искры
  // ----------------------------------------------------------
  const cv = $('#sky');
  const ctx = cv ? cv.getContext('2d') : null;
  let W = 0;
  let H = 0;
  const stars = [];
  const sparks = [];
  const shooters = [];

  function resizeSky() {
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars.length = 0;
    const count = Math.round(Math.min(120, (W * H) / 11000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.25,
        s: Math.random() * 1.4 + 0.4,
        p: Math.random() * Math.PI * 2,
        c: Math.random() < 0.7 ? '255,250,240' : Math.random() < 0.5 ? '243,217,164' : '185,184,245'
      });
    }
  }

  function spawnShooter(fast) {
    const fromLeft = Math.random() < 0.5;
    const speed = fast ? 13 + Math.random() * 6 : 9 + Math.random() * 5;
    const angle = (fromLeft ? 0.35 : Math.PI - 0.35) + (Math.random() - 0.5) * 0.25;
    shooters.push({
      x: fromLeft ? Math.random() * W * 0.5 : W * 0.5 + Math.random() * W * 0.5,
      y: Math.random() * H * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      len: 90 + Math.random() * 80
    });
  }

  function burst(x, y, n = 70) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * 5.5 + 1.2;
      sparks.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2.2,
        r: Math.random() * 2 + 0.7,
        life: 1,
        d: Math.random() * 0.014 + 0.009,
        c: Math.random() < 0.6 ? '243,217,164' : Math.random() < 0.5 ? '240,183,200' : '185,184,245'
      });
    }
  }

  let nextShooter = performance.now() + 4000;

  function frame(t) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const yOff = (window.scrollY || 0) * 0.04;

    for (const s of stars) {
      const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
      let y = (s.y - yOff) % H;
      if (y < 0) y += H;
      ctx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (t > nextShooter) {
      spawnShooter(false);
      nextShooter = t + 6000 + Math.random() * 8000;
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const m = shooters[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life -= 0.012;
      if (m.life <= 0 || m.x < -200 || m.x > W + 200 || m.y > H + 200) { shooters.splice(i, 1); continue; }
      const k = m.len / Math.hypot(m.vx, m.vy);
      const tx = m.x - m.vx * k;
      const ty = m.y - m.vy * k;
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(255,250,235,${m.life})`);
      g.addColorStop(1, 'rgba(255,250,235,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.05;
      p.life -= p.d;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${p.c},${p.life.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + p.life * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resizeSky);
  resizeSky();
  requestAnimationFrame(frame);

  // ----------------------------------------------------------
  // 03. Поймать сладкий сон
  // ----------------------------------------------------------
  const WISHES = [
    'Сладких снов, моя хорошая 🌙',
    'Пусть приснится что-то очень тёплое ✨',
    'Обнимаю крепко-крепко и укрываю одеялком ☁️',
    'Ты сегодня большая умничка. Отдыхай 💛',
    'Завтра будет хороший день, обещаю 🌸',
    'Спи крепко, я рядом 💫'
  ];
  let wishIndex = 0;

  const dreamBtn = $('#dreamBtn');
  const dreamHint = $('#dreamHint');
  if (dreamBtn) {
    dreamBtn.addEventListener('click', () => {
      haptic('success');
      const r = dreamBtn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      for (let i = 0; i < 5; i++) setTimeout(() => spawnShooter(true), i * 160);
      toast(WISHES[wishIndex % WISHES.length]);
      wishIndex++;
      if (dreamHint) {
        dreamHint.textContent = 'сон пойман и уже летит к твоей подушке';
        dreamHint.classList.add('is-done');
      }
    });
  }
})();
