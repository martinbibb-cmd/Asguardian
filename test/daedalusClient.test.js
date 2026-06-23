import assert from 'node:assert/strict';
import test from 'node:test';
import { analyseTaskState } from '../src/services/asguardianLlm.js';
import { createDaedalusClient } from '../src/services/daedalusClient.js';

const env = {
  DAEDALUS_LLM_BASE_URL: 'https://llm.example.test',
  DAEDALUS_LLM_API_KEY: 'super-secret-key',
  DAEDALUS_LLM_MODEL: 'llama3.2:3b',
};

test('client sends the Daedalus auth header', async () => {
  let observedHeaders;
  const client = createDaedalusClient({
    env,
    fetch: async (_url, init) => {
      observedHeaders = init.headers;
      return Response.json({ models: [] });
    },
  });

  const response = await client.models();

  assert.equal(response.ok, true);
  assert.equal(observedHeaders['x-daedalus-api-key'], env.DAEDALUS_LLM_API_KEY);
});

test('client does not log the API key', async () => {
  const logs = [];
  const logger = {
    info: (...args) => logs.push(args),
    warn: (...args) => logs.push(args),
    error: (...args) => logs.push(args),
  };
  const client = createDaedalusClient({
    env,
    logger,
    fetch: async () => Response.json({ ok: true }),
  });

  await client.json('Summarise tasks');

  assert.equal(JSON.stringify(logs).includes(env.DAEDALUS_LLM_API_KEY), false);
});

test('analyseTaskState parses expected JSON from successful mocked gateway response', async () => {
  const expected = {
    active_tasks: ['Ship invoice'],
    blocked_tasks: ['Deploy app'],
    waiting_on: ['DNS approval'],
    stalled_or_forgotten: ['Follow up with Alex'],
    next_actions: ['Check Cloudflare variables'],
    uncertainties: ['Whether API key has been rotated'],
  };
  const client = {
    isConfigured: () => true,
    json: async () => ({ ok: true, data: { json: expected }, meta: { gatewayConfigured: true, gatewayReachable: true } }),
  };

  const response = await analyseTaskState('Invoice is active. Deploy waits on DNS.', { client, devDebug: true });

  assert.deepEqual(response.data, expected);
  assert.equal(response.local, false);
  assert.equal(response.remote, true);
  assert.deepEqual(response.debug, { gatewayConfigured: true, gatewayReachable: true, failureKind: undefined });
});

test('gateway failure returns a structured error', async () => {
  const client = createDaedalusClient({
    env,
    fetch: async () => Response.json({ error: 'upstream unavailable' }, { status: 503 }),
  });

  const response = await client.summarise('notes');

  assert.equal(response.ok, false);
  assert.equal(response.error.code, 'DAEDALUS_HTTP_ERROR');
  assert.equal(response.error.failureKind, 'gateway_error');
  assert.equal(response.error.status, 503);
  assert.equal(response.error.retryable, true);
  assert.equal(response.error.endpoint, '/v1/summarise');
});

test('unreachable gateway falls back cleanly with development debug status', async () => {
  const client = createDaedalusClient({
    env,
    fetch: async () => { throw new TypeError('Load failed'); },
  });

  const response = await analyseTaskState('Ship the report.', { client, devDebug: true });

  assert.equal(response.ok, true);
  assert.equal(response.local, true);
  assert.equal(response.remote, false);
  assert.equal(response.error.failureKind, 'network_fetch_failure');
  assert.deepEqual(response.debug, {
    gatewayConfigured: true,
    gatewayReachable: false,
    failureKind: 'network_fetch_failure',
  });
});

test('missing gateway URL falls back cleanly', async () => {
  const client = createDaedalusClient({
    env: { ...env, DAEDALUS_LLM_BASE_URL: '' },
    fetch: async () => { throw new Error('fetch should not be called'); },
  });

  const response = await analyseTaskState('Check blockers.', { client, devDebug: true });

  assert.equal(response.ok, true);
  assert.equal(response.local, true);
  assert.equal(response.error.code, 'DAEDALUS_CONFIG_MISSING');
  assert.equal(response.debug.gatewayConfigured, false);
  assert.equal(response.debug.gatewayReachable, false);
  assert.equal(response.debug.failureKind, 'missing_config');
});

test('401 auth failure does not expose secret', async () => {
  const client = createDaedalusClient({
    env,
    fetch: async () => Response.json({ error: 'bad key' }, { status: 401 }),
  });

  const response = await client.json('private prompt');
  const serialised = JSON.stringify(response);

  assert.equal(response.ok, false);
  assert.equal(response.error.code, 'DAEDALUS_AUTH_FAILED');
  assert.equal(response.error.failureKind, 'auth_failure');
  assert.equal(serialised.includes(env.DAEDALUS_LLM_API_KEY), false);
});

test('invalid JSON response is reported clearly', async () => {
  const client = createDaedalusClient({
    env,
    fetch: async () => new Response('{not valid json', { headers: { 'content-type': 'application/json' } }),
  });

  const response = await client.models();

  assert.equal(response.ok, false);
  assert.equal(response.error.code, 'DAEDALUS_INVALID_JSON');
  assert.equal(response.error.failureKind, 'invalid_json_response');
});
