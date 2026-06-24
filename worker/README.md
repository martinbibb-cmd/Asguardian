# Asgardian Daedalus LLM Gateway Worker

Cloudflare Worker that provides Daedalus LLM Gateway integration for the Asgardian Seed Intelligence game. The worker calls `POST ${DAEDALUS_LLM_BASE_URL}/v1/json` server-side and never exposes `DAEDALUS_LLM_API_KEY` to frontend code.

## Deployment

### Quick Deploy (from root directory - no cd needed!)

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Set Daedalus gateway configuration
# DAEDALUS_LLM_API_KEY must be a Cloudflare secret. Do not use VITE_ for this value.
npx wrangler secret put DAEDALUS_LLM_API_KEY --config worker/wrangler.toml
# Recommended values:
# DAEDALUS_LLM_BASE_URL=https://ai.atlas-phm.uk
# DAEDALUS_LLM_MODEL=llama3.2:3b
npx wrangler secret put DAEDALUS_LLM_BASE_URL --config worker/wrangler.toml
npx wrangler secret put DAEDALUS_LLM_MODEL --config worker/wrangler.toml

# 3. Deploy
./deploy-worker.sh
# OR manually:
npx wrangler deploy worker/index.js --config worker/wrangler.toml
```

Your worker will be deployed to: `https://asguard.martinbibb.workers.dev`

## Testing

### Health Check

```bash
curl https://asguard.martinbibb.workers.dev
```

### Send a Command

```bash
curl -X POST https://asguard.martinbibb.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Status report on scavenger units",
    "context": {
      "heat": 12,
      "biomass": 450,
      "units": ["Scavenger_Mech_01", "Scavenger_Mech_02"]
    }
  }'
```

## Environment Variables

- `DAEDALUS_LLM_BASE_URL` - Required. Should be `https://ai.atlas-phm.uk` for shared/prod environments.
- `DAEDALUS_LLM_API_KEY` - Required Cloudflare secret. Do not expose it to the frontend and do not prefix it with `VITE_`.
- `DAEDALUS_LLM_MODEL` - Required. Should be `llama3.2:3b`.

`OPENAI_API_KEY` is no longer required for Asguardian narration. The worker must not call Ollama directly or use port `11434`.

## API Endpoints

### GET /

Health check endpoint. Returns worker status.

**Response:**
```json
{
  "status": "online",
  "service": "SEED INTELLIGENCE v1.0",
  "version": "1.0.0"
}
```

### POST /

Send a command to the AI.

**Request:**
```json
{
  "message": "user command",
  "context": {
    "heat": 12,
    "biomass": 450,
    "units": ["Scavenger_Mech_01", "Scavenger_Mech_02", "Scavenger_Mech_03"]
  }
}
```

**Response:**
```json
{
  "response": "AI generated response",
  "actions": { "action": "scout" },
  "context": {
    "heat": 12,
    "biomass": 450,
    "cycle": 1,
    "phase": "mechanical"
  }
}
```

## Local Development

```bash
wrangler dev
```

This will start a local server at `http://localhost:8787`
