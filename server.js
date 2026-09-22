// Главный сервер приложения "Спокойной ночи"
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

const path = require('path');
const express = require('express');
const config = require('./config');
const { WISHES, CATEGORIES } = require('./wishes-data');
const { initBot } = require('./bot');

const app = express();

// Промежуточные обработчики
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздача статических файлов WebApp
app.use(express.static(path.join(__dirname, 'public')));

// API эндпоинты
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'good-night-webapp',
    timestamp: new Date().toISOString(),
    port: config.PORT
  });
});

app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: CATEGORIES });
});

app.get('/api/wishes', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'all') {
    const filtered = WISHES.filter(w => w.category === category);
    return res.json({ success: true, wishes: filtered });
  }
  res.json({ success: true, wishes: WISHES });
});

app.get('/api/wishes/random', (req, res) => {
  const { category } = req.query;
  let pool = WISHES;
  if (category && category !== 'all') {
    pool = WISHES.filter(w => w.category === category);
    if (pool.length === 0) pool = WISHES;
  }
  const randomIndex = Math.floor(Math.random() * pool.length);
  res.json({ success: true, wish: pool[randomIndex] });
});

// Отдача главной страницы на любые неизвестные маршруты
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
const server = app.listen(config.PORT, config.HOST, () => {
  console.log(`Сервер успешно запущен на http://${config.HOST}:${config.PORT}`);
  console.log(`WebApp URL: ${config.WEBAPP_URL}`);

  // Инициализация и запуск Telegram-бота
  const botInstance = initBot();
  botInstance.start();
});

// Обработка непредвиденных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанная ошибка в Promise:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Критическая ошибка:', err);
});
