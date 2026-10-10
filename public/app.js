// Интерактивная логика портала сладких снов
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

document.addEventListener('DOMContentLoaded', () => {
  // Telegram WebApp инициализация
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#040612');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#040612');
    } catch (e) {
      console.warn('Telegram WebApp setup warning:', e);
    }
  }

  // Тактильный отклик (Haptic Feedback)
  function triggerHaptic(style = 'light') {
    if (tg?.HapticFeedback) {
      try {
        if (style === 'light' || style === 'medium' || style === 'heavy') {
          tg.HapticFeedback.impactOccurred(style);
        } else if (style === 'success') {
          tg.HapticFeedback.notificationOccurred('success');
        }
      } catch (e) {}
    } else if (navigator.vibrate) {
      navigator.vibrate(style === 'heavy' ? [25, 40, 25] : 15);
    }
  }

  // ==========================================
  // 1. Всплывающие уведомления (Toast)
  // ==========================================
  const toastContainer = document.getElementById('toastContainer');
  function showToast(text, icon = '🌙') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // ==========================================
  // 2. Интерактивный ночной холст: звезды, метеоры, космическая пыль
  // ==========================================
  const canvas = document.getElementById('celestialCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let width = 0;
  let height = 0;
  let animationFrameId = null;

  const stars = [];
  const meteors = [];
  const burstParticles = [];

  const STAR_COUNT = 90;

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.006,
        color: Math.random() > 0.3 ? '#fffdf0' : (Math.random() > 0.5 ? '#818cf8' : '#fde047')
      });
    }
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    initStars();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function spawnMeteor(startX, startY) {
    const x = startX !== undefined ? startX : Math.random() * width * 0.8;
    const y = startY !== undefined ? startY : Math.random() * (height * 0.35);
    const speed = Math.random() * 7 + 9;
    const length = Math.random() * 80 + 90;
    const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1);

    meteors.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length,
      opacity: 1,
      fade: Math.random() * 0.015 + 0.012
    });
  }

  function spawnBurst(x, y, symbols = ['✨', '🌙', '💖', '💫']) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1.5;
      burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        opacity: 1,
        size: Math.random() * 10 + 14,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8
      });
    }
  }

  // Периодический мягкий метеор
  setInterval(() => {
    if (Math.random() > 0.35) {
      spawnMeteor();
    }
  }, 4500);

  function renderCelestial() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // 1. Отрисовка мерцающих звезд
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.alpha += s.twinkleSpeed;
      if (s.alpha > 1 || s.alpha < 0.2) {
        s.twinkleSpeed = -s.twinkleSpeed;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
      ctx.shadowBlur = s.radius * 3;
      ctx.shadowColor = s.color;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 2. Отрисовка метеоров
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.opacity -= m.fade;

      if (m.opacity <= 0 || m.x > width + 100 || m.y > height + 100) {
        meteors.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, m.opacity);
      const grad = ctx.createLinearGradient(
        m.x, m.y,
        m.x - m.vx * (m.length / 10),
        m.y - m.vy * (m.length / 10)
      );
      grad.addColorStop(0, '#fde047');
      grad.addColorStop(0.3, '#818cf8');
      grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 3.5, m.y - m.vy * 3.5);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Отрисовка взрывных искр и символов
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // Гравитация
      p.opacity -= 0.02;
      p.rotation += p.rotationSpeed;

      if (p.opacity <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillText(p.symbol, 0, 0);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    animationFrameId = requestAnimationFrame(renderCelestial);
  }

  renderCelestial();

  // ==========================================
  // 3. Индикатор прогресса скролла
  // ==========================================
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total > 0 && scrollProgressBar) {
      const percent = (window.scrollY / total) * 100;
      scrollProgressBar.style.width = Math.min(100, Math.max(0, percent)) + '%';
    }
  }, { passive: true });

  // ==========================================
  // 4. Часы в верхней панели (Live Time)
  // ==========================================
  const liveTimeText = document.getElementById('liveTimeText');
  function updateTime() {
    if (!liveTimeText) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    liveTimeText.textContent = `Тихая ночь ${hours}:${mins}`;
  }
  updateTime();
  setInterval(updateTime, 30000);

  // ==========================================
  // 5. Спокойная музыка Oneheart (Snowfall / Apathy)
  // ==========================================
  const bgMusic = document.getElementById('bgMusic');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioSwitchBtn = document.getElementById('audioSwitchBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');

  const playlist = [
    { name: 'Snowfall', file: 'snowfall.mp3' },
    { name: 'Apathy', file: 'oneheart.mp3' }
  ];
  let currentTrackIdx = 0;
  let isPlaying = false;

  function updateTrackDisplay() {
    if (audioLabel) audioLabel.textContent = playlist[currentTrackIdx].name;
    if (bgMusic) bgMusic.src = playlist[currentTrackIdx].file;
  }

  function playAudio() {
    if (!bgMusic) return;
    bgMusic.play().then(() => {
      isPlaying = true;
      if (audioToggleBtn) audioToggleBtn.classList.add('playing');
      if (audioIcon) audioIcon.textContent = '⏸️';
      showToast(`Музыка: Oneheart - ${playlist[currentTrackIdx].name}`, '🎵');
    }).catch((err) => {
      console.log('Autoplay prevented:', err);
    });
  }

  function pauseAudio() {
    if (!bgMusic) return;
    bgMusic.pause();
    isPlaying = false;
    if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
    if (audioIcon) audioIcon.textContent = '🎵';
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      triggerHaptic('light');
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    });
  }

  if (audioSwitchBtn) {
    audioSwitchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic('medium');
      currentTrackIdx = (currentTrackIdx + 1) % playlist.length;
      updateTrackDisplay();
      if (isPlaying) {
        bgMusic.play().catch(() => {});
        showToast(`Включен трек: ${playlist[currentTrackIdx].name}`, '🔄');
      } else {
        showToast(`Выбран трек: ${playlist[currentTrackIdx].name}`, '🌙');
      }
    });
  }

  // Фоновая музыка запускается по первому взаимодействию
  const autoPlayTrigger = () => {
    if (!isPlaying) {
      playAudio();
    }
    window.removeEventListener('click', autoPlayTrigger);
    window.removeEventListener('touchstart', autoPlayTrigger);
  };
  window.addEventListener('click', autoPlayTrigger, { once: true });
  window.addEventListener('touchstart', autoPlayTrigger, { once: true });

  // ==========================================
  // 6. Интерактивная 3D Луна
  // ==========================================
  const interactiveMoon = document.getElementById('interactiveMoon');
  if (interactiveMoon) {
    interactiveMoon.addEventListener('click', (e) => {
      triggerHaptic('medium');
      const rect = interactiveMoon.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      spawnBurst(centerX, centerY, ['🌙', '✨', '💫', '💖']);
      spawnMeteor(centerX, centerY);

      showToast('Лунное тепло укутало тебя нежностью ✨🌙', '🌙');
    });
  }

  // Кнопка быстрого звездопада
  const starShowerBtn = document.getElementById('starShowerBtn');
  if (starShowerBtn) {
    starShowerBtn.addEventListener('click', () => {
      triggerHaptic('medium');
      for (let i = 0; i < 4; i++) {
        setTimeout(() => spawnMeteor(), i * 220);
      }
      showToast('Загадывай самое сокровенное желание... 💫✨', '⭐');
    });
  }

  // ==========================================
  // 7. Ночной ритуал заботы (Ritual Cards)
  // ==========================================
  const ritualCards = document.querySelectorAll('.ritual-card');
  const ritualStatusText = document.getElementById('ritualStatusText');
  const collectedItems = new Set();

  const ritualToasts = {
    tea: 'Выпит чашечка лавандового чая с мёдом! Спокойствие разлилось по телу 🫖✨',
    blanket: 'Ты бережно укутана в самое мягкое шелковое облачко ☁️💤',
    story: 'Волшебная звездная сказка зазвучала в ночной тишине 📖🌙',
    kiss: 'Нежный сонный поцелуй в носик пойман! Самых сладких снов 💋💖'
  };

  ritualCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      triggerHaptic('light');
      const itemKey = card.getAttribute('data-item');
      const checkBadge = document.getElementById(`check-${itemKey}`);

      if (collectedItems.has(itemKey)) {
        collectedItems.delete(itemKey);
        card.classList.remove('collected');
        if (checkBadge) checkBadge.textContent = '○';
      } else {
        collectedItems.add(itemKey);
        card.classList.add('collected');
        if (checkBadge) checkBadge.textContent = '✓';

        const rect = card.getBoundingClientRect();
        spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ['☁️', '✨', '💤', '🌙']);
        showToast(ritualToasts[itemKey] || 'Ритуал выполнен! ✨', '✨');
      }

      const count = collectedItems.size;
      if (ritualStatusText) {
        if (count === 4) {
          ritualStatusText.textContent = 'Все ритуалы заботы собраны на 100%! Самых сладких снов, любимая 💖';
          triggerHaptic('success');
          showToast('Атмосфера идеального сна готова на все 100%! 💤💖', '🎉');
        } else {
          ritualStatusText.textContent = `Собрано элементов: ${count} из 4 (${count === 0 ? 'Нажимай на карточки!' : 'Отличный ночной ритуал!'})`;
        }
      }
    });
  });

  // ==========================================
  // 8. Spotlight подсветка и интерактив в Bento галерее
  // ==========================================
  document.querySelectorAll('.bento-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Осыпать лепестками роз
  const sprayRoseBtn = document.getElementById('sprayRoseBtn');
  if (sprayRoseBtn) {
    sprayRoseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic('medium');
      const rect = sprayRoseBtn.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ['🌹', '🌸', '✨', '💖']);
      showToast('Комната наполнилась нежным ароматом роз 🌹✨', '🌸');
    });
  }

  // Скрытая записка
  const secretQuoteBtn = document.getElementById('secretQuoteBtn');
  const secretQuoteContent = document.getElementById('secretQuoteContent');
  if (secretQuoteBtn && secretQuoteContent) {
    secretQuoteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      const isOpen = secretQuoteContent.classList.toggle('open');
      secretQuoteBtn.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        const rect = secretQuoteBtn.getBoundingClientRect();
        spawnBurst(rect.left + rect.width / 2, rect.top, ['🗝️', '🐱', '💖']);
      }
    });
  }

  // Интерактивная плашка :Р
  const tongueBadge = document.getElementById('tongueBadge');
  if (tongueBadge) {
    tongueBadge.addEventListener('click', (e) => {
      triggerHaptic('medium');
      const rect = tongueBadge.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ['🐱', ':Р', '🍑', '💖']);
      showToast('Шкодный сонный котик передает нежный кусь :Р 🐱', '🍑');
    });
  }

  // Звук видео
  const coupleVideo = document.getElementById('coupleVideo');
  const videoSoundBtn = document.getElementById('videoSoundBtn');
  if (coupleVideo && videoSoundBtn) {
    videoSoundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      coupleVideo.muted = !coupleVideo.muted;
      if (!coupleVideo.muted) {
        coupleVideo.play().catch(() => {});
        videoSoundBtn.textContent = '🔊 Звук включен';
        showToast('Звук видео включен! 🔊', '🎬');
      } else {
        videoSoundBtn.textContent = '🔇 Включить звук';
        showToast('Видео без звука 🔇', '🎬');
      }
    });
  }

  // ==========================================
  // 9. Модальное окно Lightbox для просмотра фото
  // ==========================================
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');

  function openLightbox(src, caption) {
    if (!lightboxModal || !lightboxImg) return;
    triggerHaptic('light');
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    lightboxModal.classList.add('open');
    lightboxModal.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('open');
    lightboxModal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.photo-wrapper').forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const src = wrap.getAttribute('data-src') || (wrap.querySelector('img') ? wrap.querySelector('img').src : null);
      const caption = wrap.getAttribute('data-caption') || '';
      if (src) openLightbox(src, caption);
    });
  });

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  // ==========================================
  // 10. Созвездия сладких снов (Генератор пожеланий)
  // ==========================================
  const nextNoteBtn = document.getElementById('nextNoteBtn');
  const noteText = document.getElementById('noteText');
  const noteCounter = document.getElementById('noteCounter');
  const wishesList = window.WISHES_DATABASE || [];

  let currentWishIdx = 0;

  if (nextNoteBtn && wishesList.length > 0) {
    nextNoteBtn.addEventListener('click', (e) => {
      triggerHaptic('light');
      currentWishIdx = (currentWishIdx + 1) % wishesList.length;
      const wish = wishesList[currentWishIdx];

      if (noteText) {
        noteText.style.opacity = '0';
        setTimeout(() => {
          noteText.textContent = wish.text;
          noteText.style.opacity = '1';
        }, 200);
      }

      if (noteCounter) {
        noteCounter.textContent = `Созвездие ${currentWishIdx + 1} из ${wishesList.length}`;
      }

      const rect = nextNoteBtn.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top, ['🌙', '✨', '💫']);
    });
  }

  // ==========================================
  // 11. Кнопка ночных согревающих обнимашек
  // ==========================================
  const hugBtn = document.getElementById('hugBtn');
  if (hugBtn) {
    hugBtn.addEventListener('click', (e) => {
      triggerHaptic('heavy');
      const rect = hugBtn.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ['🫂', '💖', '🌙', '☁️', '💤']);
      showToast('Крепко-крепко прижал тебя к себе и поцеловал! 🫂💖', '🫂');
    });
  }

  // ==========================================
  // 12. Плавающий док быстрой навигации (Floating Dock)
  // ==========================================
  const dockItems = document.querySelectorAll('.dock-item');
  const dockSections = [
    document.getElementById('heroSection'),
    document.getElementById('ritualSection'),
    document.getElementById('gallerySection'),
    document.getElementById('wishesSection'),
    document.getElementById('finaleSection')
  ].filter(Boolean);

  dockItems.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerHaptic('light');
      const targetSel = btn.getAttribute('data-target');
      const targetEl = document.querySelector(targetSel);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Отслеживание активной секции в доке
  const dockObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = '#' + entry.target.id;
        dockItems.forEach((item) => {
          if (item.getAttribute('data-target') === id) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, {
    threshold: 0.35
  });

  dockSections.forEach((sec) => dockObserver.observe(sec));

  // ==========================================
  // 13. Плавное появление секций при скролле (Scroll Reveal)
  // ==========================================
  const revealElements = document.querySelectorAll('.scroll-reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  revealElements.forEach((el) => revealObserver.observe(el));
});
