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
  // Фоновая музыка (Stardome) с плавным входом
  // ----------------------------------------------------------
  const music = $('#bgMusic');
  const player = $('#player');
  const BASE = 1;

  let actx = null;
  let gain = null;
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
    setLevel(BASE, 2600);

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
  // 02. Поймать сладкий сон
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
