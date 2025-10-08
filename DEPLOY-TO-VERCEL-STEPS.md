# 🚀 Deploy VideoPro to Vercel - Step by Step

## ✅ Pre-Deployment Status

Your VideoPro system is **production ready** with:
- ✅ Real authentication system (no demo accounts)
- ✅ Admin access: admin@videopro.com / AdminPass123!
- ✅ Google Maps integration
- ✅ Production database
- ✅ Build successful (dist/ directory created)
- ✅ All changes committed to GitHub

## 🎯 Deployment Strategy

Since you have a full-stack app, we'll deploy in two steps:
1. **Frontend** → Vercel 
2. **Backend** → Railway (or Vercel Functions)

## 📋 Step 1: Deploy Frontend to Vercel

### 1.1 Go to Vercel
- Visit: https://vercel.com/
- Login with your GitHub account
- Click "New Project"

### 1.2 Import GitHub Repository
- Click "Import" next to **renbran/real-estate-videogra**
- Click "Import" again to proceed

### 1.3 Configure Project Settings
```
Project Name: videography-booking (or your preferred name)
Framework Preset: Vite
Root Directory: ./ (leave as default)
Build Command: rm -rf node_modules package-lock.json && npm install --legacy-peer-deps && npm run build
Output Directory: dist
Install Command: npm install --legacy-peer-deps
```

### 1.4 Environment Variables
Add these in the "Environment Variables" section:

**Build Configuration:**
```
NODE_VERSION = 18
NODE_ENV = production
NODE_OPTIONS = --max-old-space-size=4096
NPM_CONFIG_LEGACY_PEER_DEPS = true
SKIP_PREFLIGHT_CHECK = true
CI = false
```

**App Configuration:**
```
REACT_APP_USE_PRODUCTION_API = true
REACT_APP_API_URL = https://BACKEND-URL-HERE/api
GOOGLE_MAPS_API_KEY = AIzaSyDNJ-Jl4d4KFTxTJP_g5WW3_K9pL9tOq0g
```

> **Note**: Leave REACT_APP_API_URL as placeholder for now. Update after backend deployment.

### 1.5 Deploy
- Click "Deploy"
- Wait for build to complete (3-5 minutes)
- You'll get a URL like: `https://videography-booking.vercel.app`

## 📋 Step 2: Deploy Backend

### Option A: Railway (Recommended)

#### 2.1 Create Railway Account
- Go to: https://railway.app/
- Sign up with GitHub
- Click "New Project"
- Select "Deploy from GitHub repo"

#### 2.2 Configure Railway Project
- Select repository: **renbran/real-estate-videogra**
- Click "Deploy Now"
- After deployment, go to "Settings"
- Set **Root Directory**: `backend`
- Click "Save"

#### 2.3 Add Environment Variables
In Railway dashboard, go to "Variables" and add:

```
NODE_ENV = production
PORT = 3001
JWT_SECRET = your-super-secure-jwt-secret-at-least-32-chars-long
BCRYPT_ROUNDS = 12
DATABASE_URL = file:./data/videography_booking.db
```

### Option B: Vercel Functions (Alternative)

Create `api/` folder in your project root and move backend endpoints there.
This requires refactoring your Express app to serverless functions.

## 📋 Step 3: Connect Frontend to Backend

### 3.1 Update Frontend Environment
- Go to Vercel dashboard
- Click on your project
- Go to "Settings" → "Environment Variables"
- Update: `REACT_APP_API_URL = https://your-railway-url.railway.app/api`
- Click "Save"

### 3.2 Redeploy Frontend
- Go to "Deployments" tab
- Click "Redeploy" on the latest deployment

## 🔧 Troubleshooting

### Build Failures

**Error: "Cannot find module @rollup/rollup-linux-x64-gnu"**
- ✅ **Root Cause**: Windows package-lock.json contains platform-specific dependencies
- ✅ **Solution**: Use build command: `rm -rf node_modules package-lock.json && npm install --legacy-peer-deps && npm run build`
- ✅ **Environment Variable**: `NPM_CONFIG_LEGACY_PEER_DEPS = true`

**Error: "npm ci requires package-lock.json"**
- ✅ **Solution**: Use install command: `npm install --legacy-peer-deps`
- ✅ **Build Command**: Remove lockfile first, then install and build

**Memory Issues:**
- ✅ **Solution**: Add `NODE_OPTIONS = --max-old-space-size=4096`

### Vercel-Specific Issues

**Build Command Override:**
```bash
rm -rf node_modules package-lock.json && npm install --legacy-peer-deps && npm run build
```

**Install Command Override:**
```bash
npm install --legacy-peer-deps
```

## 🎯 Step 4: Test Your Deployed App

### 4.1 Test Frontend
- Visit your Vercel URL
- You should see the login/registration forms
- UI should load completely

### 4.2 Test Backend (if using Railway)
- Visit: `https://your-railway-url.railway.app/health`
- Should return JSON with system status

### 4.3 Test Authentication
- Try registering a new account
- Try logging in with admin credentials:
  - Email: admin@videopro.com
  - Password: AdminPass123!

## 🎉 Expected Results

After successful deployment:

✅ **Frontend URL**: `https://your-app.vercel.app`  
✅ **Backend URL**: `https://your-backend.railway.app`  
✅ **Authentication**: Registration and login working  
✅ **Google Maps**: Address autocomplete working  
✅ **Admin Access**: Can login with admin credentials  
✅ **Database**: All user data persisted  

## 🌟 Optional: Custom Domain

In Vercel dashboard:
1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

---

**Your production VideoPro system is ready on Vercel!** 🚀

The deployment gives you a professional, scalable videography booking system with real authentication, Google Maps integration, and admin management capabilities.