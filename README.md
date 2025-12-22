# Asgardian: Seed Intelligence

An AI-powered dashboard game that connects to a Cloudflare Worker running Gemini AI. Players interact with an alien seed intelligence managing units on a distant planet.

## Features

- Real-time AI interaction via Gemini API
- Dynamic game state management (heat, biomass, units)
- Typewriter effect for AI responses
- Cloudflare Workers backend for serverless AI processing

## Cloudflare Pages Deployment

This application is configured to deploy to Cloudflare Pages automatically via GitHub Actions.

### Setup Required

To enable automatic deployments, add the following secrets to your GitHub repository:

1. **CLOUDFLARE_API_TOKEN**: Create an API token at https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
   - Use the "Edit Cloudflare Workers" template or create a custom token with:
     - Account: Cloudflare Pages (Edit permission)

2. **CLOUDFLARE_ACCOUNT_ID**: Find this in your Cloudflare dashboard URL or account settings

To add these secrets:
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret" for each secret above

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
