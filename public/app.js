// Интерактивный скрипт страницы заботы "Выздоравливай поскорее, солнышко!"
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
      if (tg.setHeaderColor) tg.setHeaderColor('#fff0f5');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#fff0f5');
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
  function showToast(text, icon = '🌸') {
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
  // 2. Интерактивный холст: кружащиеся лепестки и искры
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

  // Инициализация лепестков сакуры и солнечных пылинок
  function initPetals() {
    petals.length = 0;
    const count = Math.min(38, Math.floor((width * height) / 18000));

    for (let i = 0; i < count; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 11 + 9,
        vy: Math.random() * 0.9 + 0.45,
        vx: Math.random() * 0.7 - 0.2,
        swing: Math.random() * 2 + 1,
        swingSpeed: Math.random() * 0.02 + 0.008,
        swingPhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        color: Math.random() > 0.4 ? 'rgba(255, 182, 193, 0.75)' : 'rgba(255, 209, 220, 0.85)',
        type: Math.random() > 0.2 ? 'petal' : 'sunbeam'
      });
    }
  }

  // Взрыв лепестков, сердечек и искорок при клике/касании
  function spawnBlossomBurst(originX, originY) {
    const symbols = ['🌸', '💖', '☀️', '✨', '🌷', '🤍', '🧸', '🍓'];
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

  // Анимационный цикл холста
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
        // Солнечный лучик
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
  // 3. Интерактивное солнышко
  // ==========================================
  const sunWrapper = document.getElementById('interactiveSun');
  const sunPhrases = [
    'Ты моё самое яркое и любимое солнышко! ☀️💖',
    'Я согрею тебя даже сквозь сотни километров! 🌸',
    'Шлю тебе тысячу поцелуев в носик и лобик! ✨',
    'Поправляйся скорее, радость моя ненаглядная! 🌷',
    'Улыбнись, солнышко, твой котеночек всегда рядом! 🐱'
  ];

  if (sunWrapper) {
    sunWrapper.addEventListener('click', (e) => {
      triggerHaptic('medium');
      spawnBlossomBurst(e.clientX, e.clientY);
      const randomPhrase = sunPhrases[Math.floor(Math.random() * sunPhrases.length)];
      showToast(randomPhrase, '☀️');
    });
  }

  // ==========================================
  // 4. Интерактивная аптечка первой нежности
  // ==========================================
  const kitCards = document.querySelectorAll('.kit-card');
  const kitMessages = {
    tea: {
      text: 'Горячий чай заварен! Пей не спеша, пусть горлышко не болит ❤️',
      icon: '🍵',
      btn: 'Чай выпит ✓'
    },
    plaid: {
      text: 'Укутал тебя самым мягким пледиком! Теперь ты в уютном коконе 🧸',
      icon: '🧸',
      btn: 'В тепле ✓'
    },
    vitamin: {
      text: 'Витаминка принята! 100% нежности уже исцеляют тебя 💖',
      icon: '💊',
      btn: 'Принято ✓'
    },
    honey: {
      text: 'Сладкая ложечка мёда для твоего скорейшего выздоровления! 🍯',
      icon: '🍯',
      btn: 'Сладко ✓'
    }
  };

  kitCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      const action = card.getAttribute('data-action');
      const data = kitMessages[action];
      if (!data) return;

      triggerHaptic('success');
      spawnBlossomBurst(e.clientX, e.clientY);
      showToast(data.text, data.icon);

      card.classList.add('taken');
      const label = card.querySelector('.kit-btn-label');
      if (label) {
        label.textContent = data.btn;
      }
    });
  });

  // ==========================================
  // 5. Игровая плашка :Р строго под 3-м фото
  // ==========================================
  const tongueBadge = document.getElementById('tongueBadge');
  if (tongueBadge) {
    tongueBadge.addEventListener('click', (e) => {
      triggerHaptic('light');
      spawnBlossomBurst(e.clientX, e.clientY);
      showToast('твоя жопа = моя жопа :Р Выздоравливай скорее! 🍑✨', '🐱');
    });
  }

  // Касание к фотографиям с теплым откликом
  const photoWrappers = document.querySelectorAll('.photo-wrapper');
  photoWrappers.forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      triggerHaptic('light');
      spawnBlossomBurst(e.clientX, e.clientY);
    });
  });

  // ==========================================
  // 6. Интерактивные лучики исцеляющего тепла
  // ==========================================
  const wishesList = (window.WISHES_DATABASE && window.WISHES_DATABASE.length > 0)
    ? window.WISHES_DATABASE.map(w => w.text)
    : [
      'Выздоравливай поскорее, солнышко! Пусть температура скорее спадет, слабость уйдет, а силы вернутся. Я посылаю тебе всю энергию и тепло своего сердца!',
      'Представь, что я сижу прямо рядом с твоей кроваткой, подаю кружку с чаем и нежно глажу тебя по волосам.',
      'Даже когда ты болеешь, ты для меня самая прекрасная и любимая девочка на свете!',
      'Закрывай глазки и почувствуй, как я крепко укрываю тебя пушистым пледом. Ты в полной безопасности.',
      'Каждая клеточка твоего организма прямо сейчас наполняется здоровьем и силами!'
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
  // 7. Кнопка согревающего объятия
  // ==========================================
  const hugBtn = document.getElementById('hugBtn');
  if (hugBtn) {
    hugBtn.addEventListener('click', (e) => {
      triggerHaptic('success');
      spawnBlossomBurst(e.clientX, e.clientY);
      setTimeout(() => spawnBlossomBurst(width / 3, height / 2), 200);
      setTimeout(() => spawnBlossomBurst((2 * width) / 3, height / 2), 400);

      showToast('Я крепко-крепко прижал тебя к себе и поцеловал! Скоро всё пройдет! 🫂❤️', '💖');
    });
  }

  // ==========================================
  // 8. Плавное появление карточек при скролле
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
  // 9. Управление фоновой музыкой Oneheart - Apathy
  // ==========================================
  const bgMusic = document.getElementById('bgMusic');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');

  if (bgMusic) {
    bgMusic.volume = 0.55;
  }

  function playMusic() {
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().then(() => {
        if (audioToggleBtn) audioToggleBtn.classList.add('playing');
        if (audioIcon) audioIcon.textContent = '🔊';
        if (audioLabel) audioLabel.textContent = 'Oneheart звучит';
      }).catch(() => {});
    }
  }

  function pauseMusic() {
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
      if (audioIcon) audioIcon.textContent = '🎵';
      if (audioLabel) audioLabel.textContent = 'Oneheart';
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
        showToast('Играет умиротворяющая музыка 🎵', '🌸');
      } else {
        pauseMusic();
        showToast('Музыка на паузе', '⏸️');
      }
    });
  }

  // Клик в любом свободном месте порождает маленькие искорки
  document.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && !e.target.closest('.kit-card')) {
      spawnBlossomBurst(e.clientX, e.clientY);
    }
  });

})();
