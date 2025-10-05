# Google Maps API Setup Guide

## Overview

This VideoPro application integrates with Google Maps APIs to provide address validation, route optimization, and map visualization features. Follow this guide to set up the required Google Maps API key and configure the necessary services.

## Required Google Cloud APIs

The application uses these Google Maps Platform APIs:
- **Places API** - For address autocomplete and validation
- **Directions API** - For route optimization calculations
- **Maps JavaScript API** - For interactive map visualization
- **Geocoding API** - For address coordinate conversion

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for reference

### 2. Enable Required APIs

In the Google Cloud Console:
1. Navigate to "APIs & Services" > "Library"
2. Search for and enable each of these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API

### 3. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. **Important**: Restrict the API key for security

### 4. Configure API Key Restrictions

For security, restrict your API key:

**HTTP referrers (recommended for web apps):**
- Add your domain(s): `localhost:*`, `yourdomain.com/*`
- For development: `localhost:*`, `127.0.0.1:*`

**API restrictions:**
- Restrict key to only the APIs you're using:
  - Maps JavaScript API
  - Places API  
  - Directions API
  - Geocoding API

### 5. Set Up Billing

Google Maps APIs require billing to be enabled:
1. Go to "Billing" in Google Cloud Console
2. Link a billing account to your project
3. Review pricing for each API
4. Consider setting up billing alerts

## Application Configuration

### 1. Add API Key to Application

Open `index.html` and replace the placeholder:

```html
<script>
  // Replace YOUR_API_KEY_HERE with your actual API key
  window.GOOGLE_MAPS_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
</script>
```

### 2. Optional Configuration

You can customize the Google Maps configuration:

```html
<script>
  window.GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';
  
  // Optional: Configure additional settings
  window.GOOGLE_MAPS_CONFIG = {
    libraries: ['places', 'directions', 'geometry'],
    region: 'US',        // Bias results to specific region
    language: 'en'       // Set language for API responses
  };
</script>
```

## Features Enabled by Google Maps Integration

### 1. Address Validation & Autocomplete
- Real-time address suggestions as users type
- Automatic validation of property addresses
- Geocoding for latitude/longitude coordinates
- Formatted address standardization

### 2. Batch Address Validation
- Manager can validate multiple addresses at once
- Progress tracking for large datasets
- Error handling for invalid addresses
- Geographic zone assignment

### 3. Route Optimization
- Calculate optimal routes between multiple properties
- Traffic-aware routing with real-time data
- Travel time and distance calculations
- Visual route display on maps

### 4. Interactive Map Visualization
- Property locations displayed on interactive maps
- Color-coded markers by shoot complexity
- Optimized route paths shown as overlays
- Click-to-view property details

## API Usage and Costs

### Pricing Overview (as of 2024)
- **Maps JavaScript API**: ~$7 per 1,000 loads
- **Places API**: ~$17 per 1,000 requests (Address Validation)
- **Directions API**: ~$5 per 1,000 requests
- **Geocoding API**: ~$5 per 1,000 requests

### Free Tier
- Google provides $200 monthly credit
- This covers moderate usage for most applications
- Monitor usage in Google Cloud Console

### Cost Optimization Tips
1. **Implement caching** - Store validated addresses to avoid repeat API calls
2. **Batch operations** - Group multiple addresses when possible
3. **Use address validation sparingly** - Only validate when needed
4. **Monitor usage** - Set up billing alerts in Google Cloud Console

## Testing Your Setup

### 1. Check Browser Console
With the application running, open browser dev tools:
- Look for "✅ Google Maps API loaded successfully" message
- Check for any error messages related to API key or permissions

### 2. Test Address Validation
1. Go to agent booking form
2. Start typing an address in the property address field  
3. Verify autocomplete suggestions appear
4. Select an address and confirm validation checkmark appears

### 3. Test Route Optimization
1. Log in as a manager
2. Go to "Route Optimization" tab
3. Select a date with multiple approved bookings
4. Click "Optimize Route" button
5. Verify the map shows optimized route and travel time

## Troubleshooting

### Common Issues

**API Key Issues:**
- Error: "This API key is not authorized to use this service"
  - Solution: Enable required APIs in Google Cloud Console
  - Check API key restrictions

**Billing Issues:**
- Error: "This API project is not authorized to use this API"
  - Solution: Enable billing on your Google Cloud project

**CORS/Domain Issues:**
- Error: "RefererNotAllowedMapError"
  - Solution: Add your domain to API key HTTP referrer restrictions

**Rate Limiting:**
- Error: "You have exceeded your rate-limit for this API"
  - Solution: Implement request caching and reduce API call frequency

### Debug Mode

Enable debug logging in browser console:
```javascript
// Add this to browser console for detailed logging
localStorage.setItem('google-maps-debug', 'true');
```

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables in production**
3. **Restrict API keys to specific domains/IPs**
4. **Monitor API usage regularly**
5. **Rotate API keys periodically**
6. **Set up billing alerts to prevent unexpected charges**

## Production Deployment

For production deployment:

1. **Use environment variables:**
   ```bash
   GOOGLE_MAPS_API_KEY=your_production_key_here
   ```

2. **Update domain restrictions** to include production domain

3. **Set up monitoring** for API usage and errors

4. **Configure rate limiting** if handling high traffic

5. **Consider using different API keys** for different environments

## Support and Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Google Cloud Support](https://cloud.google.com/support)
- [Stack Overflow - Google Maps API](https://stackoverflow.com/questions/tagged/google-maps-api-3)

## Need Help?

If you encounter issues setting up Google Maps integration:
1. Check the browser console for error messages
2. Verify API key configuration in Google Cloud Console
3. Ensure billing is enabled and APIs are activated
4. Review the troubleshooting section above
5. Consult Google Maps Platform documentation for specific error codes