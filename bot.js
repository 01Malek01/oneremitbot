const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Telegram Bot Token (secure this in production)
const TOKEN = '8038284856:AAEC5qbwE8XEElrWHBe9Vyk2_rf610Mo0_M';
const bot = new TelegramBot(TOKEN, { polling: true });

// Supabase FX Rate API + Authorization Header
const RATES_API = 'https://iiuiulmvckujakswquvx.supabase.co/functions/v1/get-rates-api';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdWl1bG12Y2t1amFrc3dxdXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNzExNjUsImV4cCI6MjA1OTY0NzE2NX0.jhsdvflhewouhoelhgelfihgvewoifhvgoeiuyrfgeo';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 Welcome to *Oneremit FX Bot*!\nUse /refresh to get the latest FX rates.`, {
    parse_mode: 'Markdown'
  });
});

bot.onText(/\/refresh/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const res = await axios.get(RATES_API, {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

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
