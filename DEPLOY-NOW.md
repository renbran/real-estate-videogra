# 🎯 Railway Deployment - Visual Checklist

## 🚀 Quick Reference Guide

Follow these steps in order. Each step takes 1-5 minutes.

---

## ✅ Step 1: Create Railway Account
```
🌐 Go to: https://railway.app
🔐 Click: "Start a New Project" or "Login"
👤 Sign in with: GitHub (@renbran)
```

---

## ✅ Step 2: Create New Project
```
➕ Click: "New Project"
📁 Select: "Deploy from GitHub repo"
🔍 Choose: "renbran/real-estate-videogra"
```

---

## ✅ Step 3: Add PostgreSQL Database
```
➕ Click: "New" → "Database" → "Add PostgreSQL"
⏳ Wait: ~30 seconds for provisioning
✓ Done: DATABASE_URL is auto-set
```

---

## ✅ Step 4: Configure Backend Service
```
🔧 Click: Backend service
⚙️ Go to: "Settings" tab
📂 Set:
   - Root Directory: (leave empty)
   - Build Command: cd backend && npm ci
   - Start Command: cd backend && npm start
   - Watch Paths: /backend/**
```

---

## ✅ Step 5: Add Environment Variables
```
🔑 Click: Backend service → "Variables" tab
➕ Add these one by one:
```

### Copy-Paste These Variables:

**NODE_ENV**
```
production
```

**PORT**
```
3001
```

**JWT_SECRET**
```
b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77
```

**JWT_REFRESH_SECRET**
```
d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3
```

**CORS_ORIGIN**
```
https://renbran.github.io
```

**FRONTEND_URL**
```
https://renbran.github.io/real-estate-videogra
```

**DATABASE_URL** (Reference PostgreSQL)
```
${{Postgres.DATABASE_URL}}
```
_Note: Use the dropdown to reference your PostgreSQL service_

---

## ✅ Step 6: Deploy Backend
```
🚀 Railway will auto-deploy after variables are set
📊 Monitor: "Deployments" tab
⏳ Wait: 2-3 minutes for first deployment
✓ Success: Status shows "Active"
```

---

## ✅ Step 7: Run Database Migration

### Option A: Railway CLI (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migration
railway run npm run migrate:postgres --dir backend
```

### Option B: Dashboard (Easier)
```
⚙️ Go to: Backend service → "Settings"
📝 Update Start Command to:
   cd backend && npm run migrate:postgres && npm start
🔄 Trigger: Redeploy
⏳ Wait: Migration runs on startup
✓ Done: Change Start Command back to:
   cd backend && npm start
```

---

## ✅ Step 8: Get Backend URL
```
🔧 Click: Backend service → "Settings" → "Networking"
🌐 Click: "Generate Domain"
📋 Copy URL: https://YOUR-APP-NAME.up.railway.app
```

**Example URLs:**
- `https://real-estate-videogra-production.up.railway.app`
- `https://real-estate-backend-prod.up.railway.app`

---

## ✅ Step 9: Test Backend

Open terminal and test:

```bash
# Test health endpoint
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Expected: "database": "PostgreSQL (Production)"
```

```bash
# Test login
curl https://YOUR-RAILWAY-URL.up.railway.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osusproperties.com","password":"demo123"}'

# Expected: Returns access_token
```

---

## ✅ Step 10: Update GitHub Secret
```
🌐 Go to: https://github.com/renbran/real-estate-videogra/settings/secrets/actions
➕ Click: "New repository secret"
📝 Name: VITE_API_URL
📝 Value: https://YOUR-RAILWAY-URL.up.railway.app/api
💾 Click: "Add secret"
```

---

## ✅ Step 11: Enable GitHub Pages
```
🌐 Go to: https://github.com/renbran/real-estate-videogra/settings/pages
📂 Source: Select "GitHub Actions"
💾 Save
⏳ Wait: 2-3 minutes for first deployment
🎉 Live at: https://renbran.github.io/real-estate-videogra/
```

---

## ✅ Step 12: Verify Everything Works

### Test the live app:
1. Open: `https://renbran.github.io/real-estate-videogra/`
2. Click: "Sign Up"
3. Create: New test account
4. Verify: Account creation succeeds
5. Test: Login with demo user (admin@osusproperties.com / demo123)
6. Check: Dashboard loads correctly

### Check browser console:
- ✅ No CORS errors
- ✅ API calls succeed
- ✅ JWT tokens stored

---

## 🎉 Success Checklist

Your deployment is successful when:
- ✅ Railway backend shows "Active" status
- ✅ Health endpoint returns `"database": "PostgreSQL (Production)"`
- ✅ GitHub Actions deployment succeeded
- ✅ Frontend loads at GitHub Pages URL
- ✅ Login works with demo account
- ✅ Signup creates new users
- ✅ No CORS errors in console
- ✅ API calls return data

---

## 🆘 Quick Troubleshooting

### Backend won't start
**Check:** Logs in Railway dashboard
**Common fixes:**
- Verify all environment variables are set
- Check DATABASE_URL references PostgreSQL service
- Ensure build completed successfully

### Database connection fails
**Check:** PostgreSQL service is running
**Common fixes:**
- Verify DATABASE_URL is set: `${{Postgres.DATABASE_URL}}`
- Run migration: `railway run npm run migrate:postgres --dir backend`
- Check logs for connection errors

### CORS errors on frontend
**Check:** Browser console for error details
**Common fixes:**
- Verify CORS_ORIGIN=https://renbran.github.io (no trailing slash)
- Verify FRONTEND_URL includes full path
- Restart Railway service after changing variables

### GitHub Actions deployment fails
**Check:** Actions tab in GitHub repo
**Common fixes:**
- Verify VITE_API_URL secret is set
- Check build logs for errors
- Ensure npm dependencies are up to date

---

## 📊 Monitoring

### Railway Dashboard:
- **Metrics**: CPU, memory, network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments
- **Analytics**: Request counts and response times

### Set up alerts:
```
⚙️ Go to: Project settings → Notifications
📧 Add: Email for deployment failures
📧 Add: Email for service downtime
```

---

## 💰 Cost Estimate

**Railway Free Tier:**
- $5/month free credit ✅
- 500 hours/month (~20 days) ✅
- PostgreSQL included ✅
- Sleeps after 30min inactivity ⚠️

**Upgrade to Hobby ($5/mo):**
- No sleep ✅
- 500GB bandwidth ✅
- Priority support ✅
- Custom domains ✅

---

## 📞 Get Help

**Railway Resources:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**Project Resources:**
- See: RAILWAY-QUICK-START.md (detailed guide)
- See: RAILWAY-DEPLOYMENT.md (comprehensive guide)

---

**Ready?** Start with Step 1! 🚀
