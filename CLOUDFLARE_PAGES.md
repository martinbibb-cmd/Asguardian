# Cloudflare Pages Deployment Guide

## Quick Fix for "Workers-specific command in a Pages project" Error

If you see this error during deployment:
```
✘ [ERROR] It looks like you've run a Workers-specific command in a Pages project.
For Pages, please run `wrangler pages deploy` instead.
```

**Solution**: In your Cloudflare Pages dashboard settings, the **Deploy command** field should be **EMPTY**.

## Cloudflare Pages Dashboard Configuration

### Build Settings

Go to your Cloudflare Pages project → Settings → Builds & deployments

Configure the following:

| Setting | Value |
|---------|-------|
| **Framework preset** | Vite |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` |
| **Deploy command** | **(Leave Empty)** |

### Why Leave Deploy Command Empty?

Cloudflare Pages automatically deploys the contents of your build output directory after a successful build. You do NOT need a separate deploy command.

- `wrangler deploy` is for Cloudflare Workers (serverless functions)
- `wrangler pages deploy` is for manual CLI deployments, not CI/CD
- Cloudflare Pages handles deployment automatically after build

## Manual Deployment via CLI

If you want to deploy manually from your local machine:

```bash
# Build and deploy in one command
npm run pages:deploy

# Or separately
npm run build
npx wrangler pages deploy dist --project-name asguardian-app
```

## Project Structure

This repository is configured for:
- **Frontend**: Cloudflare Pages (this application)
- **Backend**: Cloudflare Workers (AI API in `/worker` directory)

See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub Pages deployment and [worker/README.md](worker/README.md) for Cloudflare Workers deployment.

## Troubleshooting

### Error: "Workers-specific command in a Pages project"

**Cause**: Deploy command is set to `wrangler deploy` instead of being empty.

**Fix**: 
1. Go to Cloudflare Pages dashboard
2. Navigate to Settings → Builds & deployments
3. Clear the "Deploy command" field
4. Save and retry deployment

### Build succeeds but deployment fails

**Check**:
1. Verify `dist` directory exists after build
2. Confirm build output directory is set to `dist` in dashboard
3. Check Cloudflare Pages build logs for errors

### Need to deploy both frontend and backend?

- **Frontend** (this app): Deploy to Cloudflare Pages (automatic on push)
- **Backend** (API worker): Deploy separately using `./deploy-worker.sh`

## Configuration Files

- `wrangler.toml` - Cloudflare Pages configuration (frontend)
- `worker/wrangler.toml` - Cloudflare Workers configuration (backend)
- `package.json` - Contains `pages:deploy` script for manual deployments
