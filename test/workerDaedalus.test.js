import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker/index.js';
import { sendCommand } from '../src/services/api.js';

const gatewayEnv = {
  DAEDALUS_LLM_BASE_URL: 'https://ai.atlas-phm.uk',
  DAEDALUS_LLM_API_KEY: 'secret-daedalus-key',
  DAEDALUS_LLM_MODEL: 'llama3.2:3b',
};

const postCommand = (env = gatewayEnv) => worker.fetch(new Request('https://asguardian.test/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'scout the perimeter', context: { heat: 12, biomass: 450, cycle: 3, phase: 'mechanical' } }),
}), env);

test('worker does not call api.openai.com and uses the Daedalus JSON endpoint', async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    assert.equal(calledUrl.includes('api.openai.com'), false);
    return Response.json({ response: 'We observe the perimeter.' });
  };

  try {
    const response = await postCommand();
    assert.equal(response.status, 200);
    assert.equal(calledUrl, 'https://ai.atlas-phm.uk/v1/json');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('worker sends x-daedalus-api-key to the gateway', async () => {
  const originalFetch = globalThis.fetch;
  let observedHeaders;
  globalThis.fetch = async (_url, init) => {
    observedHeaders = init.headers;
    return Response.json({ response: 'Gateway accepted.' });
  };

  try {
    const response = await postCommand();
    assert.equal(response.status, 200);
    assert.equal(observedHeaders['x-daedalus-api-key'], gatewayEnv.DAEDALUS_LLM_API_KEY);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('missing gateway config returns a clear error', async () => {
  const response = await postCommand({ ...gatewayEnv, DAEDALUS_LLM_API_KEY: '' });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.error, 'Internal server error');
  assert.equal(body.details, 'DAEDALUS_LLM_API_KEY not configured');
});

test('gateway success returns the expected Asguardian response shape', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ response: 'We observe new mineral seams.' });

  try {
    const response = await postCommand();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof body.response, 'string');
    assert.equal(body.actions.action, 'scout');
    assert.equal(body.context.heat, 12);
    assert.equal(body.context.biomass, 450);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('frontend command fallback still works if /api fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('gateway down', { status: 503 });

  try {
    const response = await sendCommand('status report', { heat: 9, biomass: 300, minerals: 100, cycle: 4 });

    assert.equal(response.local, true);
    assert.equal(response.response.includes('[LOCAL COGNITION]'), true);
    assert.equal(response.actions.action, 'Local status directive processed during cycle 4');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
