# Oneremit FX Telegram Bot

Responds to /start and /refresh with live FX rates using Supabase API.

## 🔧 Setup

1. Rename `.env.example` to `.env` and paste your token from BotFather.
2. Run:
   npm install
   npm start

## ☁️ Deploy on Render

1. Push to GitHub.
2. Create new Web Service on [https://render.com](https://render.com).
3. Set environment variable: `BOT_TOKEN=your_bot_token`
4. Start command: `npm start`

18/5/2025 Changes made:
• Created a separate getCostPrices file where implemented fetchCurrencyPricesInNgn function.
• fetchCurrencyPricesInNgn function uses a free API which is from open.er-api.com to fetch NGN price against other currencies.
• Created a separate refresh function and called it whenever /refresh command is called.
s
