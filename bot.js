const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
require("dotenv").config();
const getCostPricesForNGN = require("./getFxRates").fetchCostPricesFromSupabase;

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  "8038284856:AAEC5qbwE8XEElrWHBe9Vyk2_rf610Mo0_M";
const bot = new TelegramBot(TOKEN, { polling: true });

// Price cache to reduce API calls
let priceCache = {
  prices: null,
  timestamp: null,
  cacheLifetime: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Format prices
function formatPrice(price) {
  if (
    price === null ||
    price === undefined ||
    isNaN(parseFloat(price)) ||
    !isFinite(price)
  ) {
    return "Unavailable";
  }

  return parseFloat(price).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Cache validity check
function isCacheValid() {
  return (
    priceCache.timestamp &&
    priceCache.prices &&
    Date.now() - priceCache.timestamp < priceCache.cacheLifetime
  );
}

// Fetch NGN prices for USD, GBP, EUR, CAD
async function fetchCostPrices() {
  if (isCacheValid()) {
    console.log("✅ Using cached cost prices");
    return priceCache.prices;
  }

  console.log("📡 Fetching fresh cost prices from API...");
  const res = await getCostPricesForNGN();

  if (!res.success) throw new Error(res.error || "Unknown API error");

  // Use keys exactly as returned from Supabase function
  const prices = {
    USD: res.prices.USD,
    GBP: res.prices.GBP,
    EUR: res.prices.EUR,
    CAD: res.prices.CAD,
  };

  priceCache.prices = prices;
  priceCache.timestamp = Date.now();

  return prices;
}

// Send prices message
async function sendPrices(chatId) {
  bot.sendChatAction(chatId, "typing");

  try {
    const data = await fetchCostPrices();

    const formattedUSD = formatPrice(data.USD);
    const formattedGBP = formatPrice(data.GBP);
    const formattedEUR = formatPrice(data.EUR);
    const formattedCAD = formatPrice(data.CAD);

    const updateTime = new Date(priceCache.timestamp).toLocaleTimeString();

    const message = `
💰 *FX Cost Prices in NGN*
🕒 Updated: ${updateTime}

🇺🇸 USD: 🇳🇬 ${formattedUSD}
🇬🇧 GBP: 🇳🇬 ${formattedGBP}
🇪🇺 EUR: 🇳🇬 ${formattedEUR}
🇨🇦 CAD: 🇳🇬 ${formattedCAD}
`.trim();

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 Refresh Cost Prices", callback_data: "refresh_prices" }],
        ],
      },
    });
  } catch (error) {
    console.error("❌ Cost price fetch error:", error.message);
    bot.sendMessage(
      chatId,
      "⚠️ Failed to fetch cost prices. Please try again later."
    );
  }
}

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "there";

  const welcomeMessage = `
👋 Hello ${firstName}! Welcome to Oneremit FX Cost Price Bot!

*Available Commands:*
- /refresh - Get the latest FX cost prices
- /prices - Same as refresh

Need help? Just type /help
`;

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: "Markdown",
  });
});

// /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
*Oneremit FX Cost Price Bot Help*

*Available Commands:*
- /start - Start the bot
- /refresh - Get the latest FX cost prices
- /prices - Same as refresh

This bot provides real-time FX cost prices in NGN.
`;

  bot.sendMessage(chatId, helpMessage, {
    parse_mode: "Markdown",
  });
});

// /refresh and /prices
bot.onText(/\/(refresh|prices)/, async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/refresh") {
    priceCache.timestamp = null; // Invalidate cache
  }

  await sendPrices(chatId);
});

// Inline button refresh
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === "refresh_prices") {
    priceCache.timestamp = null; // Invalidate cache
    await sendPrices(chatId);
    await bot.answerCallbackQuery(callbackQuery.id);
  }
});

// Polling error
bot.on("polling_error", (error) => {
  console.error("Polling error:", error.message);
});

// Debug API test
app.get("/debug/test-api", async (req, res) => {
  try {
    priceCache.timestamp = null;
    const data = await fetchCostPrices();

    res.json({
      success: true,
      data,
      cacheInfo: {
        timestamp: priceCache.timestamp,
        isValid: isCacheValid(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("Oneremit FX Cost Price Bot is running!");
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).send({
    status: "ok",
    timestamp: new Date(),
    cacheStatus: {
      exists: !!priceCache.prices,
      lastUpdated: priceCache.timestamp
        ? new Date(priceCache.timestamp).toISOString()
        : null,
      isValid: isCacheValid(),
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("🤖 Oneremit FX Cost Price Bot is live!");
});
