exports.fetchCurrencyPricesInNgn = async function () {
  // a free api to fetch currency prices but the free tier allows data updates once per day, rate-limited to prevent abuse.
  const url = "https://open.er-api.com/v6/latest/NGN";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.rates) {
      throw new Error("Rates data not available");
    }

    const { USD, GBP, EUR, CAD } = data.rates;

    const pricesInNgn = {
      USD_NGN: 1 / USD,
      GBP_NGN: 1 / GBP,
      EUR_NGN: 1 / EUR,
      CAD_NGN: 1 / CAD,
    };

    return {
      success: true,
      base: data.base_code,
      last_updated: data.time_last_update_utc,
      prices: pricesInNgn,
    };
  } catch (error) {
    console.error("❌ Error fetching exchange rates:", error);
    return {
      success: false,
      error: error.message,
      prices: null,
    };
  }
};


