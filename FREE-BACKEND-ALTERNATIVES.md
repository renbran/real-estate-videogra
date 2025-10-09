# 🆓 FREE Backend Deployment Alternatives to Railway

**Updated**: October 2025  
**Status**: Railway no longer offers free tier  
**Solution**: Multiple free alternatives available

---

## 🏆 RECOMMENDED: Render.com (Best Free Option)

### ✅ Why Render?
- **100% FREE** for web services (with limitations)
- **PostgreSQL included** (90-day free trial, then $7/mo)
- **Auto-deploy from GitHub**
- **No credit card required**
- **Easy migration from Railway**
- **500 build hours/month**
- **Auto-sleep after 15 min inactivity** (free tier)

### 📊 Free Tier Limits
- ✅ 750 hours/month (enough for one service running 24/7)
- ✅ Auto-deploy from GitHub
- ✅ Custom domains
- ✅ Automatic SSL
- ⚠️ Sleeps after 15 min inactivity (30-60 sec wake up)
- ⚠️ 512MB RAM
- ⚠️ 0.1 CPU

### 🚀 Quick Deployment Steps (15 minutes)

1. **Sign up at Render.com**
   - Go to https://render.com
   - Sign in with GitHub (@renbran)

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `osus-videography-db`
   - Database: `osus_db`
   - User: `osus_user`
   - Region: Oregon (US West)
   - Click "Create Database"
   - **Copy Internal Database URL** (starts with `postgresql://`)

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect: `renbran/real-estate-videogra`
   - Name: `osus-videography-backend`
   - Region: Oregon (same as database)
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm run migrate:postgres && npm start`

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<PASTE_INTERNAL_DATABASE_URL>
   JWT_SECRET=b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77
   JWT_REFRESH_SECRET=d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3
   CORS_ORIGIN=https://renbran.github.io
   FRONTEND_URL=https://renbran.github.io/real-estate-videogra
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for build
   - Your backend URL: `https://osus-videography-backend.onrender.com`

### 📝 Render Configuration File (Optional)
Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: osus-videography-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm run migrate:postgres && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: osus-videography-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: https://renbran.github.io
      - key: FRONTEND_URL
        value: https://renbran.github.io/real-estate-videogra

databases:
  - name: osus-videography-db
    databaseName: osus_db
    user: osus_user
    plan: free
```

---

## 🔄 Alternative Option 1: Fly.io

### ✅ Why Fly.io?
- **Generous free tier**
- **Postgres included** (3GB storage, 256MB RAM)
- **Always-on** (no sleep)
- **Global edge network**
- **3 shared-cpu VMs free**

### 📊 Free Tier Limits
- ✅ 3 shared-cpu-1x VMs (256MB RAM each)
- ✅ 3GB persistent volume storage
- ✅ 160GB outbound data transfer
- ✅ Postgres (3GB storage, 256MB RAM)
- ⚠️ Credit card required (for verification only)

### 🚀 Quick Deployment Steps (20 minutes)

1. **Install Fly CLI**
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # Or npm
   npm install -g flyctl
   ```

2. **Login to Fly.io**
   ```bash
   fly auth login
   ```

3. **Create Fly.toml Configuration**
   Create `fly.toml` in project root:
   ```toml
   app = "osus-videography"
   primary_region = "sjc"

   [build]
     [build.args]
       NODE_VERSION = "18"

   [env]
     NODE_ENV = "production"
     PORT = "8080"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
   ```

4. **Create Dockerfile for Fly.io**
   Create `Dockerfile.fly` in project root:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY backend/package*.json ./
   RUN npm ci --only=production
   COPY backend/ ./
   EXPOSE 8080
   CMD ["npm", "start"]
   ```

5. **Create PostgreSQL Database**
   ```bash
   fly postgres create --name osus-videography-db --region sjc --initial-cluster-size 1
   ```

6. **Set Secrets**
   ```bash
   fly secrets set \
     JWT_SECRET=b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77 \
     JWT_REFRESH_SECRET=d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3 \
     CORS_ORIGIN=https://renbran.github.io \
     FRONTEND_URL=https://renbran.github.io/real-estate-videogra
   ```

7. **Attach Database**
   ```bash
   fly postgres attach osus-videography-db
   ```

8. **Deploy**
   ```bash
   fly deploy
   ```

---

## 🔄 Alternative Option 2: Koyeb (Easiest)

### ✅ Why Koyeb?
- **Truly free forever**
- **No credit card required**
- **Auto-deploy from GitHub**
- **Always-on** (no sleep)
- **PostgreSQL via external provider**

### 📊 Free Tier Limits
- ✅ 1 web service
- ✅ 512MB RAM
- ✅ 2GB disk
- ✅ Auto-deploy from GitHub
- ✅ 100GB bandwidth/month

### 🚀 Quick Deployment Steps (15 minutes)

1. **Sign up at Koyeb**
   - Go to https://koyeb.com
   - Sign in with GitHub (@renbran)

2. **Create PostgreSQL Database (Use Supabase)**
   - Go to https://supabase.com
   - Create free project
   - Copy PostgreSQL connection string

3. **Create App on Koyeb**
   - Click "Create App"
   - Select "GitHub"
   - Choose: `renbran/real-estate-videogra`
   - Builder: Docker
   - Dockerfile path: `Dockerfile`
   - Port: `3001`

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<SUPABASE_POSTGRES_URL>
   JWT_SECRET=b8e88830a1e91fc1c0d2e2cccda70d451c190a17a346a6e2cfbab36aa24cacb0a9c21d66acd26749e6874403d46aff4ef182af8469e7c87f88e2549e841e7a77
   JWT_REFRESH_SECRET=d3a907db395eb800d39fa0cd0eb03970292b046accafc79a682d0e56dec7fddbbdb532885ddb8a42f5fb4eb403a0491c8f9f05b538da7172014412ba8a3dfeb3
   CORS_ORIGIN=https://renbran.github.io
   FRONTEND_URL=https://renbran.github.io/real-estate-videogra
   ```

5. **Deploy**
   - Click "Deploy"
   - Backend URL: `https://osus-videography-<random>.koyeb.app`

---

## 🔄 Alternative Option 3: Vercel (Backend as Serverless)

### ✅ Why Vercel?
- **100% FREE for hobby projects**
- **No credit card required**
- **Serverless functions**
- **Auto-deploy from GitHub**
- **PostgreSQL via Vercel Postgres** (free tier)

### 📊 Free Tier Limits
- ✅ Unlimited API requests
- ✅ 100GB bandwidth/month
- ✅ Vercel Postgres: 256MB storage, 60 hours compute
- ⚠️ 10-second function timeout
- ⚠️ Need to convert to serverless functions

### 🚀 Deployment Steps (30 minutes - requires code changes)

**Note**: Requires converting Express app to serverless functions

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/server-production.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/server-production.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

---

## 📊 Comparison Table

| Feature | Render | Fly.io | Koyeb | Vercel |
|---------|--------|--------|-------|--------|
| **Cost** | Free | Free | Free | Free |
| **Credit Card** | No | Yes | No | No |
| **PostgreSQL** | Yes ($7/mo after 90 days) | Yes (free) | External | Yes (free tier) |
| **Always On** | No (sleeps) | Yes | Yes | N/A (serverless) |
| **Deploy Time** | 3-5 min | 2-3 min | 2-3 min | 1-2 min |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Code Changes** | None | None | None | Required |
| **RAM** | 512MB | 256MB | 512MB | N/A |
| **Bandwidth** | 100GB | 160GB | 100GB | 100GB |

---

## 🏆 RECOMMENDATION

### For Your Project: **Use Render.com**

**Reasons:**
1. ✅ Zero code changes needed
2. ✅ No credit card required
3. ✅ PostgreSQL included (free for 90 days)
4. ✅ Auto-deploy from GitHub
5. ✅ Easiest migration from Railway
6. ✅ 15 minutes to deploy

**Downside:**
- Sleeps after 15 min inactivity (wakes in 30-60 sec)
- PostgreSQL costs $7/mo after 90 days

**Solution for Sleep Issue:**
- Use a free uptime monitor (UptimeRobot) to ping every 10 minutes
- Keeps service awake during business hours

**Solution for PostgreSQL Cost:**
- After 90 days, switch to Supabase PostgreSQL (free forever)
- Or use Fly.io Postgres (free, 3GB)

---

## 🚀 Next Steps

### Immediate Action (Recommended):
1. Follow **Render.com** deployment steps above
2. Takes 15 minutes
3. No code changes needed
4. Copy your backend URL
5. Update GitHub secret: VITE_API_URL

### Alternative Path:
1. If you need always-on: Use **Fly.io**
2. If you want simplest: Use **Koyeb** + Supabase
3. If you prefer serverless: Use **Vercel** (requires changes)

---

## 📞 Support Resources

### Render.com
- Docs: https://render.com/docs
- Status: https://status.render.com
- Community: https://community.render.com

### Fly.io
- Docs: https://fly.io/docs
- Community: https://community.fly.io

### Koyeb
- Docs: https://www.koyeb.com/docs
- Support: https://www.koyeb.com/support

---

**Ready to deploy?** I recommend starting with Render.com - it's the easiest and requires no code changes! 🚀
