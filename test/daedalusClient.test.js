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

test('analyseTaskState parses expected JSON', async () => {
  const expected = {
    active_tasks: ['Ship invoice'],
    blocked_tasks: ['Deploy app'],
    waiting_on: ['DNS approval'],
    stalled_or_forgotten: ['Follow up with Alex'],
    next_actions: ['Check Cloudflare variables'],
    uncertainties: ['Whether API key has been rotated'],
  };
  const client = {
    json: async () => ({ ok: true, data: { json: expected } }),
  };

  const response = await analyseTaskState('Invoice is active. Deploy waits on DNS.', { client });

  assert.deepEqual(response, { ok: true, data: expected });
});

test('gateway failure returns a structured error', async () => {
  const client = createDaedalusClient({
    env,
    fetch: async () => Response.json({ error: 'upstream unavailable' }, { status: 503 }),
  });

  const response = await client.summarise('notes');

  assert.equal(response.ok, false);
  assert.equal(response.error.code, 'DAEDALUS_HTTP_ERROR');
  assert.equal(response.error.status, 503);
  assert.equal(response.error.retryable, true);
  assert.equal(response.error.endpoint, '/v1/summarise');
});
