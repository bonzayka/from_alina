// Модуль Telegram-бота для проекта "Спокойной ночи, котеночек мой любимый!"
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const { WISHES } = require('./wishes-data');

function initBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Команда /start
  bot.start(async (ctx) => {
    const welcomeText = `🌙 Привет, котеночек мой любимый!\n\n` +
      `Я создал для тебя этот сказочный ночной уголок, чтобы ты сладко засыпала, окутанная моим теплом, заботой и любовью.\n\n` +
      `Открывай скорее, самых волшебных снов тебе, радость моя! ✨🐱`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.webApp('🌙 Открыть ночное послание', config.WEBAPP_URL)
      ]
    ]);

    await ctx.reply(welcomeText, keyboard);
  });

  // Обработка кнопки случайного пожелания
  bot.action('random_wish', async (ctx) => {
    await ctx.answerCbQuery();
    const randomIndex = Math.floor(Math.random() * WISHES.length);
    const wish = WISHES[randomIndex];

    const messageText = `🌙 *${wish.title}*\n\n` +
      `«${wish.text}»\n\n` +
      `_Автор: ${wish.author}_`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔄 Еще одно пожелание', 'random_wish')
      ],
      [
        Markup.button.webApp('✨ Открыть в WebApp', config.WEBAPP_URL)
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
          const replyText = `💌 *Получено персональное пожелание для: ${parsed.recipient}*\n\n` +
            `«${parsed.text}»\n\n` +
            `_Сладких и уютных снов!_ ✨`;

          await ctx.reply(replyText, { parse_mode: 'Markdown' });
          return;
        }

        if (parsed.type === 'wish_shared') {
          const replyText = `🌙 *Ночное пожелание*\n\n` +
            `«${parsed.text}»\n\n` +
            `_Пусть эта ночь подарит тебе самый сладкий отдых!_ 💤`;

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
          text: '🌙 Спокойной ночи',
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

  // Запуск бота с обработкой ошибок
  async function start() {
    try {
      await configureMenuButton();
      bot.launch({
        dropPendingUpdates: true
      });
      console.log('Telegram-бот успешно запущен в режиме polling');
    } catch (err) {
      console.error('Ошибка при запуске Telegram-бота:', err.message);
    }
  }

  // Корректная остановка
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return { bot, start };
}

module.exports = { initBot };
