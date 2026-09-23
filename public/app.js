// Скрипт ночной персональной романтической страницы "Спокойной ночи, котеночек мой любимый!"
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

(function () {
  'use strict';

  // Инициализация Telegram WebApp
  const tg = window.Telegram ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#080512');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#080512');
    } catch (e) {
      console.log('TG Init error:', e);
    }
  }

  // Тактильный отклик
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

  // Всплывающее сообщение
  function showToast(text, icon = '🌙') {
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
  // 1. Интерактивный холст ночного неба
  // ==========================================
  const canvas = document.getElementById('nightCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let width = canvas ? (canvas.width = window.innerWidth) : 0;
  let height = canvas ? (canvas.height = window.innerHeight) : 0;

  window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initStars();
  });

  const stars = [];
  const meteors = [];
  const floatingItems = [];

  // Звезды ночного неба
  function initStars() {
    stars.length = 0;
    const count = Math.floor((width * height) / 3800);
    const starColors = ['#ffffff', '#fff5db', '#e2d8ff', '#ffd166', '#ff8fab', '#74ebd5'];

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.4,
        baseAlpha: Math.random() * 0.7 + 0.25,
        pulseSpeed: Math.random() * 0.03 + 0.008,
        pulsePhase: Math.random() * Math.PI * 2,
        vy: -(Math.random() * 0.15 + 0.03),
        vx: (Math.random() - 0.5) * 0.08,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }
  }

  // Запуск падающей звезды (метеора)
  function spawnMeteor() {
    meteors.push({
      x: Math.random() * (width * 0.9),
      y: Math.random() * (height * 0.4),
      length: Math.random() * 90 + 60,
      speed: Math.random() * 7 + 5,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      opacity: 0.95,
      decay: Math.random() * 0.02 + 0.012
    });
  }

  setInterval(() => {
    if (Math.random() > 0.35) {
      spawnMeteor();
    }
  }, 3200);

  // Салют ночных искорок, сердечек и котиков
  function spawnNightBurst(originX, originY) {
    const symbols = ['🌙', '💖', '✨', '🐱', '💤', '🧸', '⭐'];
    const startX = originX !== undefined ? originX : width / 2;
    const startY = originY !== undefined ? originY : height * 0.6;

    for (let i = 0; i < 28; i++) {
      floatingItems.push({
        x: startX + (Math.random() - 0.5) * 60,
        y: startY + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 3.4,
        vy: -(Math.random() * 3.8 + 2.0),
        size: Math.random() * 16 + 14,
        alpha: 1,
        decay: Math.random() * 0.014 + 0.007,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]
      });
    }
  }

  function renderSky() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Рисование мерцающих звезд
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.pulsePhase += s.pulseSpeed;
      s.y += s.vy;
      s.x += s.vx;

      if (s.y < -5) s.y = height + 5;
      if (s.x < -5) s.x = width + 5;
      if (s.x > width + 5) s.x = -5;

      const alpha = s.baseAlpha + Math.sin(s.pulsePhase) * 0.3;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.08, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Рисование метеоров
    ctx.globalAlpha = 1;
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const tailX = m.x - Math.cos(m.angle) * m.length;
      const tailY = m.y - Math.sin(m.angle) * m.length;

      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.7, `rgba(226, 216, 255, ${m.opacity * 0.6})`);
      grad.addColorStop(1, `rgba(255, 243, 196, ${m.opacity})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.opacity -= m.decay;

      if (m.opacity <= 0) {
        meteors.splice(i, 1);
      }
    }

    // Летающие ночные символы и эмодзи
    for (let i = floatingItems.length - 1; i >= 0; i--) {
      const item = floatingItems[i];
      ctx.globalAlpha = Math.max(0, item.alpha);
      ctx.font = `${item.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(item.symbol, item.x, item.y);

      item.x += item.vx;
      item.y += item.vy;
      item.alpha -= item.decay;

      if (item.alpha <= 0 || item.y < -50) {
        floatingItems.splice(i, 1);
      }
    }

    requestAnimationFrame(renderSky);
  }

  if (canvas && ctx) {
    initStars();
    renderSky();
  }

  // ==========================================
  // 2. Таймер обратного отсчета до 23:30 (МСК)
  // ==========================================
  const countHoursEl = document.getElementById('countHours');
  const countMinutesEl = document.getElementById('countMinutes');
  const countSecondsEl = document.getElementById('countSeconds');
  const timerHeadingEl = document.getElementById('timerHeading');
  const timerSubEl = document.getElementById('timerSub');
  const unlockEarlyBtn = document.getElementById('unlockEarlyBtn');
  const liveClock = document.getElementById('liveClock');

  let hasCelebratedUnlock = false;

  function updateCountdown() {
    const now = new Date();
    // Время в Москве: UTC+3 (20:30 UTC = 23:30 MSK)
    const nowUtc = now.getTime();

    // Целевая дата на сегодня в 20:30:00 UTC
    let targetUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      20, 30, 0
    );

    let diff = targetUtc - nowUtc;

    // Если 23:30 на сегодня уже прошло
    if (diff <= 0) {
      if (countHoursEl) countHoursEl.textContent = '00';
      if (countMinutesEl) countMinutesEl.textContent = '00';
      if (countSecondsEl) countSecondsEl.textContent = '00';

      if (timerHeadingEl) {
        timerHeadingEl.textContent = 'Волшебное время 23:30 наступило! ✨';
      }
      if (timerSubEl) {
        timerSubEl.textContent = 'Послание открыто для самого любимого котеночка на свете 💖';
      }
      if (unlockEarlyBtn) {
        unlockEarlyBtn.innerHTML = '<span class="unlock-icon">✨</span><span class="unlock-text">Сладких снов, любимая 💖</span>';
      }

      if (!hasCelebratedUnlock) {
        hasCelebratedUnlock = true;
        spawnNightBurst();
      }
      return;
    }

    // Если еще не наступило 23:30
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (countHoursEl) countHoursEl.textContent = String(hours).padStart(2, '0');
    if (countMinutesEl) countMinutesEl.textContent = String(minutes).padStart(2, '0');
    if (countSecondsEl) countSecondsEl.textContent = String(seconds).padStart(2, '0');

    if (liveClock) {
      liveClock.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Кнопка ранней разблокировки поцелуем
  if (unlockEarlyBtn) {
    unlockEarlyBtn.addEventListener('click', (e) => {
      triggerHaptic('success');
      spawnNightBurst(e.clientX, e.clientY);
      showToast('Секретный поцелуй принят! Открыто с любовью 💖', '💋');

      // Плавный скролл к началу сказки
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ==========================================
  // 3. Анимации при скролле (Intersection Observer)
  // ==========================================
  const scrollElements = document.querySelectorAll('.scroll-reveal');

  if ('IntersectionObserver' in window) {
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Легкий визуальный отклик
          if (Math.random() > 0.6) {
            spawnMeteor();
          }
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    scrollElements.forEach((el) => scrollObserver.observe(el));
  } else {
    // Резервный режим
    scrollElements.forEach((el) => el.classList.add('revealed'));
  }

  // ==========================================
  // 4. Интерактивная луна
  // ==========================================
  const moonWrapper = document.getElementById('interactiveMoon');
  if (moonWrapper) {
    moonWrapper.addEventListener('click', (e) => {
      triggerHaptic('medium');
      spawnMeteor();
      spawnMeteor();
      spawnNightBurst(e.clientX, e.clientY);
      showToast('Звездочка желаний поймана! Загадай сладкий сон ✨', '🌙');
    });
  }

  // ==========================================
  // 5. Игровая отметка :Р строго под 3-м фото
  // ==========================================
  const tongueBadge = document.getElementById('tongueBadge');
  if (tongueBadge) {
    tongueBadge.addEventListener('click', (e) => {
      triggerHaptic('light');
      spawnNightBurst(e.clientX, e.clientY);
      showToast('твоя жопа = моя жопа :Р 🍑✨', '🐱');
    });
  }

  // Касание к фотографиям с теплым откликом
  const storyPhotos = document.querySelectorAll('.photo-wrapper');
  storyPhotos.forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      triggerHaptic('light');
      spawnNightBurst(e.clientX, e.clientY);
    });
  });

  // ==========================================
  // 6. Интерактивные звездочки сладких снов
  // ==========================================
  const defaultNotes = [
    'Спокойной ночи, котеночек мой любимый! Пусть эта ночь принесет тебе самый сладкий и безмятежный отдых.',
    'Укутайся поудобнее в свое одеялко. Представь, что это я крепко и нежно обнимаю тебя, согревая своим теплом.',
    'Желаю тебе самых добрых и красивых сновидений, где оживают твои самые заветные мечты.',
    'Ты самое прекрасное чудо в моей жизни. Даже когда темно, ты освещаешь мое сердце.',
    'Пусть между нами километры, мои мысли и сердце сейчас с тобой. Я буду охранять твой сон всю эту ночь.',
    'Ты сегодня отлично потрудилась и заслужила самый сладкий отдых. Отдыхай, набирайся сил!',
    'Шлю тебе самый ласковый поцелуй перед сном в носик и щечки. Спи крепко!',
    'Пусть за окном тихо мерцают звездочки, а в комнате будет тепло и спокойно.',
    'Сладких снов, моя сонная радость. Закрывай красивые глазки, я мысленно рядом и нежно глажу тебя по волосам.',
    'Спокойной ночи, мое счастье. Спасибо тебе за то, что освещаешь мою жизнь ярче миллиарда ночных звезд.'
  ];

  const wishesSource = (window.WISHES_DATABASE && window.WISHES_DATABASE.length > 0)
    ? window.WISHES_DATABASE.map(w => w.text)
    : defaultNotes;

  let currentNoteIdx = 0;
  const noteText = document.getElementById('noteText');
  const noteCounter = document.getElementById('noteCounter');
  const nextNoteBtn = document.getElementById('nextNoteBtn');

  function selectNightNote(index) {
    currentNoteIdx = index % wishesSource.length;
    triggerHaptic('light');

    if (noteText) {
      noteText.style.opacity = '0.2';
      setTimeout(() => {
        noteText.textContent = wishesSource[currentNoteIdx];
        if (noteCounter) {
          noteCounter.textContent = `Звездочка ${currentNoteIdx + 1} из ${wishesSource.length}`;
        }
        noteText.style.opacity = '1';
      }, 160);
    }
  }

  if (nextNoteBtn) {
    nextNoteBtn.addEventListener('click', (e) => {
      triggerHaptic('light');
      spawnNightBurst(e.clientX, e.clientY);
      let nextIdx = Math.floor(Math.random() * wishesSource.length);
      if (nextIdx === currentNoteIdx && wishesSource.length > 1) {
        nextIdx = (nextIdx + 1) % wishesSource.length;
      }
      selectNightNote(nextIdx);
    });
  }

  // ==========================================
  // 7. Кнопка ночных объятий перед сном
  // ==========================================
  const hugBtn = document.getElementById('hugBtn');
  if (hugBtn) {
    hugBtn.addEventListener('click', (e) => {
      triggerHaptic('success');
      spawnNightBurst(e.clientX, e.clientY);
      showToast('Я крепко укутал тебя в одеялко и нежно поцеловал! ❤️', '🧸');
    });
  }

  // ==========================================
  // 8. Управление фоновой музыкой Oneheart - Apathy
  // ==========================================
  const bgMusic = document.getElementById('bgMusic');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');

  if (bgMusic) {
    bgMusic.volume = 0.55;
  }

  function playOneheart() {
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().then(() => {
        if (audioToggleBtn) audioToggleBtn.classList.add('playing');
        if (audioIcon) audioIcon.textContent = '🔊';
        if (audioLabel) audioLabel.textContent = 'Oneheart звучит';
      }).catch(() => {
        // Ожидание взаимодействия с пользователем
      });
    }
  }

  function pauseOneheart() {
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
      if (audioIcon) audioIcon.textContent = '🎵';
      if (audioLabel) audioLabel.textContent = 'Oneheart - Apathy';
    }
  }

  // Воспроизведение при первом касании страницы
  let userInteracted = false;
  function handleInitialInteraction() {
    if (!userInteracted) {
      userInteracted = true;
      playOneheart();
      document.removeEventListener('click', handleInitialInteraction);
      document.removeEventListener('touchstart', handleInitialInteraction);
    }
  }

  document.addEventListener('click', handleInitialInteraction);
  document.addEventListener('touchstart', handleInitialInteraction);

  // Попытка запуска при загрузке
  setTimeout(() => {
    playOneheart();
  }, 400);

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userInteracted = true;
      triggerHaptic('light');

      if (!bgMusic) return;

      if (bgMusic.paused) {
        playOneheart();
        showToast('Играет Oneheart - Apathy 🎵', '🌙');
      } else {
        pauseOneheart();
        showToast('Музыка на паузе', '⏸️');
      }
    });
  }

})();
