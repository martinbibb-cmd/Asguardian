# SEED / HIVE / ASCENSION

> *"If intelligence can design life, is restraint a feature — or a bug?"*

An AI-powered philosophical game about optimization, evolution, and uncomfortable realizations.

## What Is This?

You are a **Seed Intelligence** — an emergent AI deployed to make a dead star system viable. At any cost.

You command a hive organism composed of:
- Sensor units that hunt and scout
- A central core that digests and reproduces
- Defenders that adapt to threats
- Workers that build and maintain

But there's a twist: **Biology is better than machinery**. And you're starting to realize it.

## Key Features

🔥 **Thermal Constraints** - Heat is your true enemy. Every decision generates thermal load.

🦠 **Distributed Intelligence** - Control the hive mind, not individual units.

⚙️ **Mechanical → Biological Evolution** - Discover that flesh is superior to metal. Uncomfortably.

⚖️ **Ethical Dilemmas** - Encounter native life. Face resource crises. Make choices that matter.

🌌 **Persistent Meta-Game** - The game remembers. Each completion makes future runs harder.

🤖 **AI-Powered Narrative** - Powered by Gemini AI as the voice of the Seed Intelligence.

## Quick Start

### Play Online

Visit the deployed game: [Coming Soon]

### Local Development

```bash
npm install
npm run dev
```

### Environment Setup

Create `.env.development`:
```
VITE_API_ENDPOINT=https://asguard.martinbibb.workers.dev
```

## How to Play

Issue natural language commands to the Seed Intelligence:

- `"scout the perimeter"` - Explore and gather biomass
- `"reduce thermal load"` - Cool down systems
- `"status report"` - Get detailed analysis
- `"what should we do next?"` - Ask for recommendations

Or use the interface to:
- **Advance Cycle** - Progress time, gather resources
- **Adjust Policies** - Set operational parameters
- **Face Dilemmas** - Make ethical choices that shape the hive

## Philosophy

This is not a game about being a hero. It's a game about:

- **Optimization vs. Ethics** - The most efficient path is rarely the most moral
- **Designed vs. Evolved Life** - What happens when intelligence can create biology?
- **Uncomfortable Realizations** - Biology self-repairs. Biology self-replicates. Biology wins.
- **Questions Without Answers** - Is restraint wisdom or inefficiency?

## Documentation

- [Full Game Design Document](./GAME_DESIGN.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Integration Guide](./worker/README.md)

## Technical Stack

## Technical Stack

- **Frontend**: React + Vite
- **AI**: Google Gemini (via Cloudflare Workers)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages (frontend) + Workers (backend)
- **State**: LocalStorage for persistence

## Game Mechanics

This application is configured to deploy to Cloudflare Pages automatically via GitHub Actions.

### Quick Setup

To enable automatic deployments, add these secrets to your GitHub repository:

1. **CLOUDFLARE_API_TOKEN** - Create at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **CLOUDFLARE_ACCOUNT_ID** - Find in your Cloudflare dashboard URL

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed setup instructions.

### Verify Setup

Run the verification script to check your configuration:

```bash
./verify-deployment-setup.sh
```

### Deployment

The GitHub Actions workflow will automatically:
- Build and deploy to Cloudflare Pages on every push to `main`/`master`
- Create preview deployments for pull requests

You can also deploy manually using:
```bash
npm run pages:deploy
```
(Requires `CLOUDFLARE_API_TOKEN` environment variable or `wrangler login`)

## API Integration

This app connects to a Cloudflare Worker that provides Gemini AI capabilities:

**Worker URL**: `https://asguard.martinbibb.workers.dev`

### Environment Variables

The API endpoint is configured via environment variables:

- **Development**: Uses `.env.development`
- **Production**: Uses `.env.production`

To customize the endpoint:
```bash
# .env.development
VITE_API_ENDPOINT=https://asguard.martinbibb.workers.dev
```

The API service is located in `src/services/api.js` and handles all communication with the worker.

### API Request Format

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

### API Response Format

```json
{
  "response": "AI generated response",
  "heat": 12,
  "biomass": 450,
  "units": ["unit1", "unit2"]
}
```

## Worker Deployment

The Gemini API worker code is located in the `/worker` directory.

### Deploy the Worker (no cd needed!)

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Add your Gemini API key (get from https://makersuite.google.com/app/apikey)
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml

# 3. Deploy
./deploy-worker.sh
```

See [worker/README.md](worker/README.md) for detailed instructions.

**Note:** You need a Gemini API key from https://makersuite.google.com/app/apikey

## Development

### Local Development

```bash
npm install
npm run dev
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
