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

// Supabase Cost Prices API + Authorization Header
const COST_PRICES_API = process.env.COST_PRICES_API || 'https://iiuiulmvckujakswquvx.supabase.co/functions/v1/get-cost-prices';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdWl1bG12Y2t1amFrc3dxdXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNzExNjUsImV4cCI6MjA1OTY0NzE2NX0.DKmQ_Tjni93VDmukb56yqH8u7IPpXH805_HlpQNMoDc';

// Price cache to reduce API calls
let priceCache = {
  prices: null,
  timestamp: null
};

// Format the cost prices with commas for better readability
function formatPrice(price) {
  if (price === null || price === undefined || isNaN(parseFloat(price)) || !isFinite(price)) {
    return "Unavailable";
  }
  
  return parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Start command handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';
  
  const welcomeMessage = `
👋 Hello ${firstName}! Welcome to Oneremit FX Cost Price Bot!

*Available Commands:*
- /refresh - Get the latest FX cost prices
- /prices - Same as refresh

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
*Oneremit FX Cost Price Bot Help*

*Available Commands:*
- /start - Start the bot
- /refresh - Get the latest FX cost prices
- /prices - Same as refresh

This bot provides real-time FX cost prices from Oneremit.
`;
  
  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown'
  });
});

// Refresh & Prices command handler
bot.onText(/\/(refresh|prices)/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Show "typing..." indicator
  bot.sendChatAction(chatId, 'typing');
  
  try {
    // Get the cost prices from the edge function
    const res = await axios.get(COST_PRICES_API, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    console.log('API Response:', JSON.stringify(res.data, null, 2));
    
    const data = res.data;
    
    // Update cache
    priceCache.prices = data;
    priceCache.timestamp = Date.now();
    
    // Format prices
    const formattedUSD = formatPrice(data.USD);
    const formattedGBP = formatPrice(data.GBP);
    const formattedEUR = formatPrice(data.EUR);
    const formattedCAD = formatPrice(data.CAD);
    
    const updateTime = new Date(priceCache.timestamp).toLocaleTimeString();
    
    const message = `
💰 *FX Cost Prices* (Oneremit)
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
          [{ text: '🔄 Refresh Cost Prices', callback_data: 'refresh_prices' }]
        ]
      }
    });
  } catch (error) {
    console.error('Cost price fetch error:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data));
    }
    
    bot.sendMessage(chatId, '⚠️ Failed to fetch cost prices. Please try again later.');
  }
});

// Callback query handler for inline buttons
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  if (data === 'refresh_prices') {
    // Clear cache to force refresh
    priceCache.timestamp = null;
    
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
    const response = await axios.get(COST_PRICES_API, {
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
  res.send('Oneremit FX Cost Price Bot is running!');
});

// Health check endpoint (useful for monitoring)
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date() });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Oneremit FX Cost Price Bot is running...');
});
