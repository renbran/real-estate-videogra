# 🚀 Railway Deployment - Quick Start Guide

## ✅ Pre-Deployment Checklist

Before deploying, make sure you have:
- [x] PostgreSQL migration script created
- [x] Backend configured to support both SQLite and PostgreSQL
- [x] JWT secrets generated
- [x] Railway configuration files created
- [x] Server updated to detect database type

## 📋 Step-by-Step Deployment (30 minutes)

### Step 1: Sign Up for Railway (2 minutes)
1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign in with GitHub account: **renbran**
4. Authorize Railway to access your repositories

### Step 2: Create New Project (3 minutes)
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: **renbran/real-estate-videogra**
4. Railway will detect the project structure

### Step 3: Add PostgreSQL Database (2 minutes)
1. In your project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Wait for provisioning (~30 seconds)
3. Note: `DATABASE_URL` is automatically set

### Step 4: Configure Backend Service (5 minutes)
1. Click on the backend service (if not auto-created, create it)
2. Go to **Settings** tab:
   - **Root Directory**: Leave empty (or set to `/`)
   - **Build Command**: `cd backend && npm ci`
   - **Start Command**: `cd backend && npm start`
   - **Watch Paths**: `/backend/**`

### Step 5: Set Environment Variables (8 minutes)
Click on your backend service → **Variables** tab → Add these:

```bash
# Node Environment
NODE_ENV=production
PORT=3001

# JWT Secrets (COPY THESE - Generated for you)
JWT_SECRET=b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77

JWT_REFRESH_SECRET=d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3

# CORS Configuration (GitHub Pages URL)
CORS_ORIGIN=https://renbran.github.io
FRONTEND_URL=https://renbran.github.io/real-estate-videogra

# Database (Auto-set by Railway - verify it exists)
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Important**: 
- The `DATABASE_URL` should reference your PostgreSQL service: `${{Postgres.DATABASE_URL}}`
- If the variable name is different, adjust accordingly (e.g., `${{PostgreSQL.DATABASE_URL}}`)

### Step 6: Deploy (3 minutes)
1. Click **"Deploy"** or push to GitHub:
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push origin main
   ```
2. Railway will automatically:
   - Install dependencies
   - Build the project
   - Start the server
3. Monitor the **Deployments** tab for progress

### Step 7: Run Database Migration (5 minutes)

**Option A: Using Railway CLI** (Recommended)
```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migration
railway run npm run migrate:postgres --dir backend
```

**Option B: Using Railway Dashboard**
1. Go to your backend service
2. Click **"Settings"** → **"Deploy Triggers"**
3. Temporarily update **Start Command** to:
   ```bash
   cd backend && npm run migrate:postgres && npm start
   ```
4. Trigger a redeploy
5. After successful migration, change back to:
   ```bash
   cd backend && npm start
   ```

### Step 8: Get Your Backend URL (1 minute)
1. Click on your backend service
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://real-estate-videogra-production.up.railway.app`)

### Step 9: Test Your Backend (3 minutes)

Test the health endpoint:
```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T...",
  "uptime": 123.456,
  "version": "2.0.0",
  "environment": "production",
  "database": "PostgreSQL (Production)",
  "memory": {
    "used": "45MB",
    "total": "512MB"
  }
}
```

Test auth endpoint:
```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osusproperties.com","password":"demo123"}'
```

## 🎯 Post-Deployment Steps

### Update Frontend Configuration

1. **Add GitHub Secret for Actions**:
   - Go to: https://github.com/renbran/real-estate-videogra/settings/secrets/actions
   - Click **"New repository secret"**
   - Name: `VITE_API_URL`
   - Value: `https://YOUR-RAILWAY-URL.up.railway.app/api`
   - Click **"Add secret"**

2. **Update Local Environment File**:
   ```bash
   # Update .env.production.local
   VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api
   NODE_ENV=production
   ```

3. **Commit and Deploy Frontend**:
   ```bash
   git add .env.production.local
   git commit -m "Update API URL to Railway backend"
   git push origin main
   ```

## 🔍 Monitoring & Troubleshooting

### Check Logs
- Go to Railway dashboard → Your service → **"Logs"** tab
- Look for startup messages and any errors

### Common Issues

**Issue**: Build fails with "Cannot find module"
- **Solution**: Check `backend/package.json` has all dependencies
- Run `npm install` locally to verify

**Issue**: Database connection fails
- **Solution**: Verify `DATABASE_URL` variable is set correctly
- Check PostgreSQL service is running
- Review database connection logs

**Issue**: CORS errors on frontend
- **Solution**: Verify `CORS_ORIGIN` includes your GitHub Pages URL
- Check for trailing slashes (remove them)
- Restart backend service after changing variables

**Issue**: Health check shows SQLite instead of PostgreSQL
- **Solution**: `DATABASE_URL` environment variable is not set
- Go to Variables tab and verify it's there
- Redeploy the service

## 📊 Railway Free Tier Limits

- ✅ **$5/month free credit** (enough for small apps)
- ✅ **500 hours of usage/month** (~20 days)
- ✅ **PostgreSQL database included**
- ⚠️ **Sleeps after 30 min inactivity** (free tier)
- 💡 **Upgrade to $5/mo** for no sleep & more resources

## 🎉 Success Indicators

You'll know deployment is successful when:
- ✅ Health endpoint returns `"database": "PostgreSQL (Production)"`
- ✅ Login with demo user works
- ✅ No CORS errors in browser console
- ✅ GitHub Pages can connect to backend
- ✅ Signup creates new users in PostgreSQL

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Check deployment logs** first for specific errors
- **Review this checklist** - most issues are config-related

---

**Your Generated Secrets** (Save these - needed for Step 5):
```
JWT_SECRET=b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77

JWT_REFRESH_SECRET=d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3
```

**Ready to deploy?** Follow the steps above! 🚀
