// Конфигурация сервера и Telegram-бота
const config = {
  // Токен бота Telegram
  BOT_TOKEN: process.env.BOT_TOKEN || '8874934640:AAF9cFJQEwrgk97OSe5UvplJJ4hSAwyvcUI',

  // Порт сервера
  PORT: parseInt(process.env.PORT, 10) || 3000,

  // Хост для привязки
  HOST: '0.0.0.0',

  // URL WebApp (развернутого на bothost.tech)
  WEBAPP_URL: process.env.WEBAPP_URL || 'https://bot-1790112274-3936-bonzayka.bothost.tech'
};

module.exports = config;
