# Gmail OAuth Setup Guide

## For Production Use

To enable Gmail/Google OAuth signup in production, follow these steps:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google Identity API:
   - Go to APIs & Services > Library
   - Search for "Google Identity API" 
   - Click Enable

### 2. Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Configure OAuth consent screen if prompted
4. Set Application Type to "Web application"
5. Add Authorized JavaScript origins:
   - `https://yourdomain.com`
   - `http://localhost:5173` (for development)
6. Add Authorized redirect URIs:
   - `https://yourdomain.com`
   - `http://localhost:5173` (for development)

### 3. Environment Configuration

Add to your `.env` file:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4. Domain Verification (Optional)

For production domains, verify your domain in Google Search Console to remove the "unverified app" warning.

## Development Mode

In development mode (current setup), the Gmail signup uses a mock service that:
- Simulates Google OAuth flow
- Generates random Gmail addresses
- Creates test users automatically
- No actual Google API calls are made

## Features Implemented

✅ **Gmail Signup Button** - Prominent Google-branded signup option
✅ **Mock Authentication** - Working demo in development
✅ **User Data Extraction** - Handles Google profile data
✅ **OSUS Integration** - Auto-assigns users to OSUS Real Estate Brokerage
✅ **Skip Email Verification** - Gmail users bypass email verification (already verified by Google)
✅ **Responsive Design** - Works on all device sizes
✅ **Loading States** - Professional loading animations
✅ **Error Handling** - Graceful error management

## Testing

In development mode, click "Continue with Gmail" to simulate:
1. Google OAuth popup/redirect
2. User grants permissions
3. Profile data extraction
4. Automatic OSUS account creation
5. Immediate login to dashboard

The mock service generates realistic test data for demonstration purposes.