# Asgardian Gemini Worker

Cloudflare Worker that provides Gemini AI integration for the Asgardian Seed Intelligence game.

## Deployment

### Quick Deploy (from root directory - no cd needed!)

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Set your Gemini API key
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml
# Get key from: https://makersuite.google.com/app/apikey

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

- `GEMINI_API_KEY` - Required. Your Google Gemini API key

## API Endpoints

### GET /

Health check endpoint. Returns worker status.

**Response:**
```json
{
  "status": "online",
  "service": "Asgardian Gemini Worker",
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
  "heat": 12,
  "biomass": 450,
  "units": ["unit1", "unit2"]
}
```

## Local Development

```bash
wrangler dev
```

This will start a local server at `http://localhost:8787`
