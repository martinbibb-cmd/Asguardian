const DEFAULT_TIMEOUT_MS = 30000;

export const DAEDALUS_FAILURE_KINDS = {
  MISSING_CONFIG: 'missing_config',
  NETWORK_FETCH_FAILURE: 'network_fetch_failure',
  AUTH_FAILURE: 'auth_failure',
  INVALID_JSON_RESPONSE: 'invalid_json_response',
  GATEWAY_ERROR: 'gateway_error',
};

export class DaedalusGatewayError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DaedalusGatewayError';
    this.code = details.code || 'DAEDALUS_GATEWAY_ERROR';
    this.status = details.status;
    this.endpoint = details.endpoint;
    this.retryable = Boolean(details.retryable);
    this.failureKind = details.failureKind || DAEDALUS_FAILURE_KINDS.GATEWAY_ERROR;
    this.gatewayConfigured = Boolean(details.gatewayConfigured);
    this.gatewayReachable = Boolean(details.gatewayReachable);
    this.details = details.details;
  }

  toJSON() {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        endpoint: this.endpoint,
        retryable: this.retryable,
        failureKind: this.failureKind,
        gatewayConfigured: this.gatewayConfigured,
        gatewayReachable: this.gatewayReachable,
        details: this.details,
      },
    };
  }
}

const getRuntimeEnv = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env;
  if (typeof process !== 'undefined' && process.env) return process.env;
  return {};
};

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const safeLogger = (logger) => ({
  info: (...args) => logger?.info?.(...args),
  warn: (...args) => logger?.warn?.(...args),
  error: (...args) => logger?.error?.(...args),
});

const readResponseBody = async (response) => {
  const contentType = response.headers?.get?.('content-type') || '';
  const text = await response.text();
  if (!text) return null;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return {
        __daedalusInvalidJson: true,
        parseMessage: error.message,
      };
    }
  }

  return text;
};

const normaliseErrorBody = (body) => {
  if (!body) return undefined;
  if (typeof body === 'string') return body.slice(0, 500);
  return body.error || body.message || body;
};

const createStructuredError = (message, details) => new DaedalusGatewayError(message, details).toJSON();

const hasStructuredGatewayError = (body) => body && typeof body === 'object' && body.ok === false && body.error;

export const createDaedalusClient = (config = {}) => {
  const env = config.env || getRuntimeEnv();
  const baseUrl = trimTrailingSlash(config.baseUrl || env.DAEDALUS_LLM_BASE_URL || '');
  const apiKey = config.apiKey || env.DAEDALUS_LLM_API_KEY || '';
  const defaultModel = config.model || env.DAEDALUS_LLM_MODEL || undefined;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = config.fetch || globalThis.fetch;
  const logger = safeLogger(config.logger || console);
  const gatewayConfigured = Boolean(baseUrl && apiKey);

  const request = async (path, { method = 'GET', authenticated = true, body } = {}) => {
    if (!baseUrl) {
      return createStructuredError('DAEDALUS_LLM_BASE_URL is not configured.', {
        code: 'DAEDALUS_CONFIG_MISSING',
        failureKind: DAEDALUS_FAILURE_KINDS.MISSING_CONFIG,
        gatewayConfigured: false,
        gatewayReachable: false,
        endpoint: path,
        retryable: false,
      });
    }

    if (authenticated && !apiKey) {
      return createStructuredError('DAEDALUS_LLM_API_KEY is not configured.', {
        code: 'DAEDALUS_CONFIG_MISSING',
        failureKind: DAEDALUS_FAILURE_KINDS.MISSING_CONFIG,
        gatewayConfigured: false,
        gatewayReachable: false,
        endpoint: path,
        retryable: false,
      });
    }

    if (!fetchImpl) {
      return createStructuredError('No fetch implementation is available for Daedalus requests.', {
        code: 'DAEDALUS_FETCH_UNAVAILABLE',
        failureKind: DAEDALUS_FAILURE_KINDS.NETWORK_FETCH_FAILURE,
        gatewayConfigured,
        gatewayReachable: false,
        endpoint: path,
        retryable: false,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${baseUrl}${path}`;

    try {
      const headers = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (authenticated) headers['x-daedalus-api-key'] = apiKey;

      logger.info('[Daedalus] Request', { method, path });
      const response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const responseBody = await readResponseBody(response);
      if (responseBody?.__daedalusInvalidJson) {
        return createStructuredError('Daedalus gateway returned invalid JSON.', {
          code: 'DAEDALUS_INVALID_JSON',
          failureKind: DAEDALUS_FAILURE_KINDS.INVALID_JSON_RESPONSE,
          status: response.status,
          endpoint: path,
          retryable: false,
          gatewayConfigured,
          gatewayReachable: true,
          details: responseBody.parseMessage,
        });
      }

      if (!response.ok) {
        const authFailure = response.status === 401;
        return createStructuredError(authFailure ? 'Daedalus gateway rejected authentication.' : `Daedalus gateway returned HTTP ${response.status}.`, {
          code: authFailure ? 'DAEDALUS_AUTH_FAILED' : 'DAEDALUS_HTTP_ERROR',
          failureKind: authFailure ? DAEDALUS_FAILURE_KINDS.AUTH_FAILURE : DAEDALUS_FAILURE_KINDS.GATEWAY_ERROR,
          status: response.status,
          endpoint: path,
          retryable: !authFailure && (response.status >= 500 || response.status === 429),
          gatewayConfigured,
          gatewayReachable: true,
          details: normaliseErrorBody(responseBody),
        });
      }

      if (hasStructuredGatewayError(responseBody)) {
        return createStructuredError(responseBody.error.message || 'Daedalus gateway returned a structured error.', {
          code: responseBody.error.code || 'DAEDALUS_STRUCTURED_ERROR',
          failureKind: DAEDALUS_FAILURE_KINDS.GATEWAY_ERROR,
          status: responseBody.error.status,
          endpoint: path,
          retryable: Boolean(responseBody.error.retryable),
          gatewayConfigured,
          gatewayReachable: true,
          details: responseBody.error.details,
        });
      }

      return { ok: true, data: responseBody, meta: { gatewayConfigured, gatewayReachable: true } };
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      return createStructuredError(timedOut ? 'Daedalus gateway request timed out.' : 'Daedalus gateway network fetch failed.', {
        code: timedOut ? 'DAEDALUS_TIMEOUT' : 'DAEDALUS_NETWORK_ERROR',
        failureKind: DAEDALUS_FAILURE_KINDS.NETWORK_FETCH_FAILURE,
        endpoint: path,
        retryable: true,
        gatewayConfigured,
        gatewayReachable: false,
        details: error?.message,
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const withModel = (options = {}) => ({
    ...(defaultModel ? { model: defaultModel } : {}),
    ...options,
  });

  return {
    isConfigured: () => gatewayConfigured,
    health: () => request('/health', { authenticated: false }),
    models: () => request('/models'),
    json: (prompt, options = {}) => request('/v1/json', { method: 'POST', body: { prompt, ...withModel(options) } }),
    summarise: (text, options = {}) => request('/v1/summarise', { method: 'POST', body: { text, ...withModel(options) } }),
    extractEvidence: (text, questionOrContext, options = {}) => request('/v1/extract-evidence', {
      method: 'POST',
      body: { text, questionOrContext, ...withModel(options) },
    }),
  };
};

export default createDaedalusClient;
