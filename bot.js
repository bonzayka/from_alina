// Модуль Telegram-бота
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const { WISHES } = require('./wishes-data');

function initBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  bot.catch((err, ctx) => {
    console.error(`Ошибка Telegraf (${ctx ? ctx.updateType : 'unknown'}):`, err.message);
  });

  // Команда /start
  bot.start(async (ctx) => {
    const welcomeText = `☀️ Доброе утро, солнышко!\n\n` +
      `Сделал для тебя страничку на утро - там немного картинок для настроения и спокойная музыка.\n\n` +
      `Просыпайся потихоньку, хорошего тебе дня! 💛`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.webApp('☀️ Открыть', config.WEBAPP_URL)
      ]
    ]);

    await ctx.reply(welcomeText, keyboard);
  });

  bot.action('random_wish', async (ctx) => {
    await ctx.answerCbQuery();
    const randomIndex = Math.floor(Math.random() * WISHES.length);
    const wish = WISHES[randomIndex];

    const messageText = `☀️ *${wish.title}*\n\n${wish.text}`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Ещё', 'random_wish')
      ],
      [
        Markup.button.webApp('☀️ Открыть страницу', config.WEBAPP_URL)
      ]
    ]);

    await ctx.reply(messageText, { parse_mode: 'Markdown', ...keyboard });
  });

  // Установка кнопки меню WebApp
  async function configureMenuButton() {
    try {
      await bot.telegram.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '☀️ Доброе утро',
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
