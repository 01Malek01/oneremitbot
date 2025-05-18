const { supabase } = require("./integrations/supabase/client.js");

exports.fetchCostPricesFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from("fx_prices")
      .select("usd_price, gbp_price, eur_price, cad_price")
      .eq("id", 1)
      .single(); // only 1 row with id = 1

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("No cost price data found");
    }
    console.log("✅ Successfully fetched cost prices from Supabase:", data);
    return {
      success: true,
      prices: {
        USD: data.usd_price,
        GBP: data.gbp_price,
        EUR: data.eur_price,
        CAD: data.cad_price,
      },
    };
  } catch (err) {
    console.error("❌ Failed to fetch cost prices from Supabase:", err.message);
    return {
      success: false,
      error: err.message,
      prices: null,
    };
  }
};
