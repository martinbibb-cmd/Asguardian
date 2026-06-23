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

🤖 **AI-Powered Narrative** - Powered by OpenAI as the voice of the Seed Intelligence.

## Quick Start

### Play Online

Visit the deployed game: [Coming Soon]

### Local Development

```bash
npm install
npm run dev
```

### Environment Setup

Cloudflare Pages uses the built-in `/api` function by default. For local development against another deployed worker, create `.env.development`:
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
- [GitHub Pages Deployment Guide](./DEPLOYMENT.md)
- [Cloudflare Pages Deployment Guide](./CLOUDFLARE_PAGES.md)
- [API Integration Guide](./worker/README.md)

## Technical Stack

## Technical Stack

- **Frontend**: React + Vite
- **AI**: OpenAI (via Cloudflare Pages Functions or Cloudflare Workers)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages (frontend) + Workers (backend)
- **State**: LocalStorage for persistence

## Game Mechanics

This application is configured to deploy to GitHub Pages automatically via GitHub Actions.

### Quick Setup

The deployment is automatic and requires no additional setup! The GitHub Actions workflow will:
- Build and deploy to GitHub Pages on every push to `main`/`master`
- The site will be available at `https://<username>.github.io/<repository-name>/`

To enable GitHub Pages:
1. Go to your repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy on the next push

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed setup instructions.

### Deployment

The GitHub Actions workflow will automatically:
- Build the application
- Deploy to GitHub Pages on every push to `main`/`master`

No API tokens or secrets required!

## API Integration

This app connects to the bundled Cloudflare Pages Function at `/api`, which uses the `OPENAI_API_KEY` secret configured in the Pages dashboard. You can still override `VITE_API_ENDPOINT` to point at a separately deployed Worker.

**Default API URL**: `/api`

### Environment Variables

The API endpoint defaults to `/api` and can be overridden via Vite environment variables:

- **Development**: Optional `.env.development`
- **Production**: Optional `.env.production`

To customize the endpoint:
```bash
# .env.development (optional)
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

The OpenAI API worker code is located in the `/worker` directory.

### Deploy the Worker (no cd needed!)

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Add your OpenAI API key (get from https://platform.openai.com/api-keys)
npx wrangler secret put OPENAI_API_KEY --config worker/wrangler.toml

# 3. Deploy
./deploy-worker.sh
```

See [worker/README.md](worker/README.md) for detailed instructions.

**Note:** You need an OpenAI API key from https://platform.openai.com/api-keys

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

## Daedalus LLM Gateway Configuration

Asguardian LLM features use the shared Daedalus LLM Gateway. The app must only call the gateway and must not call Ollama or port `11434` directly.

Set these variables for local development, Cloudflare Pages/Workers, or any future public Cloudflare Tunnel hostname:

```bash
DAEDALUS_LLM_BASE_URL=http://100.69.193.95:8787
DAEDALUS_LLM_MODEL=llama3.2:3b
DAEDALUS_LLM_API_KEY=<secret>
```

`DAEDALUS_LLM_BASE_URL` is intentionally configurable. The Tailscale IP (`http://100.69.193.95:8787`) works only from Tailscale-connected machines. Cloudflare Pages/Workers production cannot reach that private Tailscale address directly, so production requires a Cloudflare Tunnel or another public HTTPS route to the Daedalus gateway. Do not hard-code a public URL before that route exists.

Apps must call the Daedalus LLM Gateway and must never call Ollama or port `11434` directly. If the gateway URL, API key, network route, authentication, or JSON response is invalid, the client reports a structured failure and Asguardian falls back to local cognition instead of breaking the command loop.

The reusable client lives in `src/services/daedalusClient.js` and supports `health()`, `models()`, `json()`, `summarise()`, and `extractEvidence()`. The Asguardian task-state analysis service lives in `src/services/asguardianLlm.js`.
