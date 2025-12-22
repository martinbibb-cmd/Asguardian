#!/bin/bash
# Deploy the Gemini API worker from root directory

echo "🚀 Deploying Asgardian Gemini Worker..."
echo ""

# Check if GEMINI_API_KEY secret is set
echo "📝 Note: Make sure you've set your GEMINI_API_KEY:"
echo "   npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml"
echo ""

# Deploy the worker
npx wrangler deploy worker/index.js --config worker/wrangler.toml

echo ""
echo "✅ Deployment complete!"
echo "🌐 Worker URL: https://asguard.martinbibb.workers.dev"
