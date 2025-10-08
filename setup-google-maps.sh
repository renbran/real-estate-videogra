#!/bin/bash

# 🗺️ Google Maps API Setup Script for VideoPro
# Run this script to configure Google Maps integration

echo "🗺️ VideoPro Google Maps Setup"
echo "=============================="
echo ""

# Get API key from user
echo "Please provide your Google Maps API key:"
echo "To get an API key:"
echo "1. Go to Google Cloud Console: https://console.cloud.google.com"
echo "2. Navigate to APIs & Services → Credentials"
echo "3. Click 'Create Credentials' → 'API Key'"
echo "4. Enable the following APIs:"
echo "   - Maps JavaScript API"
echo "   - Places API"
echo "   - Directions API"
echo "   - Geocoding API"
echo ""

read -p "Enter your Google Maps API Key: " MAPS_API_KEY

if [ -z "$MAPS_API_KEY" ]; then
    echo "❌ No API key provided. Exiting..."
    exit 1
fi

# Validate API key format (basic check)
if [[ ! "$MAPS_API_KEY" =~ ^AIza[0-9A-Za-z_-]{35}$ ]]; then
    echo "⚠️ Warning: API key format doesn't match expected Google Maps key format"
    echo "Expected format: AIza... (39 characters total)"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔧 Configuring Google Maps integration..."

# Update index.html with the API key
sed -i "s/YOUR_API_KEY_HERE/$MAPS_API_KEY/g" index.html

# Create environment configuration
cat > .env.google-maps << EOF
# Google Maps Configuration
GOOGLE_MAPS_API_KEY=$MAPS_API_KEY
GOOGLE_MAPS_REGION=US
GOOGLE_MAPS_LANGUAGE=en
EOF

echo "✅ Google Maps API key configured successfully!"
echo ""
echo "📝 What was updated:"
echo "   - index.html: API key inserted"
echo "   - .env.google-maps: Environment config created"
echo ""
echo "🧪 To test the integration:"
echo "   1. Start the development server: npm run dev"
echo "   2. Open http://localhost:5000"
echo "   3. Try creating a booking and entering an address"
echo "   4. Check browser console for any API errors"
echo ""
echo "🔒 Security recommendations:"
echo "   - Restrict API key to your domain in Google Cloud Console"
echo "   - Set up API quotas and usage limits"
echo "   - Monitor API usage for billing"
echo ""
echo "📋 Enabled features:"
echo "   ✅ Address autocomplete in booking forms"
echo "   ✅ Address validation and formatting"
echo "   ✅ Route optimization for multiple bookings"
echo "   ✅ Distance calculations"
echo "   ✅ Geocoding for property locations"
echo ""

# Test the API key (basic connectivity test)
echo "🔍 Testing API key connectivity..."
TEST_URL="https://maps.googleapis.com/maps/api/js?key=$MAPS_API_KEY&libraries=places"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API key validation successful!"
else
    echo "⚠️ API key validation returned status: $HTTP_STATUS"
    echo "Please verify:"
    echo "   - API key is correct"
    echo "   - Maps JavaScript API is enabled"
    echo "   - Billing is set up in Google Cloud Console"
fi

echo ""
echo "🎉 Setup complete! Restart your development server to see changes."