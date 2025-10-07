#!/bin/bash

# CloudFlare Pages Deployment Helper Script
# This script helps troubleshoot and deploy to Cloudflare Pages

echo "🚀 Cloudflare Pages Deployment Helper"
echo "======================================"

# Check if build works locally first
echo "1. Testing local build..."
if npm run build; then
    echo "✅ Local build successful!"
    echo "   Build output is in dist/ folder"
    echo "   Size: $(du -sh dist/ | cut -f1)"
else
    echo "❌ Local build failed. Fix local issues first."
    exit 1
fi

echo ""
echo "2. Checking Node.js version..."
echo "   Current Node.js: $(node --version)"
echo "   Current NPM: $(npm --version)"

if [[ $(node --version) == v18* ]]; then
    echo "✅ Node.js 18 detected (compatible with Cloudflare)"
else
    echo "⚠️  Warning: You're not on Node.js 18. Cloudflare uses Node.js 18."
fi

echo ""
echo "3. Environment Variables for Cloudflare:"
echo "   Copy these to Cloudflare Pages → Environment Variables:"
echo ""
echo "   NODE_VERSION=18.18.0"
echo "   NODE_ENV=production"
echo "   NODE_OPTIONS=--max-old-space-size=4096"
echo "   SKIP_PREFLIGHT_CHECK=true"
echo "   NPM_FLAGS=--legacy-peer-deps"
echo "   CI=false"

echo ""
echo "4. Build Configuration for Cloudflare:"
echo "   Framework preset: Vite"
echo "   Build command: npm run build"
echo "   Build output directory: dist"

echo ""
echo "5. Alternative Build Command (if above fails):"
echo "   Framework preset: None"
echo "   Build command: npm install --legacy-peer-deps && npm run build"
echo "   Build output directory: dist"

echo ""
echo "6. Direct Upload Option:"
echo "   If builds keep failing, use Direct Upload:"
echo "   - Go to Cloudflare Pages"
echo "   - Choose 'Direct Upload'"
echo "   - Upload the dist/ folder that was just built"

echo ""
echo "✅ Local build completed successfully!"
echo "📝 Follow the instructions above for Cloudflare deployment"
echo "🔗 Need help? Check CLOUDFLARE-DEPLOYMENT-COMPLETE.md"