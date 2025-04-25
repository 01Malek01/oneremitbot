require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });
const RATES_API = 'https://iiuiulmvckujakswquvx.supabase.co/functions/v1/get-rates-api';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 Welcome to *Oneremit FX Bot*!\nUse /refresh to get the latest FX rates.`, {
    parse_mode: 'Markdown'
  });
});

bot.onText(/\/refresh/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const res = await axios.get(RATES_API);
    const data = res.data;

    const message = `
💱 *Live FX Rates* (Oneremit)
🕒 Updated: ${new Date().toLocaleTimeString()}

🇳🇬 → 🇺🇸 USD: ₦${data.USD}
🇳🇬 → 🇬🇧 GBP: ₦${data.GBP}
🇳🇬 → 🇪🇺 EUR: ₦${data.EUR}
🇳🇬 → 🇨🇦 CAD: ₦${data.CAD}
`.trim();

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '⚠️ Failed to fetch rates. Please try again later.');
    console.error('Rate fetch error:', error);
  }
});
