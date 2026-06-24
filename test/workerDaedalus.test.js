import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker/index.js';
import { onRequest as pagesApiRequest } from '../functions/api/[[path]].js';
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

const getLlmHealth = (env = gatewayEnv) => worker.fetch(new Request('https://asguardian.test/api/llm-health'), env);

const pagesRequest = (request, env = gatewayEnv) => pagesApiRequest({ request, env });

test('worker does not call api.openai.com and uses the Daedalus JSON endpoint', async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    assert.equal(calledUrl.includes('api.openai.com'), false);
    assert.equal(calledUrl.includes('localhost:11434'), false);
    assert.equal(calledUrl.toLowerCase().includes('ollama'), false);
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

test('/api/llm-health reports missing env cleanly', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return Response.json({ ok: true });
  };

  try {
    const response = await getLlmHealth({ ...gatewayEnv, DAEDALUS_LLM_API_KEY: '' });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: false,
      configured: false,
      missing: ['DAEDALUS_LLM_API_KEY'],
    });
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/llm-health calls /v1/self-test with x-daedalus-api-key and returns no secret', async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl;
  let observedHeaders;
  globalThis.fetch = async (url, init) => {
    calledUrl = String(url);
    observedHeaders = init.headers;
    return Response.json({ ok: true });
  };

  try {
    const response = await getLlmHealth();
    const body = await response.json();
    const serialized = JSON.stringify(body);

    assert.equal(response.status, 200);
    assert.equal(calledUrl, 'https://ai.atlas-phm.uk/v1/self-test');
    assert.equal(observedHeaders['x-daedalus-api-key'], gatewayEnv.DAEDALUS_LLM_API_KEY);
    assert.deepEqual(body, {
      ok: true,
      configured: true,
      baseUrl: 'https://ai.atlas-phm.uk',
      model: 'llama3.2:3b',
      gatewayReachable: true,
      gatewaySelfTest: true,
    });
    assert.equal(serialized.includes(gatewayEnv.DAEDALUS_LLM_API_KEY), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Pages catch-all routes /api/llm-health to JSON health response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: true });

  try {
    const response = await pagesRequest(new Request('https://asguardian.test/api/llm-health'));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/json');
    assert.equal(body.configured, true);
    assert.equal(body.gatewaySelfTest, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Pages catch-all preserves POST /api command route', async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    return Response.json({ response: 'Command path reached gateway.' });
  };

  try {
    const response = await pagesRequest(new Request('https://asguardian.test/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'status report', context: { heat: 7 } }),
    }));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(calledUrl, 'https://ai.atlas-phm.uk/v1/json');
    assert.equal(body.response, 'Command path reached gateway.');
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
