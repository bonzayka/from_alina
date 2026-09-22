// Модуль Telegram-бота для проекта "Спокойной ночи"
// Внимание: строго запрещены длинные тире (em-dash / en-dash).

const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const { WISHES } = require('./wishes-data');

function initBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Команда /start
  bot.start(async (ctx) => {
    const userName = ctx.from.first_name || 'Путник';
    const welcomeText = `🌙 Приветствую тебя, ${userName}.\n\n` +
      `Ночь спустилась на землю, укутывая все вокруг тишиной и мерцанием звезд.\n\n` +
      `Здесь ты найдешь самые нежные и согревающие пожелания спокойной ночи, ` +
      `успокаивающий процедурный эмбиент, дыхание для сна и звездный генератор открыток.\n\n` +
      `Нажми кнопку ниже, чтобы погрузиться в ночную атмосферу:`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.webApp('✨ Открыть ночной мир', config.WEBAPP_URL)
      ],
      [
        Markup.button.callback('🎲 Случайное пожелание', 'random_wish'),
        Markup.button.callback('🌿 Дыхание для сна', 'breathing_info')
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

  // Информация о дыхании
  bot.action('breathing_info', async (ctx) => {
    await ctx.answerCbQuery();
    const infoText = `🌿 *Практика сна 4-7-8*\n\n` +
      `1. Вдох носом на 4 счета.\n` +
      `2. Задержка дыхания на 7 счетов.\n` +
      `3. Плавный выдох через рот на 8 счетов.\n\n` +
      `Интерактивная сфера дыхания доступна прямо в нашем WebApp с плавной медитативной анимацией:`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.webApp('✨ Запустить в WebApp', config.WEBAPP_URL)
      ]
    ]);

    await ctx.reply(infoText, { parse_mode: 'Markdown', ...keyboard });
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
            `_Сладких и волшебных снов!_ ✨`;

          await ctx.reply(replyText, { parse_mode: 'Markdown' });
          return;
        }

        if (parsed.type === 'wish_shared') {
          const replyText = `🌙 *Пожелание ночи*\n\n` +
            `«${parsed.text}»\n\n` +
            `_Пусть эта ночь подарит самый глубокий отдых._ ✨`;

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
          text: '🌙 Ночь',
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
