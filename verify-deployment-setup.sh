#!/bin/bash
# Verify Cloudflare Pages deployment setup

echo "🔍 Verifying Cloudflare Pages Deployment Setup"
echo "=============================================="
echo ""

# Check for required files
echo "📁 Checking required files..."
REQUIRED_FILES=(
    ".github/workflows/deploy.yml"
    "package.json"
    "vite.config.js"
    "wrangler.toml"
)

ALL_FILES_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file is missing"
        ALL_FILES_PRESENT=false
    fi
done
echo ""

# Check workflow file for required secrets
echo "🔐 Checking GitHub Actions workflow configuration..."
WORKFLOW_FILE=".github/workflows/deploy.yml"
if [ -f "$WORKFLOW_FILE" ]; then
    if grep -q "CLOUDFLARE_API_TOKEN" "$WORKFLOW_FILE"; then
        echo "  ✓ CLOUDFLARE_API_TOKEN is referenced in workflow"
    else
        echo "  ✗ CLOUDFLARE_API_TOKEN is NOT referenced in workflow"
    fi
    
    if grep -q "CLOUDFLARE_ACCOUNT_ID" "$WORKFLOW_FILE"; then
        echo "  ✓ CLOUDFLARE_ACCOUNT_ID is referenced in workflow"
    else
        echo "  ✗ CLOUDFLARE_ACCOUNT_ID is NOT referenced in workflow"
    fi
    
    if grep -q "projectName: asguardian-app" "$WORKFLOW_FILE"; then
        echo "  ✓ Project name is set to 'asguardian-app'"
    else
        echo "  ⚠ Project name may need verification"
    fi
fi
echo ""

# Check if dependencies can be installed
echo "📦 Checking if dependencies are installable..."
if [ -f "package.json" ]; then
    if npm ls >/dev/null 2>&1; then
        echo "  ✓ Dependencies are installed"
    else
        echo "  ℹ Run 'npm ci' to install dependencies"
    fi
fi
echo ""

# Check if project builds
echo "🏗️  Checking if project builds..."
if [ -d "dist" ]; then
    echo "  ✓ Build output directory exists"
else
    echo "  ℹ Run 'npm run build' to create build output"
fi
echo ""

# Summary and next steps
echo "=============================================="
echo "📋 SETUP CHECKLIST"
echo "=============================================="
echo ""
echo "In your GitHub repository, you need to add these secrets:"
echo ""
echo "1. CLOUDFLARE_API_TOKEN"
echo "   - Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "   - Create token with 'Edit Cloudflare Workers' template"
echo "   - Or use custom token with 'Account:Cloudflare Pages:Edit' permission"
echo ""
echo "2. CLOUDFLARE_ACCOUNT_ID"
echo "   - Find in Cloudflare dashboard URL"
echo "   - Or in Account Settings"
echo ""
echo "To add secrets to GitHub:"
echo "  Repository → Settings → Secrets and variables → Actions"
echo "  → New repository secret"
echo ""
echo "Once secrets are added, the workflow will automatically:"
echo "  - Deploy to Cloudflare Pages on push to main/master"
echo "  - Create preview deployments for pull requests"
echo ""
echo "✅ Verification complete!"
