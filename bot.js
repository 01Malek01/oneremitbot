const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

// Create Express server - required for Render deployment
const app = express();
const PORT = process.env.PORT || 3000;

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
  if (rate === null || rate === undefined || isNaN(parseFloat(rate)) || !isFinite(rate)) {
    return "Unavailable";
  }
  
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
    // Use the simple format for cleaner data
    const url = `${RATES_API}?format=simple`;
    
    // FIXED: Proper Supabase authorization header format
    const res = await axios.get(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    console.log('API Response:', JSON.stringify(res.data, null, 2));
    
    const data = res.data;
    
    // Update cache
    rateCache.rates = data;
    rateCache.timestamp = Date.now();
    
    // Extract rates from response - handle different possible API structures
    let usdRate, gbpRate, eurRate, cadRate;
    
    // For simple format (direct key-value)
    if (typeof data === 'object' && data !== null) {
      usdRate = data.USD || data.usd;
      gbpRate = data.GBP || data.gbp;
      eurRate = data.EUR || data.eur;
      cadRate = data.CAD || data.cad;
    }
    
    // For more complex format (rates might be nested)
    if (!usdRate && data.rates) {
      usdRate = data.rates.USD || data.rates.usd;
      gbpRate = data.rates.GBP || data.rates.gbp;
      eurRate = data.rates.EUR || data.rates.eur;
      cadRate = data.rates.CAD || data.rates.cad;
    }
    
    // Format with fallbacks
    const formattedUSD = formatRate(usdRate);
    const formattedGBP = formatRate(gbpRate);
    const formattedEUR = formatRate(eurRate);
    const formattedCAD = formatRate(cadRate);
    
    const updateTime = new Date(rateCache.timestamp).toLocaleTimeString();
    
    const message = `
💱 *Live FX Rates* (Oneremit)
🕒 Updated: ${updateTime}

🇳🇬 → 🇺🇸 USD: ₦${formattedUSD}
🇳🇬 → 🇬🇧 GBP: ₦${formattedGBP}
🇳🇬 → 🇪🇺 EUR: ₦${formattedEUR}
🇳🇬 → 🇨🇦 CAD: ₦${formattedCAD}
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
    console.error('Rate fetch error:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data));
    }
    
    bot.sendMessage(chatId, '⚠️ Failed to fetch rates. Please try again later.');
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

// Debug endpoint to test API connection
app.get('/debug/test-api', async (req, res) => {
  try {
    const response = await axios.get(`${RATES_API}?format=simple`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    res.json({
      success: true,
      data: response.data,
      status: response.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
});

// Add routes for the web server
app.get('/', (req, res) => {
  res.send('Oneremit FX Bot is running!');
});

// Health check endpoint (useful for monitoring)
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date() });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Oneremit FX Bot is running...');
});
