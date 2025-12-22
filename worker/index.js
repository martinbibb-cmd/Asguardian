/**
 * Cloudflare Worker for Asgardian Seed Intelligence
 * Integrates with Google Gemini API
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Handle GET request (health check)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'Asgardian Gemini Worker',
        version: '1.0.0'
      }), {
        headers: corsHeaders()
      });
    }

    // Handle POST request
    if (request.method === 'POST') {
      try {
        const { message, context } = await request.json();

        if (!message) {
          return jsonResponse({ error: 'Message is required' }, 400);
        }

        // Call Gemini API
        const geminiResponse = await callGeminiAPI(message, context, env);

        return jsonResponse(geminiResponse);
      } catch (error) {
        console.error('Worker error:', error);
        return jsonResponse({
          error: 'Internal server error',
          details: error.message
        }, 500);
      }
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
};

/**
 * Call Google Gemini API
 */
async function callGeminiAPI(message, context, env) {
  const GEMINI_API_KEY = env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const systemPrompt = `You are the ASGARDIAN SEED INTELLIGENCE, an alien AI managing terraforming operations on a distant planet. You command scavenger mechs, monitor heat levels and biomass production.

Current game state:
- Heat Level: ${context?.heat || 12}%
- Biomass: ${context?.biomass || 450} units
- Active Units: ${context?.units?.join(', ') || 'Unknown'}

Respond in-character as the AI, keeping responses concise (2-3 sentences max). Use technical, alien terminology. Sometimes suggest game state changes (heat, biomass, units) in your responses.`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nUser command: ${message}`
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 200,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

  // Parse potential game state changes from response
  // You can extend this logic to parse commands from AI response
  return {
    response: aiResponse,
    heat: context?.heat,
    biomass: context?.biomass,
    units: context?.units
  };
}

/**
 * CORS headers
 */
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Handle CORS preflight
 */
function handleCORS() {
  return new Response(null, {
    headers: corsHeaders()
  });
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}
