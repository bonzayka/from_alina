// Интерактивный портал "С добрым утречком, солнышко!"
// UI/UX Pro Max: Плавные анимации, плавающий док навигации, лайтбокс, геймификация завтрака
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

(function () {
  'use strict';

  // ==========================================
  // 1. Инициализация Telegram WebApp
  // ==========================================
  const tg = window.Telegram ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#fff5f7');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#fff5f7');
    } catch (e) {
      console.log('TG Init error:', e);
    }
  }

  // Тактильный отклик (Haptic Feedback)
  function triggerHaptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
      try {
        if (type === 'success' || type === 'warning' || type === 'error') {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } catch (e) {}
    }
  }

  // Всплывающее уведомление (Toast)
  function showToast(text, icon = '☀️') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  }

  // ==========================================
  // 2. Индикатор прогресса прокрутки (Reading Bar)
  // ==========================================
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  window.addEventListener('scroll', () => {
    if (!scrollProgressBar) return;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = (window.scrollY / totalHeight) * 100;
      scrollProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  }, { passive: true });

  // ==========================================
  // 3. Живые часы в шапке
  // ==========================================
  const liveTimeText = document.getElementById('liveTimeText');
  function updateLiveClock() {
    if (!liveTimeText) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    liveTimeText.textContent = `${hours}:${minutes} • Солнечно ☀️`;
  }
  updateLiveClock();
  setInterval(updateLiveClock, 30000);

  // ==========================================
  // 4. Интерактивный холст: утренние лепестки и лучики
  // ==========================================
  const canvas = document.getElementById('petalsCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let width = canvas ? (canvas.width = window.innerWidth) : 0;
  let height = canvas ? (canvas.height = window.innerHeight) : 0;

  window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initPetals();
  });

  const petals = [];
  const floatingItems = [];

  function initPetals() {
    petals.length = 0;
    const count = Math.min(36, Math.floor((width * height) / 18000));

    for (let i = 0; i < count; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 11 + 9,
        vy: Math.random() * 0.85 + 0.45,
        vx: Math.random() * 0.7 - 0.2,
        swing: Math.random() * 2 + 1,
        swingSpeed: Math.random() * 0.02 + 0.008,
        swingPhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        color: Math.random() > 0.4 ? 'rgba(255, 182, 193, 0.75)' : 'rgba(255, 209, 220, 0.85)',
        type: Math.random() > 0.25 ? 'petal' : 'sunbeam'
      });
    }
  }

  function spawnBlossomBurst(originX, originY) {
    const symbols = ['☀️', '💖', '🌸', '✨', '☕', '🥐', '🍓', '💋', '💐'];
    const startX = originX !== undefined ? originX : width / 2;
    const startY = originY !== undefined ? originY : height * 0.5;

    for (let i = 0; i < 22; i++) {
      floatingItems.push({
        x: startX + (Math.random() - 0.5) * 40,
        y: startY + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3.6,
        vy: -(Math.random() * 3.6 + 1.8),
        size: Math.random() * 14 + 16,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.009,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]
      });
    }
  }

  function renderScene() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Рисование кружащихся лепестков
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.swingPhase += p.swingSpeed;
      p.x += Math.sin(p.swingPhase) * p.swing + p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      if (p.x > width + 20) p.x = -20;
      if (p.x < -20) p.x = width + 20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'petal') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, 0, 0, p.size * 1.3);
        ctx.bezierCurveTo(-p.size, 0, -p.size / 2, -p.size / 2, 0, 0);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255, 217, 102, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Рисование летающих эмоциональных символов
    for (let i = floatingItems.length - 1; i >= 0; i--) {
      const item = floatingItems[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, item.alpha);
      ctx.font = `${item.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(item.symbol, item.x, item.y);
      ctx.restore();

      item.x += item.vx;
      item.y += item.vy;
      item.alpha -= item.decay;

      if (item.alpha <= 0 || item.y < -50) {
        floatingItems.splice(i, 1);
      }
    }

    requestAnimationFrame(renderScene);
  }

  if (canvas && ctx) {
    initPetals();
    renderScene();
  }

  // ==========================================
  // 5. Интерактивное утреннее солнышко
  // ==========================================
  const sunWrapper = document.getElementById('interactiveSun');
  const sunPhrases = [
    'С добрым утречком, моё любимое солнышко! ☀️💖',
    'Просыпайся, соня! Твой котеночек уже думает о тебе! 🌸',
    'Пусть этот день будет лёгким, сладким и удачным! ✨',
    'Шлю утренний поцелуй прямо в носик! 💋',
    'Улыбнись, радость моя, твой день начался! 🌷'
  ];

  if (sunWrapper) {
    const handleSunInteraction = (e) => {
      triggerHaptic('medium');
      const clickX = e.clientX || window.innerWidth / 2;
      const clickY = e.clientY || window.innerHeight / 3;
      spawnBlossomBurst(clickX, clickY);
      const randomPhrase = sunPhrases[Math.floor(Math.random() * sunPhrases.length)];
      showToast(randomPhrase, '☀️');
    };

    sunWrapper.addEventListener('click', handleSunInteraction);
    sunWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSunInteraction(e);
      }
    });
  }

  // ==========================================
  // 6. Интерактивный завтрак в постель (Геймификация)
  // ==========================================
  const kitCards = document.querySelectorAll('.kit-card');
  const breakfastStatusText = document.getElementById('breakfastStatusText');
  const collectedBreakfast = new Set();

  const kitMessages = {
    coffee: {
      text: 'Ароматный кофе выпит! Утренний заряд бодрости и тепла получен ☕❤️',
      icon: '☕',
      btn: 'Выпито ✓'
    },
    croissant: {
      text: 'Круассанчик скушан! Сладкого и хрустящего утра 🥐✨',
      icon: '🥐',
      btn: 'Скушано ✓'
    },
    berry: {
      text: 'Сладкая клубничка для твоих прекрасных губок 🍓💖',
      icon: '🍓',
      btn: 'Сладко ✓'
    },
    kiss: {
      text: 'Нежный поцелуй в носик получен! С добрым утречком, соня 💋🌸',
      icon: '💋',
      btn: 'Поцелована ✓'
    }
  };

  kitCards.forEach((card) => {
    const handleKitClick = (e) => {
      const action = card.getAttribute('data-action');
      const data = kitMessages[action];
      if (!data) return;

      triggerHaptic('success');
      const clickX = e.clientX || window.innerWidth / 2;
      const clickY = e.clientY || window.innerHeight / 2;
      spawnBlossomBurst(clickX, clickY);
      showToast(data.text, data.icon);

      card.classList.add('taken');
      collectedBreakfast.add(action);

      const label = card.querySelector('.kit-btn-label');
      if (label) {
        label.textContent = data.btn;
      }

      if (breakfastStatusText) {
        const count = collectedBreakfast.size;
        if (count >= 4) {
          breakfastStatusText.textContent = '🎉 Завтрак собран с любовью на 100%! Идеальное утро началось!';
          setTimeout(() => spawnBlossomBurst(width / 2, height / 2), 250);
        } else {
          breakfastStatusText.textContent = `Собрано угощений: ${count} из 4 ✨ (Продолжай собирать!)`;
        }
      }
    };

    card.addEventListener('click', handleKitClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleKitClick(e);
      }
    });
  });

  // Кнопка вдоха цветочного аромата
  const flowerSprayBtn = document.getElementById('flowerSprayBtn');
  if (flowerSprayBtn) {
    flowerSprayBtn.addEventListener('click', (e) => {
      triggerHaptic('medium');
      spawnBlossomBurst(e.clientX, e.clientY);
      setTimeout(() => spawnBlossomBurst(width / 3, height / 2), 200);
      showToast('Комната наполнилась ароматом роз и пионов! 💐✨', '🌸');
    });
  }

  // Игровая плашка :Р
  const tongueBadge = document.getElementById('tongueBadge');
  if (tongueBadge) {
    tongueBadge.addEventListener('click', (e) => {
      triggerHaptic('light');
      spawnBlossomBurst(e.clientX, e.clientY);
      showToast('твоя жопа = моя жопа :Р С добрым утречком! 🍑✨', '🐱');
    });
  }

  // ==========================================
  // 7. Видеоплеер: управление звуком
  // ==========================================
  const coupleVideo = document.getElementById('coupleVideo');
  const videoSoundBtn = document.getElementById('videoSoundBtn');

  if (coupleVideo && videoSoundBtn) {
    videoSoundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      if (coupleVideo.muted) {
        coupleVideo.muted = false;
        videoSoundBtn.textContent = '🔊 Звук включен';
        showToast('Звук видео включен 🔊', '🎬');
      } else {
        coupleVideo.muted = true;
        videoSoundBtn.textContent = '🔇 Включить звук';
        showToast('Видео без звука 🔇', '🎬');
      }
    });
  }

  // ==========================================
  // 8. Сургучная печать и любовное письмо
  // ==========================================
  const waxSealBtn = document.getElementById('waxSealBtn');
  const poetryQuoteBox = document.getElementById('poetryQuoteBox');

  if (waxSealBtn && poetryQuoteBox) {
    waxSealBtn.addEventListener('click', (e) => {
      triggerHaptic('medium');
      spawnBlossomBurst(e.clientX, e.clientY);
      const isCollapsed = poetryQuoteBox.classList.contains('collapsed');
      if (isCollapsed) {
        poetryQuoteBox.classList.remove('collapsed');
        waxSealBtn.setAttribute('aria-expanded', 'true');
        showToast('Письмо любви раскрыто! 💌✨', '🪶');
      } else {
        poetryQuoteBox.classList.add('collapsed');
        waxSealBtn.setAttribute('aria-expanded', 'false');
        showToast('Письмо аккуратно запечатано 💌', '✉️');
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
      // Игнорируем клик по интерактивным кнопкам внутри
      if (e.target.closest('button')) return;
      const src = wrap.getAttribute('data-src') || (wrap.querySelector('img') ? wrap.querySelector('img').src : null);
      const caption = wrap.getAttribute('data-caption') || '';
      if (src) openLightbox(src, caption);
    });
  });

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  // ==========================================
  // 10. Плавающий док быстрой навигации (Floating Dock)
  // ==========================================
  const dockItems = document.querySelectorAll('.dock-item');
  const dockSections = [
    document.getElementById('heroSection'),
    document.getElementById('breakfastSection'),
    document.getElementById('gallerySection'),
    document.getElementById('poetrySection'),
    document.getElementById('wishesSection')
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

  // Отслеживание активного раздела через IntersectionObserver
  if ('IntersectionObserver' in window && dockSections.length > 0) {
    const dockObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = `#${entry.target.id}`;
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
      threshold: 0.35,
      rootMargin: '-50px 0px -50px 0px'
    });

    dockSections.forEach((sec) => dockObserver.observe(sec));
  }

  // ==========================================
  // 11. Интерактивные лучики утреннего вдохновения
  // ==========================================
  const wishesList = (window.WISHES_DATABASE && window.WISHES_DATABASE.length > 0)
    ? window.WISHES_DATABASE.map(w => w.text)
    : [
      'С добрым утром, моё любимое солнышко! Просыпайся сладко, потянись в мягкой постельке и улыбнись новому прекрасному дню.',
      'Представь, что я принес тебе в постель чашечку горячего кофе с пенкой и свежий круассан. Доброго утра, радость моя!',
      'Шлю тебе самый нежный утренний поцелуй в теплый кончик носика, в щечки и в сонные глазки.',
      'Каждое моё утро начинается с мыслей о тебе, и от этого на душе сразу становится тепло и радостно!',
      'Пусть сегодня все дела решаются легко и беззаботно, а повод для улыбки находится каждую секунду!'
    ];

  let currentWishIdx = 0;
  const noteText = document.getElementById('noteText');
  const noteCounter = document.getElementById('noteCounter');
  const nextNoteBtn = document.getElementById('nextNoteBtn');

  function changeWish(index) {
    currentWishIdx = index % wishesList.length;
    triggerHaptic('light');

    if (noteText) {
      noteText.style.opacity = '0.2';
      setTimeout(() => {
        noteText.textContent = wishesList[currentWishIdx];
        if (noteCounter) {
          noteCounter.textContent = `Лучик ${currentWishIdx + 1} из ${wishesList.length}`;
        }
        noteText.style.opacity = '1';
      }, 160);
    }
  }

  if (nextNoteBtn) {
    nextNoteBtn.addEventListener('click', (e) => {
      triggerHaptic('light');
      spawnBlossomBurst(e.clientX, e.clientY);
      let nextIdx = Math.floor(Math.random() * wishesList.length);
      if (nextIdx === currentWishIdx && wishesList.length > 1) {
        nextIdx = (nextIdx + 1) % wishesList.length;
      }
      changeWish(nextIdx);
    });
  }

  // ==========================================
  // 12. Кнопка утренних сонных обнимашек
  // ==========================================
  const hugBtn = document.getElementById('hugBtn');
  if (hugBtn) {
    hugBtn.addEventListener('click', (e) => {
      triggerHaptic('success');
      spawnBlossomBurst(e.clientX, e.clientY);
      setTimeout(() => spawnBlossomBurst(width / 3, height / 2), 200);
      setTimeout(() => spawnBlossomBurst((2 * width) / 3, height / 2), 400);

      showToast('Я крепко-крепко укутал тебя в одеялко и поцеловал! Доброго утречка! 🫂❤️', '💖');
    });
  }

  // ==========================================
  // 13. Плавное появление карточек при скролле
  // ==========================================
  const scrollElements = document.querySelectorAll('.scroll-reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });
    scrollElements.forEach(el => observer.observe(el));
  } else {
    scrollElements.forEach(el => el.classList.add('revealed'));
  }

  // ==========================================
  // 14. Управление фоновой музыкой Oneheart (Snowfall / Apathy)
  // ==========================================
  const bgMusic = document.getElementById('bgMusic');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');
  const audioSwitchBtn = document.getElementById('audioSwitchBtn');

  const oneheartTracks = [
    { title: 'Snowfall', fullTitle: 'Oneheart - Snowfall', file: 'snowfall.mp3' },
    { title: 'Apathy', fullTitle: 'Oneheart - Apathy', file: 'oneheart.mp3' }
  ];
  let currentTrackIdx = 0;

  if (bgMusic) {
    bgMusic.volume = 0.55;
  }

  function playMusic() {
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().then(() => {
        if (audioToggleBtn) audioToggleBtn.classList.add('playing');
        if (audioIcon) audioIcon.textContent = '🔊';
        if (audioLabel) audioLabel.textContent = oneheartTracks[currentTrackIdx].title;
      }).catch(() => {});
    }
  }

  function pauseMusic() {
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
      if (audioIcon) audioIcon.textContent = '🎵';
    }
  }

  function switchTrack() {
    currentTrackIdx = (currentTrackIdx + 1) % oneheartTracks.length;
    const track = oneheartTracks[currentTrackIdx];
    triggerHaptic('medium');

    if (bgMusic) {
      const wasPlaying = !bgMusic.paused;
      bgMusic.src = track.file;
      bgMusic.load();
      if (audioLabel) audioLabel.textContent = track.title;
      playMusic();
      showToast(`Играет ${track.fullTitle} 🎵`, '🌸');
    }
  }

  let userInteracted = false;
  function handleInitialTap() {
    if (!userInteracted) {
      userInteracted = true;
      playMusic();
      document.removeEventListener('click', handleInitialTap);
      document.removeEventListener('touchstart', handleInitialTap);
    }
  }

  document.addEventListener('click', handleInitialTap);
  document.addEventListener('touchstart', handleInitialTap);

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userInteracted = true;
      triggerHaptic('light');

      if (!bgMusic) return;

      if (bgMusic.paused) {
        playMusic();
        showToast(`Играет ${oneheartTracks[currentTrackIdx].fullTitle} 🎵`, '☀️');
      } else {
        pauseMusic();
        showToast('Музыка на паузе', '⏸️');
      }
    });
  }

  if (audioSwitchBtn) {
    audioSwitchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userInteracted = true;
      switchTrack();
    });
  }

  // Клик в любом свободном месте порождает маленькие искорки
  document.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && e.target.tagName !== 'VIDEO' && !e.target.closest('.kit-card') && !e.target.closest('.floating-dock')) {
      spawnBlossomBurst(e.clientX, e.clientY);
    }
  });

})();
