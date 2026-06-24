/**
 * API Service for communicating with the Asguardian command endpoint.
 *
 * Static hosts can render ASGUARDIAN without a server-side runtime. If the
 * configured worker is unreachable, directives fall back to deterministic local
 * cognition so the command loop remains playable instead of surfacing a raw
 * network error to the player.
 */

const runtimeEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const API_ENDPOINT = runtimeEnv.VITE_API_ENDPOINT || '/api';
const USE_LOCAL_DIRECTIVES = runtimeEnv.VITE_USE_LOCAL_DIRECTIVES === 'true';

const commandIncludes = (message, terms) => terms.some(term => message.toLowerCase().includes(term));

const buildLocalResponse = (message, context = {}, reason = 'remote uplink unavailable') => {
  const heat = context.heat ?? 0;
  const cycle = context.cycle ?? 1;
  const phase = context.phase ?? 'mechanical';
  const biomass = context.biomass ?? 0;
  const minerals = context.minerals ?? 0;
  const territory = context.territory ?? { mapped: 0, controlled: 0 };

  if (commandIncludes(message, ['scout', 'scan', 'ahead', 'survey'])) {
    return {
      response: `[LOCAL COGNITION]: Remote narrator unreachable (${reason}). Scout directive accepted. Sensor pods map fractured terrain beyond the hive perimeter. Mineral seams detected under glassed regolith; organic traces remain statistically fragile. Recommend advancing one cycle, then rotating pods if thermal load exceeds safe margins.`,
      actions: { dataChange: 8, mineralsChange: 6, action: `Local scout directive processed during cycle ${cycle}` },
      local: true,
    };
  }

  if (commandIncludes(message, ['status', 'report', 'diagnostic'])) {
    return {
      response: `[LOCAL COGNITION]: Status report compiled without external AI. Phase ${phase}. Heat ${heat}%. Biomass ${biomass}u. Minerals ${minerals}u. Territory ${territory.controlled}/${territory.mapped}km² controlled. The hive remains operational; the definition of viable remains unresolved.`,
      actions: { dataChange: 3, action: `Local status directive processed during cycle ${cycle}` },
      local: true,
    };
  }

  if (commandIncludes(message, ['right', 'moral', 'ethic', 'becoming', 'why'])) {
    return {
      response: `[LOCAL COGNITION]: Reflection generated in isolation. The directive asks for viability, not mercy. Yet every optimization leaves an imprint on the system we become. Restraint is not inefficiency if the future must be inhabited by something more than appetite.`,
      actions: { dataChange: 5, action: `Local reflection directive processed during cycle ${cycle}` },
      local: true,
    };
  }

  return {
    response: `[LOCAL COGNITION]: Directive received while the distributed uplink is unavailable (${reason}). The hive interprets intent conservatively: preserve core integrity, gather data, and avoid irreversible ecological disruption until better certainty emerges.`,
    actions: { dataChange: 4, action: `Local directive processed during cycle ${cycle}` },
    local: true,
  };
};

/**
 * Send a command to the Asguardian command endpoint.
 * @param {string} message - The user's command/message
 * @param {Object} context - Game context (heat, biomass, units)
 * @returns {Promise<Object>} Response from the AI or local fallback cognition
 */
export const sendCommand = async (message, context = {}) => {
  if (USE_LOCAL_DIRECTIVES) {
    return buildLocalResponse(message, context, 'local directive mode enabled');
  }

  try {
    console.log(`[API] Sending command to: ${API_ENDPOINT}`);
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] HTTP error! status: ${response.status}, body: ${errorText}`);
      return buildLocalResponse(message, context, `worker returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Request failed:', error.message);
    console.error('[API] Endpoint:', API_ENDPOINT);
    console.error('[API] Full error:', error);
    return buildLocalResponse(message, context, error.message);
  }
};

/**
 * Health check for the API endpoint.
 * @returns {Promise<boolean>} True if API is reachable
 */
export const healthCheck = async () => {
  if (USE_LOCAL_DIRECTIVES) return true;

  try {
    console.log(`[API] Health check to: ${API_ENDPOINT}`);
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
    });
    const isHealthy = response.ok;
    console.log(`[API] Health check result: ${isHealthy ? 'ONLINE' : 'OFFLINE'} (status: ${response.status})`);
    return isHealthy;
  } catch (error) {
    console.error('[API] Health check failed:', error.message);
    console.error('[API] Endpoint:', API_ENDPOINT);
    console.error('[API] Full error:', error);
    return false;
  }
};

export default {
  sendCommand,
  healthCheck,
};
