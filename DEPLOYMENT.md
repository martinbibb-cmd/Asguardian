# Deployment Guide

This guide covers deploying the Asgardian Seed Intelligence game to Cloudflare Pages.

## Prerequisites

Before deploying, ensure you have:

1. A Cloudflare account (free tier works)
2. A GitHub repository with the code
3. Access to repository settings (to add secrets)

## Setup GitHub Secrets

The deployment workflow requires two secrets to be configured in your GitHub repository:

### 1. CLOUDFLARE_API_TOKEN

This token allows GitHub Actions to deploy to your Cloudflare account.

**How to create:**

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Choose "Edit Cloudflare Workers" template, OR
4. Create a custom token with these permissions:
   - **Account** → **Cloudflare Pages** → **Edit**

**How to add to GitHub:**

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CLOUDFLARE_API_TOKEN`
5. Value: Paste your token
6. Click **Add secret**

### 2. CLOUDFLARE_ACCOUNT_ID

This is your Cloudflare account identifier.

**How to find:**

1. Log into Cloudflare dashboard
2. Look at the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`
3. Or go to any page in your Cloudflare dashboard and check the URL

**How to add to GitHub:**

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CLOUDFLARE_ACCOUNT_ID`
5. Value: Paste your account ID
6. Click **Add secret**

## Automatic Deployment

Once the secrets are configured, the workflow will automatically:

- **Deploy to production** when you push to `main` or `master` branch
- **Create preview deployments** for pull requests

The workflow is defined in `.github/workflows/deploy.yml`.

## Manual Deployment

You can also deploy manually using the Wrangler CLI:

```bash
# Install dependencies
npm ci

# Build the project
npm run build

# Deploy to Cloudflare Pages
npm run pages:deploy
```

Note: Manual deployment requires either:
- Running `npx wrangler login` first, OR
- Setting `CLOUDFLARE_API_TOKEN` environment variable

## Verification

To verify your deployment setup, run:

```bash
./verify-deployment-setup.sh
```

This will check that all required files are present and properly configured.

## Project Configuration

The project is configured with:

- **Project Name**: `asguardian-app`
- **Build Command**: `npm run build`
- **Build Output**: `dist/`
- **Framework**: Vite (React)

These settings are defined in:
- `wrangler.toml` - Cloudflare configuration
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `package.json` - Build scripts

## Troubleshooting

### Deployment fails with "Unauthorized"

- Verify `CLOUDFLARE_API_TOKEN` is set correctly
- Ensure the token has "Cloudflare Pages: Edit" permission
- Check token hasn't expired

### Deployment fails with "Account not found"

- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Check you're using the account ID, not the zone ID

### Build fails

- Check the build logs in GitHub Actions
- Verify the build works locally with `npm run build`
- Ensure all dependencies are in `package.json`

### Preview deployments not working

- Verify the workflow has `pull_request` trigger enabled
- Check the GitHub Actions permissions in repository settings

## Worker Deployment

The AI backend worker is deployed separately. See [worker/README.md](worker/README.md) for instructions on deploying the Gemini API worker.

## Environment Variables

The application uses these environment variables:

- `VITE_API_ENDPOINT` - URL of the Gemini API worker (set in workflow)

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages GitHub Action](https://github.com/cloudflare/pages-action)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
