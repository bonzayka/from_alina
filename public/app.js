// Скрипт утренней персональной романтической страницы для любимой девушки
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

(function () {
  'use strict';

  // Инициализация Telegram WebApp
  const tg = window.Telegram ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#100b18');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#100b18');
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
  function showToast(text, icon = '☀️') {
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
  // 1. Интерактивный утренний холст
  // ==========================================
  const canvas = document.getElementById('morningCanvas');
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initMotes();
  });

  const motes = [];
  const sunbeams = [];
  const floatingItems = [];

  // Утренние золотистые пылинки и светящиеся искорки
  function initMotes() {
    motes.length = 0;
    const count = Math.floor((width * height) / 4500);
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.5,
        baseAlpha: Math.random() * 0.6 + 0.25,
        pulseSpeed: Math.random() * 0.025 + 0.008,
        pulsePhase: Math.random() * Math.PI * 2,
        vy: -(Math.random() * 0.35 + 0.1),
        vx: (Math.random() - 0.5) * 0.2,
        color: ['#ffefa0', '#ffd166', '#ffb070', '#ffffff', '#ffe4f0'][Math.floor(Math.random() * 5)]
      });
    }
  }

  // Запуск пролетающего солнечного луча
  function spawnSunbeam() {
    sunbeams.push({
      x: Math.random() * (width * 0.9),
      y: -20,
      length: Math.random() * 110 + 70,
      speed: Math.random() * 6 + 4,
      angle: Math.PI / 3 + (Math.random() - 0.5) * 0.25,
      opacity: 0.9,
      decay: Math.random() * 0.015 + 0.008
    });
  }

  setInterval(() => {
    if (Math.random() > 0.4) {
      spawnSunbeam();
    }
  }, 3500);

  // Создание утреннего салюта сердечек и солнышек
  function spawnHeartsBurst() {
    const symbols = ['☀️', '💖', '✨', '🌸', '💛', '🥰'];
    for (let i = 0; i < 30; i++) {
      floatingItems.push({
        x: Math.random() * width,
        y: height + Math.random() * 30,
        vx: (Math.random() - 0.5) * 2.6,
        vy: -(Math.random() * 3.6 + 2.4),
        size: Math.random() * 16 + 14,
        alpha: 1,
        decay: Math.random() * 0.012 + 0.006,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Рисование утренних частиц света
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.pulsePhase += m.pulseSpeed;
      m.y += m.vy;
      m.x += m.vx;

      if (m.y < -10) m.y = height + 10;
      if (m.x < -10) m.x = width + 10;
      if (m.x > width + 10) m.x = -10;

      const alpha = m.baseAlpha + Math.sin(m.pulsePhase) * 0.25;
      ctx.fillStyle = m.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Солнечные лучи
    ctx.globalAlpha = 1;
    for (let i = sunbeams.length - 1; i >= 0; i--) {
      const sb = sunbeams[i];
      const tailX = sb.x - Math.cos(sb.angle) * sb.length;
      const tailY = sb.y - Math.sin(sb.angle) * sb.length;

      const grad = ctx.createLinearGradient(tailX, tailY, sb.x, sb.y);
      grad.addColorStop(0, 'rgba(255, 240, 180, 0)');
      grad.addColorStop(1, `rgba(255, 200, 80, ${sb.opacity})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(sb.x, sb.y);
      ctx.stroke();

      sb.x += Math.cos(sb.angle) * sb.speed;
      sb.y += Math.sin(sb.angle) * sb.speed;
      sb.opacity -= sb.decay;

      if (sb.opacity <= 0) {
        sunbeams.splice(i, 1);
      }
    }

    // Летающие утренние эмодзи и сердечки
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

    requestAnimationFrame(render);
  }

  initMotes();
  render();

  // ==========================================
  // 2. Часы и интерактивное солнышко
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
    currentDateText.textContent = `Утро, ${dateStr}`;
  }

  const sunWrapper = document.getElementById('interactiveSun');
  if (sunWrapper) {
    sunWrapper.addEventListener('click', () => {
      triggerHaptic('medium');
      spawnSunbeam();
      spawnSunbeam();
      spawnHeartsBurst();
      showToast('Солнечный лучик заряжает тебя теплом! ☀️', '✨');
    });
  }

  // ==========================================
  // 3. Кнопка "Почувствовать тепло и объятие"
  // ==========================================
  const hugBtn = document.getElementById('hugBtn');
  if (hugBtn) {
    hugBtn.addEventListener('click', () => {
      triggerHaptic('success');
      spawnHeartsBurst();
      showToast('Я крепко обнял тебя и поцеловал в щечку! ❤️', '🤗');
    });
  }

  // ==========================================
  // 4. Утренние мысли (Лучики хорошего дня)
  // ==========================================
  const notesList = [
    'Ты самое прекрасное и теплое солнышко в моей жизни.',
    'Пусть сегодняшний день принесет тебе легкость, улыбки и море вдохновения.',
    'Я безумно люблю твой звонкий смех и то, как ты освещаешь все вокруг.',
    'Помни, что ты умница и со всем легко справишься. Я всегда рядом.',
    'Пусть твой утренний кофе или чай будет самым вкусным и согревающим.',
    'Шлю тебе утренний лучик любви и самый нежный поцелуй в носик.',
    'Улыбнись прямо сейчас! Новый день ждет твоего сияния и красоты.'
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
        if (noteCounter) noteCounter.textContent = `Лучик ${currentNoteIndex + 1} из ${notesList.length}`;
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
  // 5. Управление фоновой музыкой C418 - Mall
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
        if (audioLabel) audioLabel.textContent = 'C418 - Mall звучит';
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
      if (audioLabel) audioLabel.textContent = 'C418 - Mall';
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
        showToast('Играет C418 - Mall', '🎵');
      } else {
        pauseMusic();
        showToast('Музыка на паузе', '⏸️');
      }
    });
  }

})();
