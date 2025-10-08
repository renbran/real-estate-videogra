#!/bin/bash

# Cloudflare Pages Deployment Script for VideoPro Production System
echo "🚀 Preparing VideoPro for Cloudflare Pages Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Build the project
echo "🔨 Building production frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check your code and dependencies."
    exit 1
fi

# Check if dist directory exists
if [ -d "dist" ]; then
    echo "✅ Build output directory 'dist' created successfully"
    echo "📁 Build output size:"
    du -sh dist/
else
    echo "❌ Build output directory 'dist' not found"
    exit 1
fi

# Verify _redirects file
if [ -f "public/_redirects" ]; then
    echo "✅ _redirects file found for SPA routing"
else
    echo "⚠️  Creating _redirects file for SPA routing..."
    mkdir -p public
    echo "/*    /index.html   200" > public/_redirects
    echo "✅ _redirects file created"
fi

# Check for environment variables file
if [ -f ".env.production" ]; then
    echo "✅ Production environment file found"
else
    echo "⚠️  Creating .env.production template..."
    cat > .env.production << EOL
# Production Environment Variables for Cloudflare Pages
NODE_ENV=production
REACT_APP_USE_PRODUCTION_API=true
REACT_APP_API_URL=https://your-backend-url.com/api
GOOGLE_MAPS_API_KEY=AIzaSyDNJ-Jl4d4KFTxTJP_g5WW3_K9pL9tOq0g
EOL
    echo "✅ .env.production template created"
fi

echo ""
echo "🎉 VideoPro is ready for Cloudflare Pages deployment!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://dash.cloudflare.com/pages"
echo "2. Create new project from your GitHub repository: renbran/real-estate-videogra"
echo "3. Use these build settings:"
echo "   - Framework preset: Vite"
echo "   - Build command: npm run build"
echo "   - Build output directory: dist"
echo ""
echo "4. Add these environment variables in Cloudflare Pages:"
echo "   NODE_VERSION=18"
echo "   NODE_ENV=production"
echo "   NODE_OPTIONS=--max-old-space-size=4096"
echo "   SKIP_PREFLIGHT_CHECK=true"
echo "   CI=false"
echo "   REACT_APP_USE_PRODUCTION_API=true"
echo "   REACT_APP_API_URL=https://your-backend-url.com/api"
echo "   GOOGLE_MAPS_API_KEY=AIzaSyDNJ-Jl4d4KFTxTJP_g5WW3_K9pL9tOq0g"
echo ""
echo "5. Deploy your backend separately (Railway, Vercel, Heroku)"
echo "6. Update REACT_APP_API_URL with your backend URL"
echo ""
echo "✅ Your production authentication system is ready to go live!"