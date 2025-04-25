const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config(); // For environment variables

// Telegram Bot Token (from environment variable)
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8038284856:AAEC5qbwE8XEElrWHBe9Vyk2_rf610Mo0_M';
const bot = new TelegramBot(TOKEN, { polling: true });

// Supabase FX Rate API + Authorization Header
const RATES_API = process.env.RATES_API || 'https://iiuiulmvckujakswquvx.supabase.co/functions/v1/get-rates-api';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdWl1bG12Y2t1amFrc3dxdXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNzExNjUsImV4cCI6MjA1OTY0NzE2NX0.DKmQ_Tjni93VDmukb56yqH8u7IPpXH805_HlpQNMoDc';

// Rate cache to reduce API calls
let rateCache = {
  rates: null,
  timestamp: null
};

// Format the rates with commas for better readability
function formatRate(rate) {
  return parseFloat(rate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Start command handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';
  
  const welcomeMessage = `
👋 Hello ${firstName}! Welcome to Oneremit FX Bot!

*Available Commands:*
• /refresh - Get the latest FX rates
• /rates - Same as refresh

Need help? Just type /help
`;
  
  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown'
  });
});

// Help command handler
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
*Oneremit FX Bot Help*

*Available Commands:*
• /start - Start the bot
• /refresh - Get the latest FX rates
• /rates - Same as refresh

This bot provides real-time FX rates from Oneremit.
`;
  
  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown'
  });
});

// Refresh & Rates command handler
bot.onText(/\/(refresh|rates)/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Show "typing..." indicator
  bot.sendChatAction(chatId, 'typing');
  
  try {
    // Check if we have a recent cache (less than 5 minutes old)
    const now = Date.now();
    const cacheAge = now - (rateCache.timestamp || 0);
    const cacheExpired = !rateCache.rates || cacheAge > 5 * 60 * 1000;
    
    if (cacheExpired) {
      const res = await axios.get(RATES_API, {
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
      
      rateCache.rates = res.data;
      rateCache.timestamp = now;
    }
    
    const data = rateCache.rates;
    const updateTime = new Date(rateCache.timestamp).toLocaleTimeString();
    
    const message = `
💱 *Live FX Rates* (Oneremit)
🕒 Updated: ${updateTime}

🇳🇬 → 🇺🇸 USD: ₦${formatRate(data.USD)}
🇳🇬 → 🇬🇧 GBP: ₦${formatRate(data.GBP)}
🇳🇬 → 🇪🇺 EUR: ₦${formatRate(data.EUR)}
🇳🇬 → 🇨🇦 CAD: ₦${formatRate(data.CAD)}
`.trim();

    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Refresh Rates', callback_data: 'refresh_rates' }]
        ]
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, '⚠️ Failed to fetch rates. Please try again later.');
    console.error('Rate fetch error:', error.message);
  }
});

// Callback query handler for inline buttons
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  if (data === 'refresh_rates') {
    // Clear cache to force refresh
    rateCache.timestamp = null;
    
    // Trigger the refresh command
    bot.emit('text', {
      chat: { id: chatId },
      text: '/refresh',
      from: callbackQuery.from
    });
    
    // Answer callback to remove loading state
    bot.answerCallbackQuery(callbackQuery.id);
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('Oneremit FX Bot is running...');
