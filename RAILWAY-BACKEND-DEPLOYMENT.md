# Railway Backend Deployment Guide for VideoPro

## 🚀 Quick Backend Deployment on Railway

Railway is the easiest way to deploy your Node.js backend with SQLite support.

### Step 1: Prepare Backend for Deployment

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select Repository**: `renbran/real-estate-videogra`

### Step 2: Configure Railway Project

1. **Set Root Directory**: 
   - Go to Settings → Service Settings
   - Set **Root Directory** to: `backend`

2. **Environment Variables** (Add in Railway dashboard):
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-super-secure-jwt-secret-min-32-characters-long
   BCRYPT_ROUNDS=12
   DATABASE_URL=file:./data/videography_booking.db
   CORS_ORIGIN=https://your-cloudflare-pages-domain.pages.dev
   ```

### Step 3: Database Setup

Since Railway supports SQLite, your existing database will work. Railway will:
- ✅ Keep your SQLite database file
- ✅ Maintain your admin account (admin@videopro.com)
- ✅ Keep all production settings

### Step 4: Build Configuration

Railway should auto-detect your Node.js app. If not, add a `railway.toml`:

```toml
[build]
  builder = "nixpacks"
  
[deploy]
  startCommand = "npm start"
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 10
```

### Step 5: Custom Start Script

Ensure your `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node server-simple.js",
    "dev": "nodemon server-simple.js"
  }
}
```

## 🔧 Alternative: Vercel Backend Deployment

If you prefer Vercel:

1. **Create New Project** on Vercel
2. **Import** your GitHub repository
3. **Settings**:
   - Root Directory: `backend`
   - Framework Preset: Other
   - Build Command: `npm install`
   - Output Directory: Leave empty
   - Install Command: `npm install`

4. **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-jwt-secret
   BCRYPT_ROUNDS=12
   ```

## 🗄️ Database Migration (If Needed)

If Railway doesn't work with SQLite, migrate to Turso (SQLite-compatible):

### Turso Setup
1. Sign up at https://turso.tech
2. Create database: `turso db create videography-prod`
3. Get URL: `turso db show videography-prod`
4. Update environment variable: `DATABASE_URL=your-turso-url`

### Schema Migration
```bash
# Export your current data
sqlite3 backend/data/videography_booking.db .dump > backup.sql

# Import to Turso (they provide tools for this)
```

## 🔐 CORS Configuration

Your backend needs to allow requests from Cloudflare Pages. Update `server-simple.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-app.pages.dev',           // Your Cloudflare Pages URL
    'https://videography.yourdomain.com',   // Your custom domain
    'http://localhost:5000',                // Local development
    'http://localhost:5001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 📋 Deployment Checklist

- [ ] Railway project created and configured
- [ ] Root directory set to `backend`
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Health check endpoint working: `https://your-backend.railway.app/health`
- [ ] Admin account accessible
- [ ] CORS configured for Cloudflare Pages

## 🎯 Expected Backend URL

After deployment, you'll get a URL like:
- Railway: `https://your-project-production.up.railway.app`
- Vercel: `https://your-project.vercel.app`

Use this URL to update your frontend's `REACT_APP_API_URL` environment variable.

## 🛠️ Testing Backend

Once deployed, test these endpoints:
- `GET /health` - Should return system status
- `POST /api/auth/login` - Test with admin credentials  
- `POST /api/auth/signup` - Test user registration
- `GET /api/bookings` - Test authenticated endpoints

Your production authentication system is ready for cloud deployment! 🚀