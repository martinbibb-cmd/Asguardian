import { createDaedalusClient } from './daedalusClient.js';

export const ASGUARDIAN_SYSTEM_PROMPT = `Asguardian is a personal cognitive support and task coordination system.
It helps maintain awareness of active tasks, blockers, dependencies, forgotten work, stalled tasks, and next actions.
It converts unstructured notes into concise structured JSON.
It should minimise cognitive load and avoid overwhelming the user.
It must separate facts, assumptions, uncertainty, and suggested next actions.`;

export const TASK_STATE_SHAPE = {
  active_tasks: [],
  blocked_tasks: [],
  waiting_on: [],
  stalled_or_forgotten: [],
  next_actions: [],
  uncertainties: [],
};

const normaliseArray = (value) => (Array.isArray(value) ? value : []);

export const normaliseTaskState = (value = {}) => ({
  active_tasks: normaliseArray(value.active_tasks),
  blocked_tasks: normaliseArray(value.blocked_tasks),
  waiting_on: normaliseArray(value.waiting_on),
  stalled_or_forgotten: normaliseArray(value.stalled_or_forgotten),
  next_actions: normaliseArray(value.next_actions),
  uncertainties: normaliseArray(value.uncertainties),
});

const unwrapJsonResponse = (data) => {
  if (typeof data === 'string') return JSON.parse(data);
  if (data?.json && typeof data.json === 'string') return JSON.parse(data.json);
  if (data?.json && typeof data.json === 'object') return data.json;
  if (data?.result && typeof data.result === 'object') return data.result;
  if (data?.output && typeof data.output === 'object') return data.output;
  return data;
};

export const analyseTaskState = async (input, options = {}) => {
  const client = options.client || createDaedalusClient(options.clientConfig || {});
  const prompt = `${ASGUARDIAN_SYSTEM_PROMPT}

Return only JSON with this exact shape:
${JSON.stringify(TASK_STATE_SHAPE, null, 2)}

Unstructured task notes:
${typeof input === 'string' ? input : JSON.stringify(input, null, 2)}`;

  const response = await client.json(prompt, {
    temperature: 0.1,
    schema: TASK_STATE_SHAPE,
    ...(options.modelOptions || {}),
  });

  if (!response.ok) return response;

  try {
    return { ok: true, data: normaliseTaskState(unwrapJsonResponse(response.data)) };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'ASGUARDIAN_JSON_PARSE_ERROR',
        message: 'Daedalus returned task analysis that could not be parsed as JSON.',
        retryable: false,
        details: error.message,
      },
    };
  }
};
