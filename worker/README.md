# Asgardian Gemini Worker

Cloudflare Worker that provides Gemini AI integration for the Asgardian Seed Intelligence game.

## Deployment

### 1. Install Dependencies

```bash
cd worker
npm install -g wrangler  # If not already installed
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Set Up Gemini API Key

Get your Gemini API key from: https://makersuite.google.com/app/apikey

Then add it as a secret:

```bash
wrangler secret put GEMINI_API_KEY
# Paste your API key when prompted
```

### 4. Deploy

```bash
wrangler deploy
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
