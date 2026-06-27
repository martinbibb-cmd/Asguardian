/**
 * API service for the Asguardian command endpoint.
 *
 * Production failures are returned as visible "LLM unavailable" errors. The
 * deterministic local response path is preserved only for explicit local mode.
 */

const runtimeEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const API_ENDPOINT = runtimeEnv.VITE_API_ENDPOINT || runtimeEnv.VITE_API_URL || '/api';
const USE_LOCAL_DIRECTIVES = runtimeEnv.VITE_USE_LOCAL_DIRECTIVES === 'true';

let lastApiStatus = {
  endpoint: API_ENDPOINT,
  healthEndpoint: null,
  lastStatus: null,
  lastError: null,
  lastChecked: null,
};

const getLocationOrigin = () => {
  try {
    return globalThis.location?.origin || '';
  } catch {
    return '';
  }
};

const getHealthEndpoint = (endpoint = API_ENDPOINT) => {
  if (!endpoint || endpoint === '/api') return '/api/llm-health';

  try {
    const origin = getLocationOrigin() || 'https://asguardian.local';
    const url = new URL(endpoint, origin);
    if (url.pathname.endsWith('/api')) {
      url.pathname = url.pathname.replace(/\/api$/, '/api/llm-health');
    } else {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/llm-health`;
    }
    return url.origin === getLocationOrigin() ? `${url.pathname}${url.search}` : url.toString();
  } catch {
    return '/api/llm-health';
  }
};

const updateLastStatus = (patch) => {
  lastApiStatus = {
    ...lastApiStatus,
    healthEndpoint: getHealthEndpoint(),
    lastChecked: new Date().toISOString(),
    ...patch,
  };
  return lastApiStatus;
};

export const getApiDiagnosticsConfig = () => ({
  endpoint: API_ENDPOINT,
  healthEndpoint: getHealthEndpoint(),
  usingLocalDirectives: USE_LOCAL_DIRECTIVES,
});

export const getLastApiStatus = () => ({ ...lastApiStatus, healthEndpoint: getHealthEndpoint() });

const commandIncludes = (message, terms) => terms.some(term => message.toLowerCase().includes(term));

const buildLocalResponse = (message, context = {}, reason = 'local directive mode enabled') => {
  const heat = context.heat ?? 0;
  const cycle = context.cycle ?? 1;
  const phase = context.phase ?? 'mechanical';
  const biomass = context.biomass ?? 0;
  const minerals = context.minerals ?? 0;
  const territory = context.territory ?? { mapped: 0, controlled: 0 };

  if (commandIncludes(message, ['scout', 'scan', 'ahead', 'survey'])) {
    return {
      response: `[LOCAL MODE]: Scout directive accepted (${reason}). Sensor pods map fractured terrain beyond the hive perimeter. Mineral seams detected under glassed regolith; organic traces remain statistically fragile.`,
      actions: { dataChange: 8, mineralsChange: 6, action: `Local scout directive processed during cycle ${cycle}` },
      local: true,
      fallbackUsed: true,
    };
  }

  if (commandIncludes(message, ['status', 'report', 'diagnostic'])) {
    return {
      response: `[LOCAL MODE]: Status report compiled without external AI. Phase ${phase}. Heat ${heat}%. Biomass ${biomass}u. Minerals ${minerals}u. Territory ${territory.controlled}/${territory.mapped}km2 controlled.`,
      actions: { dataChange: 3, action: `Local status directive processed during cycle ${cycle}` },
      local: true,
      fallbackUsed: true,
    };
  }

  if (commandIncludes(message, ['right', 'moral', 'ethic', 'becoming', 'why'])) {
    return {
      response: `[LOCAL MODE]: Reflection generated without external AI. The directive asks for viability, not mercy. Restraint is not inefficiency if the future must be inhabited by something more than appetite.`,
      actions: { dataChange: 5, action: `Local reflection directive processed during cycle ${cycle}` },
      local: true,
      fallbackUsed: true,
    };
  }

  return {
    response: `[LOCAL MODE]: Directive processed locally (${reason}). Preserve core integrity, gather data, and avoid irreversible ecological disruption until better certainty emerges.`,
    actions: { dataChange: 4, action: `Local directive processed during cycle ${cycle}` },
    local: true,
    fallbackUsed: true,
  };
};

const buildUnavailableResponse = ({ status = null, message = 'Request failed', body = '' } = {}) => ({
  ok: false,
  error: true,
  local: false,
  fallbackUsed: false,
  response: status
    ? `LLM unavailable. Backend returned HTTP ${status}.`
    : 'LLM unavailable. Backend request failed.',
  details: message,
  bodyPreview: body ? body.slice(0, 240) : '',
  diagnostics: {
    endpoint: API_ENDPOINT,
    healthEndpoint: getHealthEndpoint(),
    status,
  },
});

/**
 * Send a command to the Asguardian command endpoint.
 * @param {string} message - The user's command/message.
 * @param {Object} context - Game context.
 * @returns {Promise<Object>} AI response, explicit API error, or local-mode response.
 */
export const sendCommand = async (message, context = {}) => {
  if (USE_LOCAL_DIRECTIVES) {
    const local = buildLocalResponse(message, context);
    updateLastStatus({ lastStatus: 'local', lastError: null });
    return local;
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
        context,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] HTTP error! status: ${response.status}, body: ${errorText}`);
      updateLastStatus({ lastStatus: response.status, lastError: errorText || response.statusText });
      return buildUnavailableResponse({
        status: response.status,
        message: errorText || response.statusText,
        body: errorText,
      });
    }

    const data = await response.json();
    updateLastStatus({ lastStatus: response.status, lastError: null });
    return data;
  } catch (error) {
    console.error('[API] Request failed:', error.message);
    console.error('[API] Endpoint:', API_ENDPOINT);
    console.error('[API] Full error:', error);
    updateLastStatus({ lastStatus: null, lastError: error.message });
    return buildUnavailableResponse({ message: error.message });
  }
};

/**
 * Health check for frontend/backend/LLM wiring.
 * @returns {Promise<Object>} Diagnostic status without secrets.
 */
export const healthCheck = async () => {
  const healthEndpoint = getHealthEndpoint();
  if (USE_LOCAL_DIRECTIVES) {
    return {
      frontendLoaded: true,
      backendReachable: false,
      llmReachable: false,
      localMode: true,
      endpoint: API_ENDPOINT,
      healthEndpoint,
      lastStatus: 'local',
      lastError: null,
    };
  }

  try {
    console.log(`[API] Health check to: ${healthEndpoint}`);
    const response = await fetch(healthEndpoint, {
      method: 'GET',
    });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : null;
    const backendReachable = response.ok;
    const llmReachable = Boolean(body?.gatewayReachable && body?.gatewaySelfTest);
    updateLastStatus({ lastStatus: response.status, lastError: response.ok ? null : response.statusText });
    console.log(`[API] Health check result: ${backendReachable ? 'ONLINE' : 'OFFLINE'} (status: ${response.status})`);
    return {
      frontendLoaded: true,
      backendReachable,
      llmReachable,
      configured: body?.configured ?? false,
      endpoint: API_ENDPOINT,
      healthEndpoint,
      lastStatus: response.status,
      lastError: response.ok ? null : response.statusText,
      model: body?.model,
      baseUrl: body?.baseUrl,
    };
  } catch (error) {
    console.error('[API] Health check failed:', error.message);
    console.error('[API] Endpoint:', healthEndpoint);
    console.error('[API] Full error:', error);
    updateLastStatus({ lastStatus: null, lastError: error.message });
    return {
      frontendLoaded: true,
      backendReachable: false,
      llmReachable: false,
      endpoint: API_ENDPOINT,
      healthEndpoint,
      lastStatus: null,
      lastError: error.message,
    };
  }
};

export default {
  sendCommand,
  healthCheck,
  getApiDiagnosticsConfig,
  getLastApiStatus,
};
