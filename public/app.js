// Скрипт персональной романтической страницы для любимой девушки
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

(function () {
  'use strict';

  // Инициализация Telegram WebApp
  const tg = window.Telegram ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#040610');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#040610');
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
  function showToast(text, icon = '💖') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // ==========================================
  // 1. Интерактивное ночное небо
  // ==========================================
  const canvas = document.getElementById('nightCanvas');
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initStars();
  });

  const stars = [];
  const shootingStars = [];
  const floatingHearts = [];

  function initStars() {
    stars.length = 0;
    const count = Math.floor((width * height) / 3500);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#fff7e6', '#fed176', '#ffe0ea', '#dff2ff'][Math.floor(Math.random() * 5)]
      });
    }
  }

  function spawnShootingStar() {
    shootingStars.push({
      x: Math.random() * (width * 0.8),
      y: Math.random() * (height * 0.4),
      length: Math.random() * 90 + 60,
      speed: Math.random() * 8 + 6,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      opacity: 1,
      decay: Math.random() * 0.015 + 0.01
    });
  }

  setInterval(() => {
    if (Math.random() > 0.45) {
      spawnShootingStar();
    }
  }, 4000);

  // Создание летающих сердечек при объятии
  function spawnHeartsBurst() {
    const symbols = ['💖', '✨', '❤️', '🌸', '💫'];
    for (let i = 0; i < 32; i++) {
      floatingHearts.push({
        x: Math.random() * width,
        y: height + Math.random() * 40,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -(Math.random() * 3.5 + 2.5),
        size: Math.random() * 16 + 14,
        alpha: 1,
        decay: Math.random() * 0.012 + 0.006,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Рисование звезд
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.twinklePhase += s.twinkleSpeed;
      const alpha = s.baseAlpha + Math.sin(s.twinklePhase) * 0.35;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Падающие звезды
    ctx.globalAlpha = 1;
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      const tailX = ss.x - Math.cos(ss.angle) * ss.length;
      const tailY = ss.y - Math.sin(ss.angle) * ss.length;

      const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, `rgba(254, 209, 118, ${ss.opacity})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.stroke();

      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.opacity -= ss.decay;

      if (ss.opacity <= 0) {
        shootingStars.splice(i, 1);
      }
    }

    // Летающие сердечки
    for (let i = floatingHearts.length - 1; i >= 0; i--) {
      const h = floatingHearts[i];
      ctx.globalAlpha = Math.max(0, h.alpha);
      ctx.font = `${h.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(h.symbol, h.x, h.y);

      h.x += h.vx;
      h.y += h.vy;
      h.alpha -= h.decay;

      if (h.alpha <= 0 || h.y < -50) {
        floatingHearts.splice(i, 1);
      }
    }

    requestAnimationFrame(render);
  }

  initStars();
  render();

  // ==========================================
  // 2. Часы и интерактивная луна
  // ==========================================
  const liveClock = document.getElementById('liveClock');
  const currentDateText = document.getElementById('currentDateText');

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (liveClock) liveClock.textContent = `${h}:${m}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  if (currentDateText) {
    const options = { day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('ru-RU', options);
    currentDateText.textContent = `Ночь, ${dateStr}`;
  }

  const moonWrapper = document.getElementById('interactiveMoon');
  if (moonWrapper) {
    moonWrapper.addEventListener('click', () => {
      triggerHaptic('medium');
      spawnShootingStar();
      spawnShootingStar();
      showToast('Загадай желание, звездочка уже летит!', '🌠');
    });
  }

  // ==========================================
  // 3. Кнопка "Почувствовать объятие"
  // ==========================================
  const hugBtn = document.getElementById('hugBtn');
  if (hugBtn) {
    hugBtn.addEventListener('click', () => {
      triggerHaptic('success');
      spawnHeartsBurst();
      showToast('Я крепко обнял тебя. Почувствуй мое тепло ❤️', '🤗');
    });
  }

  // ==========================================
  // 4. Ночные мысли (Звездные записки)
  // ==========================================
  const notesList = [
    'Ты самое прекрасное и теплое, что случилось в моей жизни.',
    'Я безумно люблю твою улыбку и то, как звонко ты смеешься.',
    'Пусть тебе сегодня приснится самый красивый, добрый и сказочный сон.',
    'Где бы мы ни находились, мое сердце и мои мысли всегда рядом с тобой.',
    'Ты удивительная, нежная и самая лучшая девушка на всем белом свете.',
    'Спи сладко и ни о чем не тревожься: я всегда на твоей стороне и поддержу тебя.',
    'Если бы я был рядом прямо сейчас, я бы укрыл тебя одеялом, поцеловал в носик и не отпускал до утра.'
  ];

  let currentNoteIndex = 0;
  const starButtons = document.querySelectorAll('.star-pick-btn');
  const noteText = document.getElementById('noteText');
  const noteCounter = document.getElementById('noteCounter');
  const nextNoteBtn = document.getElementById('nextNoteBtn');

  function selectNote(index) {
    currentNoteIndex = index % notesList.length;
    triggerHaptic('light');

    starButtons.forEach((btn, i) => {
      if (i === currentNoteIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (noteText) {
      noteText.style.opacity = '0.3';
      setTimeout(() => {
        noteText.textContent = notesList[currentNoteIndex];
        if (noteCounter) noteCounter.textContent = `Записка ${currentNoteIndex + 1} из ${notesList.length}`;
        noteText.style.opacity = '1';
      }, 150);
    }
  }

  starButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      selectNote(index);
    });
  });

  if (nextNoteBtn) {
    nextNoteBtn.addEventListener('click', () => {
      let nextIdx = Math.floor(Math.random() * notesList.length);
      if (nextIdx === currentNoteIndex) nextIdx = (nextIdx + 1) % notesList.length;
      selectNote(nextIdx);
    });
  }

  // ==========================================
  // 5. Управление фоновой музыкой C418
  // ==========================================
  const bgMusic = document.getElementById('bgMusic');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');

  if (bgMusic) {
    bgMusic.volume = 0.5;
  }

  function playMusic() {
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().then(() => {
        if (audioToggleBtn) audioToggleBtn.classList.add('playing');
        if (audioIcon) audioIcon.textContent = '🔊';
        if (audioLabel) audioLabel.textContent = 'C418 звучит';
      }).catch(() => {
        // Браузер ожидает взаимодействия с пользователем
      });
    }
  }

  function pauseMusic() {
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
      if (audioIcon) audioIcon.textContent = '🎵';
      if (audioLabel) audioLabel.textContent = 'C418 - Danny';
    }
  }

  // Запуск музыки при первом касании страницы
  let userInteracted = false;
  function handleFirstInteraction() {
    if (!userInteracted) {
      userInteracted = true;
      playMusic();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    }
  }

  document.addEventListener('click', handleFirstInteraction);
  document.addEventListener('touchstart', handleFirstInteraction);

  // Попытка автозапуска при загрузке
  setTimeout(() => {
    playMusic();
  }, 400);

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userInteracted = true;
      triggerHaptic('light');

      if (!bgMusic) return;

      if (bgMusic.paused) {
        playMusic();
        showToast('Играет C418 - Danny', '🎵');
      } else {
        pauseMusic();
        showToast('Музыка на паузе', '⏸️');
      }
    });
  }

})();
