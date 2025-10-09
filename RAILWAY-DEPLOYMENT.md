# Railway Backend Deployment Guide

## Prerequisites
- GitHub account (you have: renbran)
- Railway account (sign up at https://railway.app)

## Step 1: Sign Up for Railway (2 minutes)

1. Go to https://railway.app
2. Click **"Start a New Project"** or **"Login"**
3. Sign in with your GitHub account (@renbran)
4. Verify your email if prompted

## Step 2: Create New Project (5 minutes)

### Option A: Deploy from GitHub (Recommended)

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your repositories
4. Select repository: **renbran/real-estate-videogra**
5. Railway will detect it's a monorepo

### Option B: Deploy from Local (If GitHub fails)

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```
2. Login to Railway:
   ```bash
   railway login
   ```
3. Initialize project:
   ```bash
   railway init
   ```

## Step 3: Configure Backend Service (10 minutes)

1. **Set Root Directory**:
   - Click on the service
   - Go to **Settings** → **Service**
   - Set **Root Directory**: `/backend`
   - Set **Start Command**: `node server-production.js`

2. **Add PostgreSQL Database**:
   - Click **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically provision a PostgreSQL database
   - The `DATABASE_URL` environment variable will be auto-generated

3. **Configure Environment Variables**:
   - Click on your backend service
   - Go to **Variables** tab
   - Add these variables:

   ```env
   NODE_ENV=production
   PORT=3001
   
   # JWT Secrets (IMPORTANT: Generate new 64-character secrets)
   JWT_SECRET=<GENERATE_NEW_SECRET>
   JWT_REFRESH_SECRET=<GENERATE_NEW_SECRET>
   
   # CORS Configuration
   CORS_ORIGIN=https://renbran.github.io
   
   # Database (auto-set by Railway, verify it exists)
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

4. **Generate JWT Secrets**:
   Run this command to generate secure secrets:
   ```bash
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   ```

## Step 4: Update Backend for PostgreSQL (15 minutes)

The backend currently uses SQLite for development. We need to ensure it switches to PostgreSQL in production.

### Files to Check/Update:

1. **backend/config/database.js** - Should detect DATABASE_URL and use PostgreSQL
2. **backend/server-production.js** - Should load the correct database config

### Create PostgreSQL Migration Script:

We need to create a PostgreSQL migration similar to the SQLite one:

```bash
cd backend/scripts
```

Create `migrate-postgres.js` (I'll create this for you)

## Step 5: Deploy Backend (10 minutes)

1. **Push to GitHub** (if using GitHub deployment):
   ```bash
   git add .
   git commit -m "Configure Railway deployment"
   git push origin main
   ```

2. **Railway will automatically**:
   - Detect the backend folder
   - Install dependencies (`npm install`)
   - Run the start command (`node server-production.js`)
   - Assign a public URL (e.g., `https://real-estate-videogra-backend.up.railway.app`)

3. **Monitor Deployment**:
   - Watch the **Deployments** tab for build progress
   - Check **Logs** for any errors
   - Wait for status to show **"Active"**

## Step 6: Run Database Migration (5 minutes)

After the first deployment succeeds:

1. **Option A: Use Railway CLI**:
   ```bash
   railway run node scripts/migrate-postgres.js
   ```

2. **Option B: Add to package.json scripts**:
   Update `backend/package.json`:
   ```json
   "scripts": {
     "postinstall": "node scripts/migrate-postgres.js || true"
   }
   ```
   Then redeploy.

## Step 7: Verify Deployment (5 minutes)

1. **Copy your Railway URL** (from the service page)
   - Format: `https://your-service.up.railway.app`

2. **Test Health Endpoint**:
   ```bash
   curl https://your-service.up.railway.app/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "database": "PostgreSQL (Production)"
   }
   ```

3. **Test Auth Endpoint**:
   ```bash
   curl https://your-service.up.railway.app/api/auth/health
   ```

## Step 8: Update Frontend Configuration (5 minutes)

Once you have the Railway URL:

1. **Update GitHub Secret**:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add `VITE_API_URL` = `https://your-service.up.railway.app/api`

2. **Update Local .env.production.local**:
   ```env
   VITE_API_URL=https://your-service.up.railway.app/api
   NODE_ENV=production
   ```

3. **Rebuild and redeploy frontend**:
   ```bash
   git add .env.production.local
   git commit -m "Update API URL to Railway backend"
   git push origin main
   ```

## Troubleshooting

### Build Fails
- Check **Logs** in Railway dashboard
- Verify `package.json` has all dependencies
- Ensure `server-production.js` exists

### Database Connection Fails
- Verify PostgreSQL service is running
- Check `DATABASE_URL` variable exists
- Review database migration logs

### CORS Errors
- Verify `CORS_ORIGIN` includes GitHub Pages URL
- Check backend logs for CORS-related errors
- Ensure URL format is correct (no trailing slash)

### Server Won't Start
- Check `PORT` environment variable
- Verify start command: `node server-production.js`
- Review server logs for errors

## Cost Estimate

Railway Free Tier:
- ✅ $5/month free credit
- ✅ Covers small apps with PostgreSQL
- ✅ No credit card required to start
- ⚠️ May need upgrade for high traffic

## Next Steps

After successful deployment:
1. ✅ Copy Railway backend URL
2. ✅ Update frontend environment variables
3. ✅ Test complete authentication flow
4. ✅ Monitor logs for 24 hours
5. ✅ Set up Railway notifications for downtime alerts

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check deployment logs first for specific errors
