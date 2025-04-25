// Replace your /refresh and /rates handler with this updated one
bot.onText(/\/(refresh|rates)/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, 'typing');

  try {
    const response = await axios.get('https://iiuiulmvckujakswquvx.supabase.co/rest/v1/cost_prices', {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdWl1bG12Y2t1amFrc3dxdXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNzExNjUsImV4cCI6MjA1OTY0NzE2NX0.DKmQ_Tjni93VDmukb56yqH8u7IPpXH805_HlpQNMoDc}`
      },
      params: {
        select: 'currency_code,price,updated_at'
      }
    });

    const costPrices = response.data;
    const format = (val) => parseFloat(val).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    const map = Object.fromEntries(
      costPrices.map(row => [row.currency_code.toUpperCase(), format(row.price)])
    );

    const timestamp = costPrices[0]?.updated_at
      ? new Date(costPrices[0].updated_at).toLocaleTimeString()
      : new Date().toLocaleTimeString();

    const message = `
💱 *Live FX Rates* (Oneremit)
🕒 Updated: ${timestamp}

🇳🇬 → 🇺🇸 USD: ₦${map.USD}
🇳🇬 → 🇬🇧 GBP: ₦${map.GBP}
🇳🇬 → 🇪🇺 EUR: ₦${map.EUR}
🇳🇬 → 🇨🇦 CAD: ₦${map.CAD}
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
    console.error('Error fetching cost prices:', error.message);
    bot.sendMessage(chatId, '⚠️ Failed to load live FX cost prices.');
  }
});
