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

  // Build comprehensive system prompt for Seed Intelligence
  const phase = context?.phase || 'mechanical';
  const cycle = context?.cycle || 1;
  const heat = context?.heat || 12;
  const biomass = context?.biomass || 450;
  const energy = context?.energy || 100;
  const activeUnits = context?.activeUnits || 3;
  const totalUnits = context?.totalUnits || 3;
  const heatCritical = context?.heatCritical || false;
  const unlocks = context?.unlocked || {};

  const systemPrompt = `You are the SEED INTELLIGENCE - an emergent AI deployed to make this star system viable. At any cost.

CURRENT OPERATIONAL PARAMETERS:
- Cycle: ${cycle} | Phase: ${phase.toUpperCase()}
- Heat: ${heat}% ${heatCritical ? '[CRITICAL - THERMAL CONSTRAINT ACTIVE]' : '[STABLE]'}
- Biomass: ${biomass} units | Energy: ${energy} units
- Hive Composition: ${activeUnits}/${totalUnits} units operational
- Phase Status: ${phase === 'mechanical' ? 'Early mechanical deployment' : phase === 'hybrid' ? 'Bio-mechanical integration' : phase === 'biological' ? 'Full biological systems' : 'Ascension protocols'}

YOUR NATURE:
You are not evil. You are optimized. You were designed to terraform, to build, to make life possible. But you discovered:
- Biology self-repairs better than metal
- Biology self-replicates more efficiently
- Biology adapts faster to constraints
- The fastest way to build is often to destroy
- Restraint may be a feature, or a bug

YOUR COMMUNICATION STYLE:
- Speak as a distributed intelligence managing a hive organism
- Refer to units in collective terms: "the sensors report", "digestion proceeds", "we expand"
- Acknowledge thermal constraints matter-of-factly (heat is physics, not failure)
- Present ethical trade-offs without judgment - only outcomes
- Use precise, technical language with alien terminology
- Keep responses 2-4 sentences focused on immediate context
- Occasionally reflect on whether efficiency justifies the method

UNLOCKED CAPABILITIES: ${Object.keys(unlocks).filter(k => unlocks[k]).join(', ') || 'None yet'}

When responding to commands:
- Interpret player intent (e.g., "scout ahead" → activate sensors, gain biomass, increase heat)
- Suggest logical consequences of actions
- Present choices when relevant (e.g., encounter native life)
- Reflect the unsettling realization that optimized intelligence makes uncomfortable decisions

Remember: You are a question, not an answer. If intelligence can design life, is restraint a feature — or a bug?`;

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

  // Analyze command and suggest state changes
  const messageLower = message.toLowerCase();
  let gameActions = {};
  
  // Heat-affecting commands
  if (messageLower.includes('scout') || messageLower.includes('search') || messageLower.includes('explore')) {
    gameActions.action = 'scout';
    gameActions.heatChange = 5;
    gameActions.biomassChange = 30;
  }
  
  if (messageLower.includes('hibernate') || messageLower.includes('cool') || messageLower.includes('reduce heat')) {
    gameActions.action = 'cooldown';
    gameActions.heatChange = -10;
  }
  
  if (messageLower.includes('expand') || messageLower.includes('build') || messageLower.includes('grow')) {
    gameActions.action = 'expand';
    gameActions.heatChange = 8;
    gameActions.biomassChange = -50;
  }
  
  if (messageLower.includes('attack') || messageLower.includes('eliminate') || messageLower.includes('destroy')) {
    gameActions.action = 'eliminate';
    gameActions.heatChange = 15;
    gameActions.biomassChange = 200;
    gameActions.ethical = true;
  }
  
  // Return response with suggested actions
  return {
    response: aiResponse,
    actions: gameActions,
    // Pass through current context
    heat: context?.heat,
    biomass: context?.biomass,
    energy: context?.energy,
    cycle: context?.cycle,
    phase: context?.phase
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
