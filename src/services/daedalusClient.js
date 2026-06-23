const DEFAULT_TIMEOUT_MS = 30000;

export class DaedalusGatewayError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DaedalusGatewayError';
    this.code = details.code || 'DAEDALUS_GATEWAY_ERROR';
    this.status = details.status;
    this.endpoint = details.endpoint;
    this.retryable = Boolean(details.retryable);
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
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
};

const normaliseErrorBody = (body) => {
  if (!body) return undefined;
  if (typeof body === 'string') return body.slice(0, 500);
  return body.error || body.message || body;
};

const createStructuredError = (message, details) => new DaedalusGatewayError(message, details).toJSON();

export const createDaedalusClient = (config = {}) => {
  const env = config.env || getRuntimeEnv();
  const baseUrl = trimTrailingSlash(config.baseUrl || env.DAEDALUS_LLM_BASE_URL || '');
  const apiKey = config.apiKey || env.DAEDALUS_LLM_API_KEY || '';
  const defaultModel = config.model || env.DAEDALUS_LLM_MODEL || undefined;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = config.fetch || globalThis.fetch;
  const logger = safeLogger(config.logger || console);

  const request = async (path, { method = 'GET', authenticated = true, body } = {}) => {
    if (!baseUrl) {
      return createStructuredError('DAEDALUS_LLM_BASE_URL is not configured.', {
        code: 'DAEDALUS_CONFIG_MISSING',
        endpoint: path,
        retryable: false,
      });
    }

    if (authenticated && !apiKey) {
      return createStructuredError('DAEDALUS_LLM_API_KEY is not configured.', {
        code: 'DAEDALUS_CONFIG_MISSING',
        endpoint: path,
        retryable: false,
      });
    }

    if (!fetchImpl) {
      return createStructuredError('No fetch implementation is available for Daedalus requests.', {
        code: 'DAEDALUS_FETCH_UNAVAILABLE',
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
      if (!response.ok) {
        return createStructuredError(`Daedalus gateway returned HTTP ${response.status}.`, {
          code: 'DAEDALUS_HTTP_ERROR',
          status: response.status,
          endpoint: path,
          retryable: response.status >= 500 || response.status === 429,
          details: normaliseErrorBody(responseBody),
        });
      }

      return { ok: true, data: responseBody };
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      return createStructuredError(timedOut ? 'Daedalus gateway request timed out.' : 'Daedalus gateway request failed.', {
        code: timedOut ? 'DAEDALUS_TIMEOUT' : 'DAEDALUS_NETWORK_ERROR',
        endpoint: path,
        retryable: true,
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
