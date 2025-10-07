#!/bin/bash

# Cloudflare Build Fix Script
# This fixes the npm ci and dependency version conflicts

echo "🔧 Fixing Cloudflare Build Issues..."

# Remove the problematic package-lock.json
rm -f package-lock.json

# Create a fresh lock file with legacy peer deps
npm install --legacy-peer-deps

# Test the build
echo "🧪 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for Cloudflare deployment."
    echo ""
    echo "📋 Updated Cloudflare Settings:"
    echo "Framework preset: Vite"
    echo "Build command: npm install --legacy-peer-deps && npm run build"
    echo "Build output directory: dist"
    echo ""
    echo "Environment Variables:"
    echo "NODE_VERSION=18.18.0"
    echo "NODE_ENV=production" 
    echo "NODE_OPTIONS=--max-old-space-size=4096"
    echo "SKIP_PREFLIGHT_CHECK=true"
    echo "NPM_FLAGS=--legacy-peer-deps"
    echo "CI=false"
else
    echo "❌ Build still failing. Check the error messages above."
fi