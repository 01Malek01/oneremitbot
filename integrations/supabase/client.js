// This file is automatically generated. Do not edit it directly.
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://iiuiulmvckujakswquvx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdWl1bG12Y2t1amFrc3dxdXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNzExNjUsImV4cCI6MjA1OTY0NzE2NX0.DKmQ_Tjni93VDmukb56yqH8u7IPpXH805_HlpQNMoDc";

// Import the supabase client like this:
// const { supabase } = require("./path/to/client");

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

// For legacy code compatibility, also export as supabaseClient
const supabaseClient = supabase;

module.exports = {
  supabase,
  supabaseClient,
};
