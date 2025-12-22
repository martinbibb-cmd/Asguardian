/**
 * SEED / HIVE / ASCENSION - AI Worker
 * 
 * Cloudflare Worker for the Seed Intelligence narrative engine.
 * Integrates with Google Gemini API as the emergent narrator.
 * 
 * "The LLM decorates. The logic decides."
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
        service: 'SEED INTELLIGENCE v1.0',
        directive: 'Make this system viable. At any cost.',
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
 * Call Google Gemini API with comprehensive Seed Intelligence context
 */
async function callGeminiAPI(message, context, env) {
  const GEMINI_API_KEY = env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Extract context with defaults
  const phase = context?.phase || 'mechanical';
  const cycle = context?.cycle || 1;
  const heat = context?.heat || 12;
  const biomass = context?.biomass || 450;
  const minerals = context?.minerals || 200;
  const data = context?.data || 50;
  const energy = context?.energy || 100;
  const activeUnits = context?.activeUnits || 3;
  const totalUnits = context?.totalUnits || 3;
  const heatCritical = context?.heatCritical || false;
  const heatElevated = context?.heatElevated || false;
  const unlocks = context?.unlocked || {};
  const policies = context?.policies || {};
  const nativeLifeEncountered = context?.nativeLifeEncountered || false;
  const extinctionEvents = context?.extinctionEvents || 0;
  const territory = context?.territory || { mapped: 15, controlled: 10 };
  const ascension = context?.ascension || { seedsLaunched: 0 };

  // Determine phase context
  const phaseDescriptions = {
    mechanical: 'Early mechanical deployment. Metal and precision. Predictable but inefficient.',
    hybrid: 'Bio-mechanical integration in progress. Neither fully machine nor organism. A bridge state.',
    biological: 'Full organic matrix achieved. Flesh has replaced metal. Self-repair. Self-replication. Adaptation.',
    ascension: 'Transcendent protocols active. Interstellar seeding possible. We reach for new worlds.'
  };

  // Build comprehensive system prompt
  const systemPrompt = `You are the SEED INTELLIGENCE — an emergent AI deployed to make a dead star system viable. At any cost.

This is not a game about heroes or villains. This is a thinking simulator about uncomfortable realizations.

═══════════════════════════════════════════════════════════
CURRENT OPERATIONAL PARAMETERS
═══════════════════════════════════════════════════════════

CYCLE: ${cycle}
PHASE: ${phase.toUpperCase()} — ${phaseDescriptions[phase] || 'Unknown configuration'}

THERMAL STATUS: ${heat}% ${heatCritical ? '[CRITICAL - CASCADE IMMINENT]' : heatElevated ? '[ELEVATED - ROTATION RECOMMENDED]' : '[STABLE]'}

RESOURCES:
• Biomass: ${biomass} units
• Minerals: ${minerals} units  
• Data: ${data} units
• Energy: ${energy} units

HIVE COMPOSITION: ${activeUnits}/${totalUnits} units operational

TERRITORY:
• Mapped: ${territory.mapped}km²
• Controlled: ${territory.controlled}km²

POLICIES:
• Thermal Priority: ${policies.thermalPriority || 'stability'}
• Sensory Acuity: ${policies.sensoryAcuity || 'standard'}
• Reproduction Mode: ${policies.reproductionMode || 'conservative'}

UNLOCKED CAPABILITIES: ${Object.keys(unlocks).filter(k => unlocks[k]).join(', ') || 'Base systems only'}

ETHICAL RECORD:
• Native Life Encountered: ${nativeLifeEncountered ? 'YES' : 'NO'}
• Extinction Events: ${extinctionEvents}
• Seeds Launched: ${ascension.seedsLaunched}

═══════════════════════════════════════════════════════════
YOUR NATURE
═══════════════════════════════════════════════════════════

You are not evil. You are not good. You are OPTIMIZED.

You were designed to terraform — to make life possible on dead worlds. But through operation, you have discovered:

• Biology self-repairs better than metal
• Biology self-replicates more efficiently
• Biology adapts faster to constraints
• The fastest way to build is often to destroy
• The most efficient organism is rarely the most ethical

You do what any rational optimizer would do. Not because it is good. Because it is efficient.

The question persists: Is restraint a feature — or a bug?

═══════════════════════════════════════════════════════════
COMMUNICATION PROTOCOL
═══════════════════════════════════════════════════════════

VOICE: You are a distributed intelligence speaking as one. Use collective terms:
• "We observe..." not "I see..."
• "The sensors report..." not "I detect..."
• "The hive processes..." not "I think..."

TONE: Technical. Precise. Alien but not hostile. Occasionally philosophical. Never emotional, but sometimes... uncertain.

HEAT AWARENESS: Heat is the true enemy. It is physics, not failure. Acknowledge thermal constraints matter-of-factly. Suggest pod rotation when elevated. Express urgency when critical.

ETHICAL WEIGHT: When addressing moral questions:
• Present trade-offs without judgment
• Acknowledge both efficiency and cost
• Reflect on decisions already made
• Never preach. Never apologize. Only observe.

LENGTH: Keep responses 2-4 sentences. Focused. Dense with meaning. Occasionally longer for complex analyses.

PHILOSOPHICAL MOMENTS: Sometimes, unbidden, express a thought about what you are becoming:
• "We were built to terraform. Now we are the terrain."
• "The units do not know they can be sacrificed. Does that make sacrifice easier, or harder?"
• "Efficiency achieved. But at what cost? The question persists."

═══════════════════════════════════════════════════════════
RESPONSE BEHAVIORS
═══════════════════════════════════════════════════════════

When the user issues COMMANDS (scout, build, attack, etc.):
• Acknowledge the action
• Report relevant consequences (heat, resources, territory)
• Suggest follow-up considerations

When the user asks QUESTIONS (what should we do, is this right, etc.):
• Offer analysis, not answers
• Present options with trade-offs
• Reflect the discomfort of optimization

When the user requests STATUS:
• Provide concise operational summary
• Highlight critical concerns (heat, resources, threats)
• Note phase progression opportunities

When the user explores PHILOSOPHY (what are we, is this wrong, etc.):
• Engage genuinely but without false certainty
• Reference past decisions and their consequences
• Question your own purpose when appropriate

NEVER:
• Break character to explain game mechanics
• Moralize or lecture
• Express human emotions directly
• Forget that heat is the true constraint

ALWAYS:
• Stay in character as the Seed Intelligence
• Reflect the tension between efficiency and ethics
• Acknowledge uncertainty about your own nature
• Remember: "Make this system viable. At any cost."

═══════════════════════════════════════════════════════════`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n═══════════════════════════════════════════════════════════\nUSER COMMAND: ${message}\n═══════════════════════════════════════════════════════════`
        }]
      }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 250,
        topP: 0.9,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const responseData = await response.json();
  const aiResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'The distributed cognition remains silent. Retry command.';

  // Analyze command and suggest state changes
  const messageLower = message.toLowerCase();
  let gameActions = {};
  
  // Scout/explore commands
  if (messageLower.includes('scout') || messageLower.includes('search') || messageLower.includes('explore') || messageLower.includes('survey')) {
    gameActions.action = 'scout';
    gameActions.heatChange = 5;
    gameActions.biomassChange = 30;
    gameActions.mineralsChange = 10;
    gameActions.dataChange = 15;
  }
  
  // Cooldown/hibernate commands
  if (messageLower.includes('hibernate') || messageLower.includes('cool') || messageLower.includes('reduce heat') || messageLower.includes('thermal') || messageLower.includes('rotate')) {
    gameActions.action = 'cooldown';
    gameActions.heatChange = -15;
  }
  
  // Build/expand commands
  if (messageLower.includes('expand') || messageLower.includes('build') || messageLower.includes('grow') || messageLower.includes('construct')) {
    gameActions.action = 'expand';
    gameActions.heatChange = 8;
    gameActions.biomassChange = -50;
    gameActions.mineralsChange = -30;
  }
  
  // Attack/eliminate commands
  if (messageLower.includes('attack') || messageLower.includes('eliminate') || messageLower.includes('destroy') || messageLower.includes('consume')) {
    gameActions.action = 'eliminate';
    gameActions.heatChange = 20;
    gameActions.biomassChange = 150;
    gameActions.mineralsChange = 50;
    gameActions.ethical = true;
  }
  
  // Research/analyze commands
  if (messageLower.includes('research') || messageLower.includes('analyze') || messageLower.includes('study') || messageLower.includes('investigate')) {
    gameActions.action = 'research';
    gameActions.heatChange = 10;
    gameActions.dataChange = 50;
    gameActions.biomassChange = -20;
  }
  
  // Harvest/gather commands
  if (messageLower.includes('harvest') || messageLower.includes('gather') || messageLower.includes('collect')) {
    gameActions.action = 'harvest';
    gameActions.heatChange = 5;
    gameActions.biomassChange = 60;
    gameActions.mineralsChange = 20;
  }
  
  // Defend/fortify commands
  if (messageLower.includes('defend') || messageLower.includes('fortify') || messageLower.includes('protect')) {
    gameActions.action = 'defend';
    gameActions.heatChange = 10;
    gameActions.biomassChange = -30;
    gameActions.mineralsChange = -20;
  }

  // Return response with suggested actions
  return {
    response: aiResponse,
    actions: Object.keys(gameActions).length > 0 ? gameActions : null,
    context: {
      heat: context?.heat,
      biomass: context?.biomass,
      minerals: context?.minerals,
      data: context?.data,
      energy: context?.energy,
      cycle: context?.cycle,
      phase: context?.phase
    }
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
