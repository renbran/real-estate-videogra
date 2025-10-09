# 🆓 Free Backend Deployment Alternatives to Railway

**Railway is no longer free**, but here are excellent alternatives that offer free tiers for deploying your Node.js backend with PostgreSQL.

---

## 🏆 Top Recommendations (Ranked by Ease)

### 1. ✨ **Render** (⭐ BEST FREE OPTION)

**Free Tier:**
- ✅ 750 hours/month (enough for 1 app)
- ✅ PostgreSQL database (90 days, then expires - must backup)
- ✅ Auto-deploy from GitHub
- ✅ SSL/HTTPS included
- ⚠️ Spins down after 15 min inactivity (cold starts ~30s)

**Why Choose Render:**
- Most similar to Railway
- Easy setup (5 minutes)
- Great documentation
- No credit card required

**Deployment Time:** 15 minutes

**Guide:** See `RENDER-DEPLOYMENT.md` below

---

### 2. 🚀 **Fly.io**

**Free Tier:**
- ✅ $5/month free credit
- ✅ 3 shared VMs (256MB RAM each)
- ✅ PostgreSQL via Supabase (free)
- ✅ Global edge network
- ⚠️ Requires credit card (but won't charge with free tier)

**Why Choose Fly.io:**
- Best performance (edge deployment)
- True free tier (not just trial)
- Docker-based (flexible)

**Deployment Time:** 20 minutes

**Guide:** See `FLY-DEPLOYMENT.md` below

---

### 3. ☁️ **Vercel** (with Vercel Postgres)

**Free Tier:**
- ✅ Unlimited deployments
- ✅ PostgreSQL: 256MB storage, 60 hours compute/month
- ✅ Serverless functions (Node.js)
- ✅ Auto-deploy from GitHub
- ✅ No cold starts for API routes

**Why Choose Vercel:**
- Same platform as frontend
- Zero configuration
- Best for Next.js/serverless

**Catch:** Need to adapt Express app to serverless functions

**Deployment Time:** 25 minutes (requires code changes)

---

### 4. 🐘 **Supabase** (PostgreSQL) + **Cyclic** (Node.js)

**Free Tier:**
- ✅ Supabase: 500MB database, unlimited API calls
- ✅ Cyclic: Unlimited apps, AWS Lambda-based
- ✅ No cold starts
- ✅ No credit card required

**Why Choose This Combo:**
- Best free PostgreSQL (Supabase)
- Unlimited deployments (Cyclic)
- Most generous limits

**Catch:** Two separate services to configure

**Deployment Time:** 30 minutes

---

### 5. 🦅 **Koyeb**

**Free Tier:**
- ✅ $5.50/month free credit (~180 hours)
- ✅ Auto-deploy from GitHub
- ✅ Global edge network
- ⚠️ PostgreSQL via external service (Supabase/Neon)

**Why Choose Koyeb:**
- Simple like Railway
- Good performance
- No credit card for trial

**Deployment Time:** 20 minutes

---

## 📊 Quick Comparison

| Service | PostgreSQL | Deploy Time | Cold Starts | Best For |
|---------|-----------|-------------|-------------|----------|
| **Render** | ✅ (90 days) | 15 min | Yes (~30s) | Quick setup |
| **Fly.io** | Via Supabase | 20 min | No | Performance |
| **Vercel** | ✅ Limited | 25 min | No | Serverless |
| **Supabase+Cyclic** | ✅ Best | 30 min | No | Long-term |
| **Koyeb** | Via External | 20 min | Minimal | Balance |

---

## 🎯 My Recommendation: **Render**

For your project, I recommend **Render** because:
1. ✅ Most similar to Railway (easiest migration)
2. ✅ PostgreSQL included
3. ✅ No code changes needed
4. ✅ No credit card required
5. ✅ Deploy in 15 minutes

**Only downside:** Cold starts (first request takes 30s after inactivity)

---

## 🚀 Quick Start with Render

### Step 1: Sign Up (2 minutes)
```
🌐 Go to: https://render.com
👤 Sign in with GitHub (@renbran)
✅ No credit card needed
```

### Step 2: Create PostgreSQL Database (3 minutes)
```
➕ Dashboard → "New" → "PostgreSQL"
📝 Name: real-estate-videogra-db
🔧 Plan: Free
✅ Create Database
📋 Copy: Internal Database URL
```

### Step 3: Create Web Service (5 minutes)
```
➕ Dashboard → "New" → "Web Service"
🔗 Connect: renbran/real-estate-videogra
📂 Root Directory: backend
⚙️ Build Command: npm install
▶️ Start Command: npm start
💰 Plan: Free
```

### Step 4: Add Environment Variables (3 minutes)
```
⚙️ Click service → Environment
➕ Add from QUICK-REF.md:
   - NODE_ENV=production
   - PORT=10000 (Render uses this)
   - JWT_SECRET=<your secret>
   - JWT_REFRESH_SECRET=<your secret>
   - CORS_ORIGIN=https://renbran.github.io
   - FRONTEND_URL=https://renbran.github.io/real-estate-videogra
   - DATABASE_URL=<paste from Step 2>
```

### Step 5: Deploy (2 minutes)
```
🚀 Click "Create Web Service"
⏳ Wait 2-3 minutes for build
✅ Get URL: https://real-estate-videogra.onrender.com
```

### Step 6: Run Migration
```bash
# Option 1: In Render Shell (recommended)
Dashboard → Service → Shell tab
npm run migrate:postgres

# Option 2: One-time job
Dashboard → New → Background Worker
Command: npm run migrate:postgres
Run once, then delete
```

---

## 🎯 Alternative: Fly.io + Supabase (Best Long-Term)

If you want better performance and don't mind entering a credit card:

### Supabase (PostgreSQL) - 5 minutes
```
1. Go to: https://supabase.com
2. Create project (free tier)
3. Copy connection string
4. Database is production-ready!
```

### Fly.io (Backend) - 15 minutes
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
cd backend
fly launch
# Follow prompts, select free tier

# Set environment variables
fly secrets set \
  NODE_ENV=production \
  JWT_SECRET=<your-secret> \
  JWT_REFRESH_SECRET=<your-secret> \
  CORS_ORIGIN=https://renbran.github.io \
  FRONTEND_URL=https://renbran.github.io/real-estate-videogra \
  DATABASE_URL=<supabase-connection-string>

# Deploy
fly deploy

# Run migration
fly ssh console
npm run migrate:postgres
exit
```

---

## 💡 Pro Tips

### For Render:
- Cold starts: First request after 15min takes 30s
- Keep-alive: Use a cron job to ping every 14min (optional)
- Database: Backup before 90 days expires

### For Fly.io:
- Best performance of all free options
- No cold starts
- Requires credit card (but free tier won't charge)

### For All Platforms:
- Monitor free tier limits
- Set up health check endpoints
- Enable auto-deploy from GitHub
- Add error logging (Sentry free tier)

---

## 🆘 Need Help Choosing?

**Choose Render if:**
- ✅ You want the easiest setup
- ✅ You're okay with cold starts
- ✅ You don't have a credit card

**Choose Fly.io if:**
- ✅ You want best performance
- ✅ You have a credit card
- ✅ You want no cold starts
- ✅ You plan to scale later

**Choose Vercel if:**
- ✅ You want everything on one platform
- ✅ You're willing to refactor to serverless
- ✅ You want instant deploys

---

## 📝 What Would You Like?

I can create detailed deployment guides for:

1. **Render** (recommended) - 15 min deployment
2. **Fly.io + Supabase** - 20 min deployment
3. **Vercel Serverless** - 25 min deployment (needs code changes)
4. **Supabase + Cyclic** - 30 min deployment

**Just let me know which one you prefer, and I'll create the complete step-by-step guide!** 🚀

---

**My Recommendation:** Start with **Render** - it's the quickest path to deployment with your current code. If cold starts become an issue later, we can migrate to Fly.io in 20 minutes.
