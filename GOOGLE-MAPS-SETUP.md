# 🗺️ Google Maps API Integration Guide

## Quick Setup

Based on your Google Cloud project (`macro-gadget-473816-a6`), here's how to get your Google Maps API key:

### Step 1: Get Your Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: `macro-gadget-473816-a6`
3. **Navigate to**: APIs & Services → Credentials
4. **Create API Key**:
   - Click "Create Credentials" → "API Key"
   - Copy the generated key (starts with `AIza...`)

### Step 2: Enable Required APIs

In the same Google Cloud project, enable these APIs:
- ✅ Maps JavaScript API
- ✅ Places API  
- ✅ Directions API
- ✅ Geocoding API

**Navigation**: APIs & Services → Library → Search and enable each API

### Step 3: Configure the Application

Choose one of these methods:

#### Method A: Use Setup Script (Recommended)
```bash
# Windows
setup-google-maps.bat

# Linux/macOS  
chmod +x setup-google-maps.sh
./setup-google-maps.sh
```

#### Method B: Manual Configuration
1. **Edit `index.html`**:
   ```html
   <!-- Replace YOUR_API_KEY_HERE with your actual key -->
   window.GOOGLE_MAPS_API_KEY = 'AIza...your-actual-key...';
   ```

2. **Create `.env.google-maps`**:
   ```env
   GOOGLE_MAPS_API_KEY=AIza...your-actual-key...
   GOOGLE_MAPS_REGION=US
   GOOGLE_MAPS_LANGUAGE=en
   ```

## What Google Maps Enables

### 🏠 Property Location Features
- **Address Autocomplete**: Smart address suggestions as you type
- **Address Validation**: Ensures addresses are real and properly formatted  
- **Geocoding**: Converts addresses to coordinates for mapping

### 📍 Booking Management
- **Route Optimization**: Plan efficient travel routes for multiple bookings
- **Distance Calculations**: Estimate travel time between properties
- **Location Mapping**: Visual representation of booking locations

### 🚗 Videographer Features  
- **Daily Route Planning**: Optimize travel between multiple shoots
- **Travel Time Estimates**: Better scheduling with accurate travel times
- **Location Clustering**: Group nearby bookings for efficiency

## Security & Cost Management

### 🔒 Secure Your API Key
1. **Restrict by Domain**:
   - In Google Cloud Console → Credentials
   - Edit your API key
   - Add HTTP referrers: `localhost:*`, `your-domain.com/*`

2. **Set Usage Quotas**:
   - Prevent unexpected charges
   - Set daily limits for each API

### 💰 Cost Optimization
- **Free Tier**: $200/month credit for Maps usage
- **Typical Usage**: Small real estate business ~$10-50/month
- **Monitor Usage**: Set up billing alerts

## Testing the Integration

### 1. Start the Application
```bash
# Development
npm run dev

# Docker
docker-compose up
```

### 2. Test Address Features
1. Go to "Create Booking"
2. Start typing an address in the location field
3. You should see autocomplete suggestions
4. Verify the address formats correctly

### 3. Check Browser Console
- No API key errors
- Maps services loading successfully
- Address validation working

## Troubleshooting

### Common Issues

#### ❌ "This page can't load Google Maps correctly"
- **Solution**: Check API key is correct and Maps JavaScript API is enabled

#### ❌ "Geocoder failed due to: REQUEST_DENIED"  
- **Solution**: Enable Geocoding API in Google Cloud Console

#### ❌ "Places service failed: REQUEST_DENIED"
- **Solution**: Enable Places API and check API key restrictions

#### ❌ No autocomplete suggestions
- **Solution**: Verify Places API is enabled and working

### Debug Checklist
- [ ] API key format: `AIza...` (39 characters)
- [ ] All required APIs enabled
- [ ] Billing account set up
- [ ] API key restrictions configured
- [ ] Browser console shows no errors

## Advanced Configuration

### Custom Map Styling
Edit the configuration in `index.html`:
```javascript
window.GOOGLE_MAPS_CONFIG = {
  libraries: ['places', 'directions', 'geometry'],
  region: 'US',        // Your country code
  language: 'en',      // Your language
  // Add custom styling options
};
```

### Multiple Regions
For international usage, update the region and language settings to match your primary market.

## Need Help?

1. **Check API quotas**: Google Cloud Console → APIs & Services → Quotas
2. **View usage**: Google Cloud Console → APIs & Services → Dashboard  
3. **Monitor costs**: Google Cloud Console → Billing

---

**🎯 Goal**: Enable powerful location features that make VideoPro the most efficient real estate videography booking platform!