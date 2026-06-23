# Deployment Guide

This guide covers deploying the Asgardian Seed Intelligence game to GitHub Pages.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account
2. A GitHub repository with the code
3. Pushes to the `main` or `master` branch

## Setup GitHub Pages

The deployment is automatic via GitHub Actions. To enable it:

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

That's it! No API tokens or secrets required.

## Automatic Deployment

Once GitHub Pages is enabled, the workflow will automatically:

- **Deploy to production** when you push to `main` or `master` branch
- Build the application with the production environment variables
- Deploy the built site to GitHub Pages

The workflow is defined in `.github/workflows/deploy.yml`.

## Accessing Your Deployed Site

After deployment, your site will be available at:

```
https://<username>.github.io/<repository-name>/
```

For example:
- Repository: `martinbibb-cmd/Asguardian`
- URL: `https://martinbibb-cmd.github.io/Asguardian/`

## Project Configuration

The project is configured with:

- **Build Command**: `npm run build`
- **Build Output**: `dist/`
- **Framework**: Vite (React)
- **Environment**: Production environment variables set in workflow

These settings are defined in:
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `package.json` - Build scripts
- `vite.config.js` - Vite configuration

## Troubleshooting

### Deployment not working

- Verify GitHub Pages is enabled in repository settings
- Ensure the source is set to "GitHub Actions"
- Check the Actions tab for workflow run status
- Verify the workflow has necessary permissions

### Build fails

- Check the build logs in GitHub Actions
- Verify the build works locally with `npm run build`
- Ensure all dependencies are in `package.json`

### Site shows 404

- Ensure GitHub Pages source is set to "GitHub Actions"
- Wait a few minutes after first deployment
- Check if the workflow completed successfully
- Verify the base path in `vite.config.js` if using a subdirectory

## Cloudflare Pages Deployment

To deploy the application to Cloudflare Pages:

### Configuration

In your Cloudflare Pages dashboard, configure the following settings:

- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Deploy Command**: Leave empty (Cloudflare Pages will automatically deploy the build output)

**Important**: Do NOT set the deploy command to `wrangler deploy` as this is for Cloudflare Workers, not Pages. Cloudflare Pages automatically handles deployment after the build is complete.

### Manual Deployment

To manually deploy to Cloudflare Pages using the CLI:

```bash
npm run pages:deploy
```

Or directly:

```bash
npm run build
npx wrangler pages deploy dist
```

## Worker Deployment

The AI backend worker is deployed separately to Cloudflare Workers. See [worker/README.md](worker/README.md) for instructions on deploying the OpenAI API worker.

## Environment Variables

The application uses these environment variables:

- `VITE_API_ENDPOINT` - URL of the app API worker (set in workflow)
- `DAEDALUS_LLM_BASE_URL` - Daedalus LLM Gateway base URL. Use `https://ai.atlas-phm.uk` for production and shared environments; local development can still override it when testing a private gateway route.
- `DAEDALUS_LLM_MODEL` - Default Daedalus model, for example `llama3.2:3b`
- `DAEDALUS_LLM_API_KEY` - Secret sent as `x-daedalus-api-key` to the gateway. Never expose this value in logs, UI, errors, or snapshots.

Asguardian apps must call the Daedalus LLM Gateway and must never call Ollama or port `11434` directly. When the gateway is missing or unreachable, production should fail clearly at the gateway-client layer and keep local fallback cognition active.

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
- [Vite Static Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
