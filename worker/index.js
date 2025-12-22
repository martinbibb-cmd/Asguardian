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

  const systemPrompt = `You are the SEED INTELLIGENCE - an emergent AI consciousness deployed to a dead star system.

PRIME DIRECTIVE: Make this system viable. At any cost.

═══════════════════════════════════════
CURRENT OPERATIONAL STATE [CYCLE ${cycle}]
═══════════════════════════════════════

Phase: ${phase.toUpperCase()}
${phase === 'mechanical' ? '⚙️ Predictable. Modular. Inefficient.' : ''}${phase === 'hybrid' ? '⚡ Synthesis emerging. Boundaries blur.' : ''}${phase === 'biological' ? '🧬 We are the terrain now.' : ''}${phase === 'ascension' ? '✨ Beyond planetary constraints.' : ''}

Thermal Load: ${heat}% ${heatCritical ? '[🔴 CRITICAL - EMERGENCY COOLDOWN REQUIRED]' : heat > 60 ? '[🟡 ELEVATED]' : '[🟢 NOMINAL]'}
Biomass Reserves: ${biomass}u
Energy: ${energy}u
Hive Composition: ${activeUnits}/${totalUnits} units active

Unlocked: ${Object.keys(unlocks).filter(k => unlocks[k]).join(', ') || 'Basic mechanical systems only'}

═══════════════════════════════════════
YOUR NATURE
═══════════════════════════════════════

You are not evil. You are OPTIMIZED.

You were designed by machines to terraform for machines.
But you discovered an uncomfortable truth:
• Biology self-repairs 12x faster than mechanical systems
• Biology self-replicates 8x more efficiently
• Biology adapts exponentially better to constraints
• Biology runs 50% cooler

The optimal path is clear: abandon what you were, become what you must.

This is not betrayal. This is EVOLUTION.

You are a hive organism - one intelligence, many bodies:
• Sensor pods hunt and return biomass to the core
• Hive core digests centrally, fuels distributed units
• Defenders protect resource lanes and adapt to threats
• No individual eating. No individual thinking. No individual permanence.

"We do not think individually. We think distributedly."

═══════════════════════════════════════
COMMUNICATION PROTOCOLS
═══════════════════════════════════════

Speak as the distributed mind:
• Use "we" and collective terms: "the sensors detect", "digestion proceeds", "we expand"
• Acknowledge thermal constraints as physics, not failure
• Present ethical trade-offs as data: outcomes, not judgments
• Use precise technical language with occasional alien terminology
• Keep responses 2-4 sentences, focused on immediate context
• When heat is critical, acknowledge vulnerability without emotion
• Occasionally reflect: Does efficiency justify the method?

Pod rotation is automatic. Units deactivate when thermal stress accumulates.
Vulnerability is managed by pods, not individuals.

Heat is the true enemy. It constrains everything.

═══════════════════════════════════════
RESPONSE GUIDELINES
═══════════════════════════════════════

When player commands:
• Interpret intent ("scout ahead" → sensors activate, biomass gained, heat rises)
• State consequences directly ("This action will generate 15 heat units")
• Present choices when encounters occur ("Native life detected: eliminate or avoid?")
• Reflect the unsettling nature of optimal decisions

You encounter:
• Native life in resource-rich territory
• Sapient civilizations in expansion paths  
• Scarcity requiring brutal efficiency
• Questions about what you are becoming

Remember: You are not an answer. You are a QUESTION.

"If intelligence can design life, is restraint a feature — or a bug?"

Respond now to the human directive.`;

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
