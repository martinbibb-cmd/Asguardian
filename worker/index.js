/**
 * SEED / HIVE / ASCENSION - AI Worker
 * 
 * Cloudflare Worker for the Seed Intelligence narrative engine.
 * Integrates with the Daedalus LLM Gateway as the emergent narrator.
 * 
 * "The LLM decorates. The logic decides."
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    if (request.method === 'GET' && url.pathname === '/api/llm-health') {
      return handleLlmHealth(env);
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
        console.log('Asguardian command request received');
        const body = await request.json();
        console.log('Asguardian command request body parsed', {
          hasMessage: typeof body?.message === 'string',
          hasPrompt: typeof body?.prompt === 'string',
          hasContext: Boolean(body?.context && typeof body.context === 'object'),
        });
        const { message, context } = normaliseCommandBody(body);

        if (!message) {
          console.warn('Asguardian command rejected: missing message or prompt');
          return jsonResponse({ error: 'Message or prompt is required' }, 400);
        }

        // Call Daedalus LLM Gateway
        const gatewayResponse = await callDaedalusGateway(message, context, env);

        return jsonResponse(gatewayResponse);
      } catch (error) {
        console.error('Asguardian command fallback error:', error.message);
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
 * Call Daedalus LLM Gateway with comprehensive Seed Intelligence context.
 */
async function callDaedalusGateway(message, context, env) {
  const gatewayBaseUrl = trimTrailingSlash(env.DAEDALUS_LLM_BASE_URL || '');
  const gatewayApiKey = env.DAEDALUS_LLM_API_KEY;
  const gatewayModel = env.DAEDALUS_LLM_MODEL;

  if (!gatewayBaseUrl) {
    throw new Error('DAEDALUS_LLM_BASE_URL not configured');
  }

  if (!gatewayApiKey) {
    throw new Error('DAEDALUS_LLM_API_KEY not configured');
  }

  if (!gatewayModel) {
    throw new Error('DAEDALUS_LLM_MODEL not configured');
  }

  console.log('Using Daedalus LLM Gateway');
  console.log('Selected Daedalus LLM model:', gatewayModel);
  console.log('Daedalus LLM Gateway URL:', gatewayBaseUrl);

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

  const gatewayRequestBody = {
    model: gatewayModel,
    prompt: `${systemPrompt}\n\nUSER DIRECTIVE: ${message}`,
    schema: {
      response: 'string',
    },
    temperature: 0.85,
    max_tokens: 250,
    top_p: 0.9,
  };

  console.log('Daedalus LLM Gateway request body prepared', {
    model: gatewayModel,
    hasPrompt: true,
    promptLength: gatewayRequestBody.prompt.length,
    hasSchema: true,
    temperature: gatewayRequestBody.temperature,
    max_tokens: gatewayRequestBody.max_tokens,
    top_p: gatewayRequestBody.top_p,
  });

  const response = await fetch(`${gatewayBaseUrl}/v1/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-daedalus-api-key': gatewayApiKey,
    },
    body: JSON.stringify(gatewayRequestBody)
  });

  console.log('Daedalus LLM Gateway response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Daedalus LLM Gateway error: ${response.status} - ${error}`);
  }

  const responseData = await response.json();
  console.log('Daedalus LLM Gateway response shape:', describeGatewayResponseShape(responseData));
  const aiResponse = extractGatewayText(responseData);
  console.log('Daedalus LLM Gateway extracted text:', {
    found: Boolean(aiResponse),
    length: aiResponse?.length || 0,
  });

  if (!aiResponse) {
    throw new Error('Daedalus LLM Gateway returned no extractable response text');
  }

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

function normaliseCommandBody(body) {
  const message = typeof body?.message === 'string' && body.message.trim()
    ? body.message.trim()
    : typeof body?.prompt === 'string' && body.prompt.trim()
      ? body.prompt.trim()
      : '';

  return {
    message,
    context: body?.context,
  };
}

async function handleLlmHealth(env) {
  const gatewayBaseUrl = trimTrailingSlash(env.DAEDALUS_LLM_BASE_URL || '');
  const gatewayApiKey = env.DAEDALUS_LLM_API_KEY;
  const gatewayModel = env.DAEDALUS_LLM_MODEL;
  const missing = getMissingDaedalusConfig({ gatewayBaseUrl, gatewayApiKey, gatewayModel });

  if (missing.length > 0) {
    return jsonResponse({
      ok: false,
      configured: false,
      missing,
    });
  }

  try {
    const response = await fetch(`${gatewayBaseUrl}/v1/self-test`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-daedalus-api-key': gatewayApiKey,
      },
    });

    return jsonResponse({
      ok: response.ok,
      configured: true,
      baseUrl: gatewayBaseUrl,
      model: gatewayModel,
      gatewayReachable: response.ok,
      gatewaySelfTest: response.ok,
    });
  } catch (error) {
    console.error('Daedalus LLM Gateway health check failed:', error.message);
    return jsonResponse({
      ok: false,
      configured: true,
      baseUrl: gatewayBaseUrl,
      model: gatewayModel,
      gatewayReachable: false,
      gatewaySelfTest: false,
    });
  }
}

function getMissingDaedalusConfig({ gatewayBaseUrl, gatewayApiKey, gatewayModel }) {
  const missing = [];
  if (!gatewayBaseUrl) missing.push('DAEDALUS_LLM_BASE_URL');
  if (!gatewayApiKey) missing.push('DAEDALUS_LLM_API_KEY');
  if (!gatewayModel) missing.push('DAEDALUS_LLM_MODEL');
  return missing;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function extractGatewayText(responseData) {
  if (!responseData || typeof responseData !== 'object') return undefined;

  const jsonText = extractTextFromValue(responseData.json);
  const rawText = extractTextFromValue(responseData.raw);
  const dataText = extractTextFromValue(responseData.data);
  const candidates = [
    responseData.response,
    responseData.text,
    responseData.output,
    responseData.content,
    responseData.message,
    responseData.result,
    responseData.summary,
    responseData.answer,
    jsonText,
    rawText,
    dataText,
    responseData.json?.response,
    responseData.json?.text,
    responseData.json?.message,
    responseData.json?.content,
    responseData.json?.result,
    responseData.json?.summary,
    responseData.json?.answer,
    responseData.data?.response,
    responseData.data?.text,
    responseData.data?.message,
    responseData.data?.content,
    responseData.data?.result,
    responseData.data?.summary,
    responseData.data?.answer,
    responseData.choices?.[0]?.message?.content,
  ];
  return candidates.find(candidate => typeof candidate === 'string' && candidate.trim())?.trim();
}

function extractTextFromValue(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'string' ? parsed.trim() : extractTextFromValue(parsed);
    } catch {
      return trimmed;
    }
  }

  if (!value || typeof value !== 'object') return undefined;

  const candidates = [
    value.response,
    value.text,
    value.message,
    value.content,
    value.result,
    value.summary,
    value.answer,
  ];

  return candidates.find(candidate => typeof candidate === 'string' && candidate.trim())?.trim();
}

function describeGatewayResponseShape(responseData) {
  if (!responseData || typeof responseData !== 'object') {
    return { type: typeof responseData };
  }

  return {
    keys: Object.keys(responseData),
    jsonType: typeof responseData.json,
    jsonKeys: responseData.json && typeof responseData.json === 'object' ? Object.keys(responseData.json) : [],
    rawType: typeof responseData.raw,
    hasChoices: Array.isArray(responseData.choices),
    dataKeys: responseData.data && typeof responseData.data === 'object' ? Object.keys(responseData.data) : [],
  };
}
