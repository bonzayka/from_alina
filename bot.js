// Модуль Telegram-бота для проекта "С добрым утром, солнышко!"
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const { WISHES } = require('./wishes-data');

function initBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Глобальный перехват ошибок Telegraf, чтобы процесс не падал
  bot.catch((err, ctx) => {
    console.error(`Ошибка Telegraf (${ctx ? ctx.updateType : 'unknown'}):`, err.message);
  });

  // Команда /start
  bot.start(async (ctx) => {
    const welcomeText = `☀️ С добрым утром, моё любимое солнышко!\n\n` +
      `Я приготовил для тебя этот нежный рассветный уголок с открытками, утренними письмами и спокойной атмосферной музыкой в стиле Oneheart, чтобы твой день начался с самой тёплой улыбки.\n\n` +
      `Открывай скорее, прекрасного тебе дня, моя умничка! 🌸💖`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.webApp('☀️ Открыть утреннее послание', config.WEBAPP_URL)
      ],
      [
        Markup.button.callback('🌸 Случайный лучик нежности', 'random_wish')
      ]
    ]);

    await ctx.reply(welcomeText, keyboard);
  });

  // Обработка кнопки случайного пожелания
  bot.action('random_wish', async (ctx) => {
    await ctx.answerCbQuery();
    const randomIndex = Math.floor(Math.random() * WISHES.length);
    const wish = WISHES[randomIndex];

    const messageText = `☀️ *${wish.title}*\n\n` +
      `«${wish.text}»\n\n` +
      `_${wish.author}_`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔄 Ещё одно пожелание', 'random_wish')
      ],
      [
        Markup.button.webApp('🌸 Открыть утренний портал', config.WEBAPP_URL)
      ]
    ]);

    await ctx.reply(messageText, { parse_mode: 'Markdown', ...keyboard });
  });

  // Обработка данных, пришедших из WebApp
  bot.on('message', async (ctx, next) => {
    if (ctx.message && ctx.message.web_app_data) {
      try {
        const rawData = ctx.message.web_app_data.data;
        const parsed = JSON.parse(rawData);

        if (parsed.type === 'custom_wish') {
          const replyText = `💌 *Утренний ответ от моего солнышка (${parsed.recipient || 'любимая'})*\n\n` +
            `«${parsed.text}»\n\n` +
            `_Пусть это утро будет самым счастливым!_ ☀️🌸`;

          await ctx.reply(replyText, { parse_mode: 'Markdown' });
          return;
        }

        if (parsed.type === 'wish_shared' || parsed.type === 'morning_kiss') {
          const replyText = `☀️ *Утренний лучик сохранён*\n\n` +
            `«${parsed.text}»\n\n` +
            `_Пусть весь твой день будет согрет любовью!_ 💖`;

          await ctx.reply(replyText, { parse_mode: 'Markdown' });
          return;
        }
      } catch (err) {
        console.error('Ошибка обработки web_app_data:', err.message);
      }
    }
    return next();
  });

  // Установка кнопки меню WebApp
  async function configureMenuButton() {
    try {
      await bot.telegram.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '☀️ С добрым утром',
          web_app: {
            url: config.WEBAPP_URL
          }
        }
      });
      console.log('Кнопка меню WebApp успешно настроена');
    } catch (err) {
      console.error('Не удалось установить кнопку меню:', err.message);
    }
  }

  // Запуск бота с авто-повтором при перезапуске контейнера (409 Conflict / сеть)
  let stopped = false;

  async function launchWithRetry(attempt = 1) {
    if (stopped) return;
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      await configureMenuButton();
      console.log(`Запуск Telegram-бота (попытка ${attempt})...`);
      await bot.launch({
        dropPendingUpdates: true
      });
    } catch (err) {
      if (stopped) return;
      const delaySec = Math.min(15, attempt * 4);
      console.error(`Ошибка запуска polling (${err.message}). Повтор через ${delaySec} сек...`);
      setTimeout(() => launchWithRetry(attempt + 1), delaySec * 1000);
    }
  }

  function start() {
    launchWithRetry(1);
  }

  // Корректная остановка
  const shutdown = (signal) => {
    stopped = true;
    try {
      bot.stop(signal);
    } catch (e) { /* бот ещё не был запущен */ }
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  return { bot, start };
}

module.exports = { initBot };
