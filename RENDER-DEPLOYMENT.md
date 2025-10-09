# 🎯 Render.com Deployment Guide - Step by Step

**Platform**: Render.com (Free Tier)  
**Time**: 15-20 minutes  
**Cost**: $0 (PostgreSQL free for 90 days)  
**Difficulty**: Easy ⭐⭐

---

## ✅ Prerequisites

- GitHub account: @renbran ✅
- Code pushed to GitHub ✅
- No credit card required ✅

---

## 🚀 Step 1: Sign Up for Render (2 minutes)

1. Go to https://render.com
2. Click **"Get Started"**
3. Select **"Sign in with GitHub"**
4. Authorize Render to access your repositories
5. Complete profile setup

---

## 🗄️ Step 2: Create PostgreSQL Database (3 minutes)

1. **Click "New +"** in the top-right corner
2. Select **"PostgreSQL"**

3. **Configure Database:**
   - **Name**: `osus-videography-db`
   - **Database**: `osus_db`
   - **User**: `osus_user`
   - **Region**: **Oregon (US West)** ⚠️ Important: Choose closest to your users
   - **Plan**: **Free**

4. Click **"Create Database"**

5. **Wait 30-60 seconds** for database to provision

6. **Copy Connection Strings:**
   - Find **"Internal Database URL"** (starts with `postgresql://`)
   - Keep this tab open - you'll need it in Step 4

   Example:
   ```
   postgresql://osus_user:xxxxx@dpg-xxxxx-oregon-postgres.render.com/osus_db
   ```

---

## 🌐 Step 3: Create Web Service (5 minutes)

1. **Click "New +"** again
2. Select **"Web Service"**

3. **Connect Repository:**
   - Select **"Build and deploy from a Git repository"**
   - Click **"Connect account"** if needed
   - Find and select: **renbran/real-estate-videogra**
   - Click **"Connect"**

4. **Configure Service:**
   
   **Basic Settings:**
   - **Name**: `osus-videography-backend`
   - **Region**: **Oregon (US West)** ⚠️ Same as database!
   - **Branch**: `main`
   - **Root Directory**: `backend`
   
   **Build Settings:**
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `npm run migrate:postgres && npm start`
   
   **Plan:**
   - Select: **Free** ($0/month)

5. **Don't click "Create Web Service" yet** - we need to add environment variables first!

---

## 🔐 Step 4: Add Environment Variables (5 minutes)

Scroll down to **"Environment Variables"** section:

Click **"Add Environment Variable"** for each of these:

### Variable 1: NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`

### Variable 2: PORT
- **Key**: `PORT`
- **Value**: `10000`

### Variable 3: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Paste the **Internal Database URL** from Step 2
  
  Example:
  ```
  postgresql://osus_user:xxxxx@dpg-xxxxx-oregon-postgres.render.com/osus_db
  ```

### Variable 4: JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: 
  ```
  b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77
  ```

### Variable 5: JWT_REFRESH_SECRET
- **Key**: `JWT_REFRESH_SECRET`
- **Value**: 
  ```
  d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3
  ```

### Variable 6: CORS_ORIGIN
- **Key**: `CORS_ORIGIN`
- **Value**: `https://renbran.github.io`

### Variable 7: FRONTEND_URL
- **Key**: `FRONTEND_URL`
- **Value**: `https://renbran.github.io/real-estate-videogra`

---

## 🚀 Step 5: Deploy (3 minutes)

1. **Review all settings**
   - Root Directory: `backend` ✅
   - Build Command: `npm install` ✅
   - Start Command: `npm run migrate:postgres && npm start` ✅
   - All 7 environment variables added ✅

2. **Click "Create Web Service"**

3. **Monitor Deployment:**
   - You'll see the **Logs** tab automatically
   - Watch for:
     ```
     ==> Cloning from https://github.com/renbran/real-estate-videogra...
     ==> Installing packages...
     ==> Starting migration...
     ==> Server started on port 10000
     ```

4. **Wait for deployment** (3-5 minutes for first build)
   - Status will change from "Deploying" to "Live"
   - Green "Live" indicator means success! ✅

---

## 🔗 Step 6: Get Your Backend URL (1 minute)

1. **Find your URL** at the top of the page
   - Format: `https://osus-videography-backend.onrender.com`
   - Or: `https://osus-videography-backend-xxxx.onrender.com`

2. **Copy the full URL** - you'll need it for GitHub Pages

---

## 🧪 Step 7: Test Your Backend (2 minutes)

### Test 1: Health Check

Open a new terminal and run:

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T...",
  "database": "PostgreSQL (Production)",
  "environment": "production"
}
```

✅ If you see `"database": "PostgreSQL (Production)"` - SUCCESS!

### Test 2: Login with Demo User

```bash
curl https://YOUR-RENDER-URL.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osusproperties.com","password":"demo123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

✅ If you get tokens - SUCCESS!

---

## 🌐 Step 8: Update GitHub Pages Configuration (3 minutes)

### Update GitHub Secret:

1. Go to: https://github.com/renbran/real-estate-videogra/settings/secrets/actions

2. Find `VITE_API_URL` or click **"New repository secret"**

3. **Set:**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://YOUR-RENDER-URL.onrender.com/api`
   
   Example:
   ```
   https://osus-videography-backend.onrender.com/api
   ```

4. Click **"Add secret"** or **"Update secret"**

---

## 🔄 Step 9: Trigger Frontend Redeploy (2 minutes)

### Option A: Make a small commit
```bash
cd '/d/Booking System/real-estate-videogra'
git commit --allow-empty -m "Update API URL to Render backend"
git push origin main
```

### Option B: Manually trigger GitHub Actions
1. Go to: https://github.com/renbran/real-estate-videogra/actions
2. Click on **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"**
4. Select branch: `main`
5. Click **"Run workflow"**

**Wait 2-3 minutes** for deployment to complete

---

## ✅ Step 10: Verify Everything Works (3 minutes)

1. **Open your live app:**
   - https://renbran.github.io/real-estate-videogra/

2. **Test Signup:**
   - Click **"Sign Up"**
   - Create a test account
   - Verify account creation succeeds ✅

3. **Test Login:**
   - Login with demo user:
     - Email: `admin@osusproperties.com`
     - Password: `demo123`
   - Verify you reach the dashboard ✅

4. **Check Browser Console:**
   - Press F12 → Console tab
   - Verify no CORS errors ✅
   - Check Network tab for API calls ✅

---

## 🎉 SUCCESS INDICATORS

Your deployment is successful when:

- ✅ Render service shows **"Live"** status
- ✅ Health endpoint returns `"database": "PostgreSQL (Production)"`
- ✅ Demo login returns access token
- ✅ GitHub Pages loads without 404 errors
- ✅ Signup creates new users
- ✅ Login works with demo and new accounts
- ✅ No CORS errors in browser console
- ✅ Dashboard loads correctly

---

## ⚙️ Understanding Render Free Tier

### What Happens:
- **Your service sleeps** after 15 minutes of inactivity
- **Wake-up time**: 30-60 seconds on first request
- **No data loss** - database stays active

### User Experience:
- First user after idle period: 30-60 sec wait
- Subsequent users: Normal speed
- During business hours: Usually stays awake

### Solution: Keep-Alive Service (Optional)

Use free uptime monitoring to ping your service:

**Option 1: UptimeRobot** (Free)
1. Sign up at https://uptimerobot.com
2. Add monitor:
   - URL: `https://YOUR-RENDER-URL.onrender.com/health`
   - Interval: 10 minutes
   - Monitor Type: HTTP(s)

**Option 2: Cron-job.org** (Free)
1. Sign up at https://cron-job.org
2. Create job:
   - URL: `https://YOUR-RENDER-URL.onrender.com/health`
   - Interval: Every 10 minutes
   - Only during business hours: 8 AM - 8 PM

---

## 🔧 Auto-Deploy from GitHub

Render automatically deploys when you push to main branch!

**To trigger manual deployment:**
1. Go to Render dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 Monitoring Your Service

### View Logs:
1. Go to Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. See real-time logs of your app

### View Metrics:
1. Click **"Metrics"** tab
2. See:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Set Up Notifications:
1. Go to **Settings** → **Notifications**
2. Add your email
3. Get notified about:
   - Deployment failures
   - Service crashes
   - Downtime

---

## 🆘 Troubleshooting

### Issue: Build Fails
**Check:**
- Logs in Render dashboard
- Verify `backend/package.json` exists
- Check for syntax errors in code

**Solution:**
```bash
# Test build locally
cd backend
npm install
npm start
```

### Issue: Database Connection Fails
**Check:**
- DATABASE_URL is set correctly
- Database is in same region as service
- Internal Database URL used (not External)

**Solution:**
1. Go to database dashboard
2. Copy **Internal Database URL** again
3. Update DATABASE_URL in service
4. Trigger manual deploy

### Issue: Service Shows "Deploy failed"
**Check:**
- Start command is correct
- All dependencies in package.json
- Node version compatibility

**Solution:**
- Check logs for specific error
- Verify start command: `npm run migrate:postgres && npm start`

### Issue: Migration Fails
**Check:**
- DATABASE_URL is accessible
- Migration script has no syntax errors

**Solution:**
1. Remove `npm run migrate:postgres &&` from start command
2. Deploy successfully
3. Run migration manually via Render shell:
   - Click **"Shell"** tab
   - Run: `npm run migrate:postgres`
4. Add migration back to start command

### Issue: CORS Errors
**Check:**
- CORS_ORIGIN in Render environment variables
- No trailing slash in CORS_ORIGIN

**Solution:**
- CORS_ORIGIN should be: `https://renbran.github.io`
- NOT: `https://renbran.github.io/`
- Redeploy after changing

---

## 💰 Cost After 90 Days

### PostgreSQL Database:
- **First 90 days**: FREE ✅
- **After 90 days**: $7/month

### Options to Stay Free:
1. **Migrate to Supabase PostgreSQL** (free forever)
2. **Use Fly.io Postgres** (free, 3GB)
3. **Use PlanetScale** (free tier, MySQL)

I'll help you migrate when the time comes! 📅

---

## 📞 Get Help

**Render Resources:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Status: https://status.render.com
- Community: https://community.render.com

**Your Service URLs:**
- Backend: `https://YOUR-SERVICE-NAME.onrender.com`
- Database: Available in Render dashboard
- Frontend: https://renbran.github.io/real-estate-videogra/

---

## 🎯 Next Steps After Deployment

### Immediate:
- ✅ Test all functionality
- ✅ Share live URL with stakeholders
- ✅ Monitor logs for first 24 hours

### This Week:
- Set up UptimeRobot to prevent sleeping
- Add error tracking (Sentry)
- Test with real users

### This Month:
- Implement remaining features
- Optimize performance
- Plan database migration strategy (before 90 days)

---

**Deployment Complete! Your app is now live! 🎉**
