# 🎯 Render Deployment Guide (Railway Alternative)

**Platform**: Render.com (100% Free)  
**Time**: 20 minutes  
**Requirements**: GitHub account only (no credit card!)

---

## ✅ What You Get (Free Tier)

- ✅ **750 hours/month** of compute (enough for 1 app always-on)
- ✅ **PostgreSQL database** with 256MB storage
- ✅ **Automatic deploys** from GitHub
- ✅ **Free SSL/HTTPS**
- ✅ **Custom domains** (optional)
- ⚠️ **Spins down after 15 min** inactivity (cold start ~30s)

**Database Note**: Free PostgreSQL expires after 90 days. You'll need to backup and create a new one, or upgrade to paid.

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Render Account (2 minutes)

1. Go to https://render.com
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Sign in with GitHub"**
4. Authorize Render to access your repositories
5. Complete your profile (optional)

✅ **Done!** You're in the Render dashboard.

---

### Step 2: Create PostgreSQL Database (3 minutes)

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure database:
   - **Name**: `real-estate-videogra-db`
   - **Database**: `videography` (or leave default)
   - **User**: `videography_user` (or leave default)
   - **Region**: Choose closest to you (e.g., `Oregon (US West)`)
   - **PostgreSQL Version**: 16 (or latest)
   - **Plan**: **Free**

3. Click **"Create Database"**
4. Wait ~30 seconds for provisioning
5. **IMPORTANT**: Copy the **Internal Database URL**
   - Go to database page → **"Info"** tab
   - Copy **"Internal Database URL"** (starts with `postgresql://`)
   - Save it for Step 4

Example URL:
```
postgresql://videography_user:password@dpg-xxxxx.oregon-postgres.render.com/videography
```

✅ **Done!** PostgreSQL is ready.

---

### Step 3: Create Web Service (5 minutes)

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Find and select: **renbran/real-estate-videogra**
   - If not listed, click "Configure account" and grant access
4. Configure service:

   **Basic Settings:**
   - **Name**: `real-estate-videogra-backend`
   - **Region**: Same as database (e.g., `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`

   **Build & Deploy:**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

   **Plan:**
   - Select **"Free"**

5. **DON'T CLICK CREATE YET** - we need to add environment variables first

---

### Step 4: Add Environment Variables (5 minutes)

Still on the "Create Web Service" page, scroll down to **"Environment Variables"** section:

Click **"Add Environment Variable"** for each of these:

#### 1. NODE_ENV
```
production
```

#### 2. PORT
```
10000
```
**Important**: Render uses port 10000, not 3001

#### 3. JWT_SECRET
```
b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77
```

#### 4. JWT_REFRESH_SECRET
```
d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3
```

#### 5. CORS_ORIGIN
```
https://renbran.github.io
```

#### 6. FRONTEND_URL
```
https://renbran.github.io/real-estate-videogra
```

#### 7. DATABASE_URL
```
<PASTE YOUR INTERNAL DATABASE URL FROM STEP 2>
```
**Example**:
```
postgresql://videography_user:xxx@dpg-xxxxx.oregon-postgres.render.com/videography
```

---

### Step 5: Deploy! (2 minutes)

1. Click **"Create Web Service"**
2. Render will start building your app
3. Watch the logs (automatic):
   - Installing dependencies...
   - Building...
   - Starting server...
4. Wait ~2-3 minutes for first deploy

✅ **Success** when you see: `Your service is live 🎉`

**Your Backend URL**: `https://real-estate-videogra-backend.onrender.com`

---

### Step 6: Run Database Migration (3 minutes)

After successful deployment, we need to run the migration to create tables.

#### Option A: Using Render Shell (Easiest)

1. Go to your web service in Render dashboard
2. Click **"Shell"** tab (top right)
3. Wait for shell to connect
4. Run migration:
   ```bash
   npm run migrate:postgres
   ```
5. You should see:
   ```
   ✅ Users table created
   ✅ Bookings table created
   ✅ Notifications table created
   ✅ Files table created
   ✅ Audit logs table created
   ✅ Calendar events table created
   ✅ All indexes created
   ✅ Created demo user: sarah.j@realty.com
   ✅ Created demo user: manager@realty.com
   ✅ Created demo user: video@realty.com
   ✅ Created demo user: admin@osusproperties.com
   ✅ Migration completed successfully!
   ```

#### Option B: Using One-Time Job

1. Dashboard → **"Jobs"** → **"New Job"**
2. Configure:
   - **Name**: `Database Migration`
   - **Command**: `npm run migrate:postgres`
   - **Plan**: Free
3. Click **"Create Job"**
4. Run once, check logs, then delete job

✅ **Done!** Database is migrated with demo users.

---

### Step 7: Test Your Backend (2 minutes)

Get your backend URL from Render dashboard (e.g., `https://real-estate-videogra-backend.onrender.com`)

#### Test 1: Health Check
```bash
curl https://real-estate-videogra-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "PostgreSQL (Production)",
  "environment": "production"
}
```

✅ If you see `"database": "PostgreSQL (Production)"` - SUCCESS!

#### Test 2: Login with Demo User
```bash
curl https://real-estate-videogra-backend.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osusproperties.com","password":"demo123"}'
```

Expected: Returns `access_token` and `refresh_token`

✅ **Success!** Your backend is live and working!

---

## 🔗 Step 8: Connect Frontend (5 minutes)

### Update GitHub Secret

1. Go to: https://github.com/renbran/real-estate-videogra/settings/secrets/actions
2. Click **"New repository secret"**
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://real-estate-videogra-backend.onrender.com/api`
4. Click **"Add secret"**

### Enable GitHub Pages (if not already)

1. Go to: https://github.com/renbran/real-estate-videogra/settings/pages
2. **Source**: Select **"GitHub Actions"**
3. Save

### Trigger New Deployment

```bash
# Make a small change to trigger redeploy
cd '/d/Booking System/real-estate-videogra'
git commit --allow-empty -m "Update API URL to Render backend"
git push origin main
```

Wait 2-3 minutes, then your frontend will be live at:
**https://renbran.github.io/real-estate-videogra/**

---

## ✅ Step 9: Verify Everything Works

### Test the Live App

1. Open: https://renbran.github.io/real-estate-videogra/
2. Click **"Sign Up"**
3. Create a test account
4. Verify signup succeeds
5. Login with demo user: `admin@osusproperties.com` / `demo123`
6. Check dashboard loads

### Check Browser Console

- ✅ No CORS errors
- ✅ API calls succeed
- ✅ JWT tokens stored in localStorage

### Check Network Tab

- ✅ API calls go to: `https://real-estate-videogra-backend.onrender.com/api`
- ✅ Status codes: 200 (success)
- ✅ Responses contain data

---

## 🎉 Success Checklist

Your deployment is successful when:

- [x] Render service shows **"Live"** status (green dot)
- [x] Health endpoint returns `"database": "PostgreSQL (Production)"`
- [x] Demo login returns access token
- [x] Frontend loads at GitHub Pages URL
- [x] Signup creates new users
- [x] Login works with new and demo accounts
- [x] No CORS errors in browser console
- [x] Dashboard displays correctly

---

## ⚠️ Important: Cold Starts

**Free Tier Limitation**: Render spins down your service after 15 minutes of inactivity.

**What This Means**:
- First request after inactivity takes ~30 seconds to wake up
- Subsequent requests are instant
- Service stays awake while receiving traffic

**Solutions**:

### Option 1: Accept Cold Starts (Recommended for MVP)
- Inform users the first load may be slow
- No action needed

### Option 2: Keep-Alive Service (Free)
Use a free cron service to ping your backend every 14 minutes:

**Using Cron-Job.org** (free):
1. Go to: https://cron-job.org
2. Sign up (free)
3. Create job:
   - URL: `https://real-estate-videogra-backend.onrender.com/health`
   - Schedule: `*/14 * * * *` (every 14 minutes)
   - Save

**Using UptimeRobot** (free):
1. Go to: https://uptimerobot.com
2. Sign up (free)
3. Add monitor:
   - Type: HTTP(s)
   - URL: `https://real-estate-videogra-backend.onrender.com/health`
   - Interval: 5 minutes (max on free tier)

### Option 3: Upgrade to Paid ($7/mo)
- No cold starts
- Always-on
- More resources

---

## 🔧 Monitoring & Maintenance

### Check Logs
- Dashboard → Your service → **"Logs"** tab
- See real-time server logs
- Monitor errors and requests

### Auto-Deploy
Every push to `main` branch automatically deploys:
1. Render detects new commits
2. Rebuilds the app
3. Deploys new version
4. Zero downtime

### Database Backup (IMPORTANT)
Free PostgreSQL expires after 90 days:

**Backup Before 90 Days**:
```bash
# Using Render Shell
pg_dump $DATABASE_URL > backup.sql

# Or download from local terminal
render db:backup real-estate-videogra-db
```

**After 90 days**:
1. Create new free PostgreSQL
2. Restore backup
3. Update DATABASE_URL in service

---

## 🆘 Troubleshooting

### Issue: Build Fails
**Check**: Logs show error
**Solutions**:
- Verify `backend/package.json` exists
- Check Node version compatibility
- Review build logs for specific error

### Issue: Database Connection Error
**Check**: Logs show `ECONNREFUSED` or `authentication failed`
**Solutions**:
- Verify DATABASE_URL is set correctly
- Use **Internal Database URL**, not External
- Check database is running (green dot)

### Issue: CORS Errors on Frontend
**Check**: Browser console shows CORS error
**Solutions**:
- Verify CORS_ORIGIN = `https://renbran.github.io` (no trailing slash)
- Restart Render service after changing variables
- Check logs for CORS configuration

### Issue: Health Check Shows SQLite
**Check**: `/health` returns `"database": "SQLite"`
**Solutions**:
- DATABASE_URL environment variable not set
- Redeploy service after setting DATABASE_URL

### Issue: Port Error
**Check**: Logs show "Port already in use"
**Solutions**:
- Verify PORT environment variable = `10000`
- Render requires port 10000, not 3001

---

## 💰 Cost Summary

### Free Tier (Current)
- **Cost**: $0/month
- **Uptime**: 750 hours (~31 days)
- **Database**: 256MB, expires in 90 days
- **Cold starts**: Yes (15 min)

### Paid Tier ($7/mo for backend)
- **Cost**: $7/month
- **Uptime**: Always on
- **Database**: Upgrade separately ($7/mo for 1GB)
- **Cold starts**: No

**Recommendation**: Start with free tier, upgrade if/when needed.

---

## 📊 Your URLs

**Frontend**: https://renbran.github.io/real-estate-videogra/  
**Backend**: https://real-estate-videogra-backend.onrender.com  
**Health Check**: https://real-estate-videogra-backend.onrender.com/health  
**API Base**: https://real-estate-videogra-backend.onrender.com/api

---

## 🎯 Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Monitor logs for errors
3. ✅ Set up keep-alive (optional)
4. ✅ Add custom domain (optional)
5. ✅ Set up database backup reminders (day 85)
6. ✅ Consider paid tier if cold starts are an issue

---

## 📞 Support

**Render Resources**:
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com
- Support: help@render.com

**Project Files**:
- Quick Ref: QUICK-REF.md
- Alternatives: FREE-BACKEND-ALTERNATIVES.md

---

**🎉 Congratulations! Your app is now live on Render!** 🚀
