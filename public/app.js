// ============================================================
// Интерактивная логика ночного портала
// Внимание: строго запрещены длинные тире (em-dash / en-dash).
// Используются только стандартные дефисы (-).
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Telegram WebApp инициализация
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#060810');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#060810');
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

  // Всплывающие уведомления (Toast)
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

  // 2. Фоновое видео (Ambient Video Background)
  const bgVideo = document.getElementById('bgVideo');
  if (bgVideo) {
    bgVideo.muted = true;
    bgVideo.defaultMuted = true;
    bgVideo.setAttribute('muted', '');
    bgVideo.setAttribute('playsinline', '');
    bgVideo.setAttribute('webkit-playsinline', '');

    const startBgVideo = () => {
      bgVideo.play().catch(() => {});
    };

    startBgVideo();
    window.addEventListener('click', startBgVideo, { once: true });
    window.addEventListener('touchstart', startBgVideo, { once: true });
  }

  // 3. Индикатор скролла
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  window.addEventListener('scroll', () => {
    if (!scrollProgressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgressBar.style.width = `${progress}%`;
  }, { passive: true });

  // 4. Фоновая музыка (Oneheart, Antent, Dean Korso - Stardome)
  // И логика авто-приглушения звука на 70% при воспроизведении видео
  const bgMusic = document.getElementById('bgMusic');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const musicCapsule = document.getElementById('musicCapsule');
  const duckingBadge = document.getElementById('duckingBadge');

  let isMusicPlaying = false;
  let baseMusicVolume = 1.0;
  let isDucked = false;
  let volumeFadeInterval = null;

  // Плавный фейд громкости фоновой музыки
  function fadeMusicVolume(targetVolume, duration = 350) {
    if (!bgMusic) return;
    if (volumeFadeInterval) clearInterval(volumeFadeInterval);

    const startVolume = bgMusic.volume;
    const diff = targetVolume - startVolume;
    const steps = 18;
    const stepTime = duration / steps;
    let stepCount = 0;

    volumeFadeInterval = setInterval(() => {
      stepCount++;
      const current = startVolume + (diff * (stepCount / steps));
      bgMusic.volume = Math.max(0, Math.min(1, current));

      if (stepCount >= steps) {
        clearInterval(volumeFadeInterval);
        bgMusic.volume = Math.max(0, Math.min(1, targetVolume));
      }
    }, stepTime);
  }

  // Приглушение музыки на 70% (остается 30% громкости)
  function applyAudioDucking() {
    if (!isDucked) {
      isDucked = true;
      fadeMusicVolume(baseMusicVolume * 0.3, 300);
      if (duckingBadge) duckingBadge.classList.add('active');
    }
  }

  // Восстановление нормальной громкости
  function removeAudioDucking() {
    if (isDucked) {
      isDucked = false;
      fadeMusicVolume(baseMusicVolume, 350);
      if (duckingBadge) duckingBadge.classList.remove('active');
    }
  }

  function playMusic() {
    if (!bgMusic) return;
    bgMusic.play().then(() => {
      isMusicPlaying = true;
      if (musicCapsule) musicCapsule.classList.add('playing');
    }).catch(() => {
      isMusicPlaying = false;
      if (musicCapsule) musicCapsule.classList.remove('playing');
    });
  }

  function pauseMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
    isMusicPlaying = false;
    if (musicCapsule) musicCapsule.classList.remove('playing');
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      triggerHaptic('light');
      if (isMusicPlaying) {
        pauseMusic();
        showToast('Музыка на паузе', '⏸');
      } else {
        playMusic();
        showToast('Oneheart - Stardome играет', '🎵');
      }
    });
  }

  // Автозапуск музыки при первом взаимодействии
  const autoPlayMusicOnce = () => {
    if (!isMusicPlaying && bgMusic) {
      playMusic();
    }
    window.removeEventListener('click', autoPlayMusicOnce);
    window.removeEventListener('touchstart', autoPlayMusicOnce);
  };
  window.addEventListener('click', autoPlayMusicOnce, { once: true });
  window.addEventListener('touchstart', autoPlayMusicOnce, { once: true });

  // 5. Видео-карусель (Swipable Video Feed)
  const videoCarousel = document.getElementById('videoCarousel');
  const carouselViewport = document.getElementById('carouselViewport');
  const carouselTrack = document.getElementById('carouselTrack');
  const slides = Array.from(document.querySelectorAll('.video-slide'));
  const dots = Array.from(document.querySelectorAll('.carousel-dots .dot'));
  const prevVideoBtn = document.getElementById('prevVideoBtn');
  const nextVideoBtn = document.getElementById('nextVideoBtn');
  const slideCounter = document.getElementById('slideCounter');

  let currentSlideIndex = 0;
  const totalSlides = slides.length;

  // Инициализация видеоплееров внутри слайдов
  slides.forEach((slide, index) => {
    const video = slide.querySelector('.carousel-video');
    const playBox = slide.querySelector('.video-player-box');
    const centerPlayBtn = slide.querySelector('.center-play-btn');
    const soundBtn = slide.querySelector('.video-sound-btn');
    const soundIcon = soundBtn ? soundBtn.querySelector('.sound-icon') : null;
    const progressFill = slide.querySelector('.video-progress-fill');
    const timeTrack = slide.querySelector('.video-time-track');
    const fullscreenBtn = slide.querySelector('.video-fullscreen-btn');

    if (!video) return;

    // Включаем звук по умолчанию при запуске клипа
    video.muted = false;

    // Обновление прогресс-бара
    video.addEventListener('timeupdate', () => {
      if (video.duration && progressFill) {
        const percent = (video.currentTime / video.duration) * 100;
        progressFill.style.width = `${percent}%`;
      }
    });

    // Перемотка по клику на полосу прогресса
    if (timeTrack) {
      timeTrack.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = timeTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        if (video.duration) {
          video.currentTime = ratio * video.duration;
        }
      });
    }

    // Воспроизведение / Пауза
    const toggleVideoPlayback = (e) => {
      if (e) e.stopPropagation();
      triggerHaptic('light');

      if (video.paused || video.ended) {
        // Останавливаем остальные видео
        slides.forEach((otherSlide, otherIdx) => {
          if (otherIdx !== index) {
            const otherVid = otherSlide.querySelector('.carousel-video');
            const otherBox = otherSlide.querySelector('.video-player-box');
            if (otherVid && !otherVid.paused) {
              otherVid.pause();
              if (otherBox) otherBox.classList.remove('playing');
            }
          }
        });

        video.play().then(() => {
          if (playBox) playBox.classList.add('playing');
        }).catch(() => {
          // Если браузер заблокировал со звуком, пробуем с muted
          video.muted = true;
          if (soundIcon) soundIcon.textContent = '🔇';
          video.play().then(() => {
            if (playBox) playBox.classList.add('playing');
          }).catch(() => {});
        });
      } else {
        video.pause();
        if (playBox) playBox.classList.remove('playing');
      }
    };

    if (centerPlayBtn) centerPlayBtn.addEventListener('click', toggleVideoPlayback);
    if (playBox) playBox.addEventListener('click', toggleVideoPlayback);

    // Управление звуком клипа
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        video.muted = !video.muted;
        if (soundIcon) soundIcon.textContent = video.muted ? '🔇' : '🔊';
        showToast(video.muted ? 'Звук клипа выключен' : 'Звук клипа включен', video.muted ? '🔇' : '🔊');
      });
    }

    // Полноэкранный режим
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        }
      });
    }

    // Логика Audio Ducking (приглушение фоновой музыки на 70%)
    video.addEventListener('play', () => {
      applyAudioDucking();
      if (playBox) playBox.classList.add('playing');
    });

    video.addEventListener('pause', () => {
      checkAllVideosPaused();
      if (playBox) playBox.classList.remove('playing');
    });

    video.addEventListener('ended', () => {
      checkAllVideosPaused();
      if (playBox) playBox.classList.remove('playing');
      if (progressFill) progressFill.style.width = '0%';
    });
  });

  // Проверка, играет ли сейчас хотя бы одно видео
  function checkAllVideosPaused() {
    const anyPlaying = slides.some(slide => {
      const vid = slide.querySelector('.carousel-video');
      return vid && !vid.paused && !vid.ended;
    });

    if (!anyPlaying) {
      removeAudioDucking();
    }
  }

  // Переключение слайда видеокарусели
  function goToSlide(targetIndex) {
    if (targetIndex < 0) targetIndex = totalSlides - 1;
    if (targetIndex >= totalSlides) targetIndex = 0;

    // Пауза видео на текущем слайде перед переключением
    const currentVideo = slides[currentSlideIndex]?.querySelector('.carousel-video');
    const currentBox = slides[currentSlideIndex]?.querySelector('.video-player-box');
    if (currentVideo && !currentVideo.paused) {
      currentVideo.pause();
      if (currentBox) currentBox.classList.remove('playing');
    }

    currentSlideIndex = targetIndex;

    // Сдвиг трека
    if (carouselTrack) {
      carouselTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    }

    // Обновление классов активности
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlideIndex);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlideIndex);
    });

    if (slideCounter) {
      slideCounter.textContent = `${currentSlideIndex + 1} / ${totalSlides}`;
    }

    checkAllVideosPaused();
  }

  if (prevVideoBtn) {
    prevVideoBtn.addEventListener('click', () => {
      triggerHaptic('light');
      goToSlide(currentSlideIndex - 1);
    });
  }

  if (nextVideoBtn) {
    nextVideoBtn.addEventListener('click', () => {
      triggerHaptic('light');
      goToSlide(currentSlideIndex + 1);
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      triggerHaptic('light');
      goToSlide(index);
    });
  });

  // Жесты свайпа для мобильных устройств
  let touchStartX = 0;
  let touchStartY = 0;

  if (carouselViewport) {
    carouselViewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    carouselViewport.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;

      // Если горизонтальный свайп преобладает над вертикальным скроллом
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        triggerHaptic('light');
        if (diffX < 0) {
          goToSlide(currentSlideIndex + 1); // свайп влево -> следующее видео
        } else {
          goToSlide(currentSlideIndex - 1); // свайп вправо -> предыдущее видео
        }
      }
    }, { passive: true });
  }

  // 6. Пронумерованная галерея картинок и Lightbox модал
  const galleryCards = Array.from(document.querySelectorAll('.gallery-card'));
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');

  let currentPhotoIndex = 0;
  const photosData = galleryCards.map((card, i) => {
    const src = card.getAttribute('data-src') || '';
    const tag = card.querySelector('.card-tag')?.textContent || `Кадр ${i + 1}`;
    return { src, tag };
  });

  function openLightbox(index) {
    if (index < 0) index = photosData.length - 1;
    if (index >= photosData.length) index = 0;

    currentPhotoIndex = index;
    const item = photosData[currentPhotoIndex];

    if (lightboxImg) lightboxImg.src = item.src;
    if (lightboxCaption) lightboxCaption.textContent = item.tag;
    if (lightboxCounter) lightboxCounter.textContent = `${currentPhotoIndex + 1} / ${photosData.length}`;

    if (lightboxModal) {
      lightboxModal.classList.add('active');
      lightboxModal.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
    triggerHaptic('light');
  }

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove('active');
      lightboxModal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  galleryCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      openLightbox(index);
    });
  });

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(currentPhotoIndex - 1);
    });
  }

  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(currentPhotoIndex + 1);
    });
  }

  // Управление с клавиатуры (Esc, стрелки)
  window.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(currentPhotoIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(currentPhotoIndex + 1);
    }
  });

  // 7. Секция "Спокойной ночи" и интерактивная кнопка загадать сладкий сон
  const wishStarBtn = document.getElementById('wishStarBtn');
  const wishHint = document.getElementById('wishHint');

  const nightWishes = [
    'Сладких снов, моя любимая девочка! 🌙✨',
    'Пусть приснятся самые чудесные и теплые сны! 💫',
    'Укутываю тебя нежностью и крепко целую на ночь! ☁️',
    'Отдыхай сладко, набирайся сил к завтрашнему дню! 🌸',
    'Ты самое прекрасное, что есть в этом мире. Спи крепко! 💖'
  ];
  let wishClickCount = 0;

  if (wishStarBtn) {
    wishStarBtn.addEventListener('click', () => {
      triggerHaptic('success');
      wishClickCount++;

      const phrase = nightWishes[wishClickCount % nightWishes.length];
      showToast(phrase, '✨');

      if (wishHint) {
        wishHint.textContent = 'Звездопад снов отправлен прямо к твоей подушке ✨';
        wishHint.style.color = '#fef08a';
      }

      // Запуск салюта звезд на холсте
      createStarDustBurst(window.innerWidth / 2, window.innerHeight * 0.75);
    });
  }

  // 8. Интерактивный ночной холст (звезды и метеоры)
  const canvas = document.getElementById('celestialCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let width = 0;
  let height = 0;
  const stars = [];
  const burstParticles = [];

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars.length = 0;
    const count = Math.min(80, Math.floor(width / 16));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        color: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#fef08a' : '#c7d2fe')
      });
    }
  }

  function createStarDustBurst(originX, originY) {
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      burstParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * 2.5 + 1,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.02 + 0.012,
        color: Math.random() > 0.3 ? '#fef08a' : '#818cf8'
      });
    }
  }

  function renderCelestial() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Отрисовка мерцающих звезд
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.alpha += s.twinkleSpeed;
      if (s.alpha > 0.95 || s.alpha < 0.2) {
        s.twinkleSpeed = -s.twinkleSpeed;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Отрисовка частиц взрыва снов
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04; // мягкая гравитация
      p.life -= p.decay;

      if (p.life <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(renderCelestial);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  renderCelestial();
});
