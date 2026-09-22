// Главный скрипт ночного Telegram WebApp
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

(function () {
  'use strict';

  // Инициализация Telegram WebApp
  const tg = window.Telegram ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#060814');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#060814');
    } catch (e) {
      console.log('Telegram WebApp init error:', e);
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
  function showToast(text, icon = '✨') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2500);
  }

  // ==========================================
  // 1. Интерактивный холст звездного неба
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
  const particles = [];

  function initStars() {
    stars.length = 0;
    const count = Math.floor((width * height) / 3800);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#e8f0fe', '#d7e3fc', '#ffeaa7', '#e0c3fc'][Math.floor(Math.random() * 5)]
      });
    }
  }

  function spawnShootingStar() {
    shootingStars.push({
      x: Math.random() * (width * 0.8),
      y: Math.random() * (height * 0.4),
      length: Math.random() * 80 + 50,
      speed: Math.random() * 8 + 6,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      opacity: 1,
      decay: Math.random() * 0.015 + 0.01
    });
  }

  setInterval(() => {
    if (Math.random() > 0.4) {
      spawnShootingStar();
    }
  }, 4500);

  // Добавление частиц пыли при касании или растворении мыслей
  function spawnStardust(x, y, count = 20, color = '#fed176') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * 2 + 1,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        color: color
      });
    }
  }

  window.addEventListener('pointermove', (e) => {
    if (Math.random() > 0.85) {
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 1.2,
        radius: Math.random() * 1.5 + 0.5,
        alpha: 0.8,
        decay: 0.03,
        color: '#72e5ff'
      });
    }
  });

  function renderNight() {
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

    // Рисование падающих звезд
    ctx.globalAlpha = 1;
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      const tailX = ss.x - Math.cos(ss.angle) * ss.length;
      const tailY = ss.y - Math.sin(ss.angle) * ss.length;

      const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, `rgba(255, 245, 220, ${ss.opacity})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
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

    // Рисование всплывающих частиц пыли
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(renderNight);
  }

  initStars();
  renderNight();

  // ==========================================
  // 2. Часы и статус ночи
  // ==========================================
  const liveClock = document.getElementById('liveClock');
  function updateTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (liveClock) liveClock.textContent = `${h}:${m}`;
  }
  updateTime();
  setInterval(updateTime, 1000);

  // Интерактивная луна
  const moonWrapper = document.getElementById('interactiveMoon');
  if (moonWrapper) {
    moonWrapper.addEventListener('click', () => {
      triggerHaptic('medium');
      spawnShootingStar();
      spawnShootingStar();
      showToast('Падающая звезда летит через небо', '🌠');
    });
  }

  // ==========================================
  // 3. Управление процедурным звуком
  // ==========================================
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioPanel = document.getElementById('audioPanel');
  const closeAudioPanel = document.getElementById('closeAudioPanel');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const presetChips = document.querySelectorAll('.preset-chip');

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic('light');
      audioPanel.classList.toggle('open');
      if (!window.NightAudio.isPlaying) {
        const isNowPlaying = window.NightAudio.toggle();
        updateAudioButtonState(isNowPlaying);
      }
    });
  }

  if (closeAudioPanel) {
    closeAudioPanel.addEventListener('click', () => {
      audioPanel.classList.remove('open');
    });
  }

  function updateAudioButtonState(isPlaying) {
    if (audioToggleBtn) {
      if (isPlaying) {
        audioToggleBtn.classList.add('playing');
        document.getElementById('audioIcon').textContent = '🔊';
      } else {
        audioToggleBtn.classList.remove('playing');
        document.getElementById('audioIcon').textContent = '🔈';
      }
    }
  }

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic('light');
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const preset = chip.getAttribute('data-preset');
      window.NightAudio.play(preset);
      updateAudioButtonState(true);
      showToast(`Звук: ${chip.textContent.trim()}`, '🌙');
    });
  });

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (volumeValue) volumeValue.textContent = `${val}%`;
      window.NightAudio.setVolume(val / 100);
    });
  }

  // Закрытие панели звука при клике вне
  document.addEventListener('click', (e) => {
    if (audioPanel && audioPanel.classList.contains('open')) {
      if (!audioPanel.contains(e.target) && !audioToggleBtn.contains(e.target)) {
        audioPanel.classList.remove('open');
      }
    }
  });

  // ==========================================
  // 4. Вкладки навигации
  // ==========================================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      triggerHaptic('light');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // ==========================================
  // 5. Каталог ночных пожеланий
  // ==========================================
  const wishes = window.WISHES_DATABASE || [];
  const categories = window.CATEGORIES_DATABASE || [];
  let currentCategory = 'all';
  let currentIndex = 0;
  let currentFilteredList = [...wishes];

  const categoriesBar = document.getElementById('categoriesBar');
  const wishTitle = document.getElementById('wishTitle');
  const wishText = document.getElementById('wishText');
  const wishAuthor = document.getElementById('wishAuthor');
  const wishTags = document.getElementById('wishTags');
  const wishBadge = document.getElementById('wishBadge');
  const favToggleBtn = document.getElementById('favToggleBtn');
  const favIcon = document.getElementById('favIcon');

  // Отрисовка категорий
  if (categoriesBar) {
    categoriesBar.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-chip ${cat.id === currentCategory ? 'active' : ''}`;
      btn.innerHTML = `<span>${cat.icon}</span><span>${cat.name}</span>`;
      btn.addEventListener('click', () => {
        triggerHaptic('light');
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = cat.id;
        filterWishes();
      });
      categoriesBar.appendChild(btn);
    });
  }

  function filterWishes() {
    if (currentCategory === 'all') {
      currentFilteredList = [...wishes];
    } else {
      currentFilteredList = wishes.filter(w => w.category === currentCategory);
    }
    currentIndex = 0;
    renderCurrentWish();
  }

  function renderCurrentWish() {
    if (currentFilteredList.length === 0) return;
    const wish = currentFilteredList[currentIndex];

    // Анимация плавного обновления
    const card = document.getElementById('activeWishCard');
    if (card) {
      card.style.opacity = '0.4';
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        wishTitle.textContent = wish.title;
        wishText.textContent = wish.text;
        wishAuthor.textContent = `Автор: ${wish.author}`;
        wishBadge.textContent = `✨ ${getCategoryName(wish.category)}`;

        if (wishTags) {
          wishTags.innerHTML = '';
          wish.tags.forEach(t => {
            const span = document.createElement('span');
            span.className = 'wish-tag';
            span.textContent = `#${t}`;
            wishTags.appendChild(span);
          });
        }

        updateFavoriteStatus(wish.id);

        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, 150);
    }
  }

  function getCategoryName(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Созвездие';
  }

  // Кнопки Назад / Другое
  const nextWishBtn = document.getElementById('nextWishBtn');
  const prevWishBtn = document.getElementById('prevWishBtn');

  if (nextWishBtn) {
    nextWishBtn.addEventListener('click', () => {
      triggerHaptic('light');
      currentIndex = (currentIndex + 1) % currentFilteredList.length;
      renderCurrentWish();
    });
  }

  if (prevWishBtn) {
    prevWishBtn.addEventListener('click', () => {
      triggerHaptic('light');
      currentIndex = (currentIndex - 1 + currentFilteredList.length) % currentFilteredList.length;
      renderCurrentWish();
    });
  }

  // Копирование текста пожелания
  const copyWishBtn = document.getElementById('copyWishBtn');
  if (copyWishBtn) {
    copyWishBtn.addEventListener('click', () => {
      const wish = currentFilteredList[currentIndex];
      if (!wish) return;
      const copyContent = `🌙 ${wish.title}\n\n«${wish.text}»\n\nСладких снов! ✨`;
      navigator.clipboard.writeText(copyContent).then(() => {
        triggerHaptic('success');
        showToast('Пожелание скопировано в буфер', '📋');
      }).catch(() => {
        showToast('Не удалось скопировать', '⚠️');
      });
    });
  }

  // Отправка в Telegram
  const shareWishBtn = document.getElementById('shareWishBtn');
  if (shareWishBtn) {
    shareWishBtn.addEventListener('click', () => {
      const wish = currentFilteredList[currentIndex];
      if (!wish) return;
      triggerHaptic('medium');
      const textToSend = `🌙 ${wish.title}\n\n«${wish.text}»\n\nСладких и волшебных снов! ✨`;

      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({
          type: 'wish_shared',
          title: wish.title,
          text: wish.text
        }));
      } else {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(textToSend)}`;
        window.open(shareUrl, '_blank');
      }
    });
  }

  // Избранные пожелания (LocalStorage)
  let favorites = [];
  try {
    favorites = JSON.parse(localStorage.getItem('night_favorites') || '[]');
  } catch (e) {
    favorites = [];
  }

  function updateFavoriteStatus(id) {
    const isFav = favorites.includes(id);
    if (favIcon) favIcon.textContent = isFav ? '❤️' : '🤍';
  }

  if (favToggleBtn) {
    favToggleBtn.addEventListener('click', () => {
      const wish = currentFilteredList[currentIndex];
      if (!wish) return;
      triggerHaptic('medium');
      const idx = favorites.indexOf(wish.id);
      if (idx > -1) {
        favorites.splice(idx, 1);
        showToast('Удалено из избранного', '🤍');
      } else {
        favorites.push(wish.id);
        showToast('Добавлено в избранное', '❤️');
      }
      try {
        localStorage.setItem('night_favorites', JSON.stringify(favorites));
      } catch (e) {}
      updateFavoriteStatus(wish.id);
      renderSavedWishes();
    });
  }

  function renderSavedWishes() {
    const list = document.getElementById('savedWishesList');
    const count = document.getElementById('savedCount');
    if (!list || !count) return;

    count.textContent = String(favorites.length);
    if (favorites.length === 0) {
      list.innerHTML = '<p class="empty-hint">Нажмите на сердечко, чтобы сохранить любимые слова на память.</p>';
      return;
    }

    list.innerHTML = '';
    favorites.forEach(favId => {
      const wish = wishes.find(w => w.id === favId);
      if (!wish) return;
      const item = document.createElement('div');
      item.className = 'saved-item';
      item.innerHTML = `
        <span class="saved-item-title">${wish.title}</span>
        <button class="saved-item-del" data-id="${wish.id}" title="Удалить">✕</button>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('saved-item-del')) {
          e.stopPropagation();
          const idToRemove = parseInt(e.target.getAttribute('data-id'), 10);
          favorites = favorites.filter(id => id !== idToRemove);
          try {
            localStorage.setItem('night_favorites', JSON.stringify(favorites));
          } catch (err) {}
          renderSavedWishes();
          updateFavoriteStatus(currentFilteredList[currentIndex]?.id);
          showToast('Удалено', '🤍');
          return;
        }
        // Открыть пожелание
        currentCategory = 'all';
        currentFilteredList = [...wishes];
        currentIndex = wishes.findIndex(w => w.id === wish.id);
        renderCurrentWish();
        window.scrollTo({ top: 120, behavior: 'smooth' });
      });
      list.appendChild(item);
    });
  }

  // Первоначальный рендер
  renderCurrentWish();
  renderSavedWishes();

  // ==========================================
  // 6. Конструктор ночной открытки
  // ==========================================
  const recipientInput = document.getElementById('recipientInput');
  const moodChips = document.querySelectorAll('.mood-chip');
  const traitChips = document.querySelectorAll('.trait-chip');
  const generateCardBtn = document.getElementById('generateCardBtn');
  const generatedPreview = document.getElementById('generatedPreview');
  const previewBody = document.getElementById('previewBody');
  const copyGeneratedBtn = document.getElementById('copyGeneratedBtn');
  const shareGeneratedBtn = document.getElementById('shareGeneratedBtn');

  let currentMood = 'romantic';

  moodChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic('light');
      moodChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentMood = chip.getAttribute('data-mood');
    });
  });

  traitChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic('light');
      chip.classList.toggle('active');
    });
  });

  function buildPersonalizedCard() {
    const rawName = (recipientInput && recipientInput.value.trim()) || 'Моя любимая';
    const activeTraits = Array.from(traitChips)
      .filter(c => c.classList.contains('active'))
      .map(c => c.textContent.trim());

    let intro = '';
    let body = '';
    let outro = '';

    switch (currentMood) {
      case 'romantic':
        intro = `Мое самое дорогое созвездие, ${rawName}! ✨`;
        body = `Пусть эта тихая ночь бережно укроет тебя одеялом из звезд. Я мысленно обнимаю тебя крепко-крепко и целую перед сном. Ты самое прекрасное, что есть в моей жизни.`;
        outro = `Сладких и волшебных снов, люблю тебя всем сердцем! ❤️`;
        break;
      case 'cozy':
        intro = `Уютного сна для ${rawName} 🧸`;
        body = `Ты сегодня большая умница, а сейчас пора сладко отдыхать. Укутайся в теплое одеяло, устройся поудобнее на подушке и послушай тишину. Весь мир подождет до утра.`;
        outro = `Крепких и целебных сновидений, моя радость! 🌙`;
        break;
      case 'stars':
        intro = `Звездная сказка для ${rawName} 🌌`;
        body = `Закрывай глазки и отправляйся в самые чудесные сны. Пусть эта ночь принесет тебе только тепло, волшебство и безмятежный покой.`;
        outro = `Спи сладко до самого утра! 💫`;
        break;
      case 'deep':
        intro = `Крепкие объятия на ночь для ${rawName} 🥰`;
        body = `Если бы я был рядом прямо сейчас, я бы нежно прижал тебя к себе, гладил по волосам и оберегал твой покой всю ночь напролет.`;
        outro = `Целую в носик и мысленно обнимаю. Доброй ночи! 🕊️`;
        break;
    }

    let traitsText = '';
    if (activeTraits.length > 0) {
      traitsText = `\n\nДля тебя этой ночью: ${activeTraits.join(', ')}.`;
    }

    return `${intro}\n\n${body}${traitsText}\n\n${outro}`;
  }

  let generatedTextCache = '';

  if (generateCardBtn) {
    generateCardBtn.addEventListener('click', () => {
      triggerHaptic('medium');
      generatedTextCache = buildPersonalizedCard();
      if (previewBody) previewBody.textContent = generatedTextCache;
      if (generatedPreview) {
        generatedPreview.style.display = 'block';
        generatedPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      showToast('Открытка сотворена!', '💌');
    });
  }

  if (copyGeneratedBtn) {
    copyGeneratedBtn.addEventListener('click', () => {
      if (!generatedTextCache) return;
      navigator.clipboard.writeText(generatedTextCache).then(() => {
        triggerHaptic('success');
        showToast('Открытка скопирована', '📋');
      });
    });
  }

  if (shareGeneratedBtn) {
    shareGeneratedBtn.addEventListener('click', () => {
      if (!generatedTextCache) return;
      triggerHaptic('medium');
      const recipient = (recipientInput && recipientInput.value.trim()) || 'Близкий человек';

      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({
          type: 'custom_wish',
          recipient: recipient,
          text: generatedTextCache
        }));
      } else {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(generatedTextCache)}`;
        window.open(shareUrl, '_blank');
      }
    });
  }

})();
