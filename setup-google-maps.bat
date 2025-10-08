@echo off
REM 🗺️ Google Maps API Setup Script for VideoPro (Windows)
REM Run this script to configure Google Maps integration

echo 🗺️ VideoPro Google Maps Setup
echo ==============================
echo.

REM Get API key from user
echo Please provide your Google Maps API key:
echo To get an API key:
echo 1. Go to Google Cloud Console: https://console.cloud.google.com
echo 2. Navigate to APIs ^& Services → Credentials
echo 3. Click 'Create Credentials' → 'API Key'
echo 4. Enable the following APIs:
echo    - Maps JavaScript API
echo    - Places API
echo    - Directions API
echo    - Geocoding API
echo.

set /p MAPS_API_KEY="Enter your Google Maps API Key: "

if "%MAPS_API_KEY%"=="" (
    echo ❌ No API key provided. Exiting...
    pause
    exit /b 1
)

echo.
echo 🔧 Configuring Google Maps integration...

REM Update index.html with the API key
powershell -Command "(Get-Content index.html) -replace 'YOUR_API_KEY_HERE', '%MAPS_API_KEY%' | Set-Content index.html"

REM Create environment configuration
echo # Google Maps Configuration > .env.google-maps
echo GOOGLE_MAPS_API_KEY=%MAPS_API_KEY% >> .env.google-maps
echo GOOGLE_MAPS_REGION=US >> .env.google-maps
echo GOOGLE_MAPS_LANGUAGE=en >> .env.google-maps

echo ✅ Google Maps API key configured successfully!
echo.
echo 📝 What was updated:
echo    - index.html: API key inserted
echo    - .env.google-maps: Environment config created
echo.
echo 🧪 To test the integration:
echo    1. Start the development server: npm run dev
echo    2. Open http://localhost:5000
echo    3. Try creating a booking and entering an address
echo    4. Check browser console for any API errors
echo.
echo 🔒 Security recommendations:
echo    - Restrict API key to your domain in Google Cloud Console
echo    - Set up API quotas and usage limits
echo    - Monitor API usage for billing
echo.
echo 📋 Enabled features:
echo    ✅ Address autocomplete in booking forms
echo    ✅ Address validation and formatting
echo    ✅ Route optimization for multiple bookings
echo    ✅ Distance calculations
echo    ✅ Geocoding for property locations
echo.

REM Test the API key (basic connectivity test)
echo 🔍 Testing API key connectivity...
curl -s -o nul -w "%%{http_code}" "https://maps.googleapis.com/maps/api/js?key=%MAPS_API_KEY%&libraries=places" > temp_status.txt
set /p HTTP_STATUS=<temp_status.txt
del temp_status.txt

if "%HTTP_STATUS%"=="200" (
    echo ✅ API key validation successful!
) else (
    echo ⚠️ API key validation returned status: %HTTP_STATUS%
    echo Please verify:
    echo    - API key is correct
    echo    - Maps JavaScript API is enabled
    echo    - Billing is set up in Google Cloud Console
)

echo.
echo 🎉 Setup complete! Restart your development server to see changes.
pause