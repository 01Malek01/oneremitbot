
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Implementation of the getCurrentCostPrices function
// This is a simplified version since we can't directly import from src/services/api.ts
let currentCostPrices: Record<string, number> = {
  USD: 0,
  EUR: 0,
  GBP: 0,
  CAD: 0
};

// This will simulate our global state
// In a real implementation, this would be stored in a database
// For demonstration purposes, we're using a global variable
// This is just for demonstration - Edge Functions are stateless
// In production, you would use a database or Redis to store this data

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // In a real implementation, we would fetch the cost prices from the database
    // For now, we'll return a mock response based on the latest calculations
    return new Response(JSON.stringify(currentCostPrices), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
