# 🚀 UPDATED: Deploy to Render (Free Alternative)

**Railway is no longer free. Use Render instead!**

---

## ⚡ Quick Start: Render Deployment (20 minutes)

### 📚 Full Guide
See **RENDER-DEPLOYMENT.md** for complete step-by-step instructions.

### ⏱️ Super Quick Version

1. **Sign up**: https://render.com (GitHub login, no credit card)
2. **Create PostgreSQL**: Dashboard → New → PostgreSQL (Free plan)
3. **Copy Database URL**: Internal Database URL
4. **Create Web Service**: New → Web Service → Connect `renbran/real-estate-videogra`
   - Root: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Plan: Free
5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=<from QUICK-REF.md>
   JWT_REFRESH_SECRET=<from QUICK-REF.md>
   CORS_ORIGIN=https://renbran.github.io
   FRONTEND_URL=https://renbran.github.io/real-estate-videogra
   DATABASE_URL=<your postgres internal url>
   ```
6. **Deploy**: Click "Create Web Service"
7. **Run Migration**: Service → Shell → `npm run migrate:postgres`
8. **Get URL**: Copy service URL (e.g., `https://xxx.onrender.com`)
9. **Update GitHub Secret**: Add `VITE_API_URL` with your Render URL
10. **Done!** Test at https://renbran.github.io/real-estate-videogra/

---

## 🔑 Render Environment Variables (Copy-Paste)

**NODE_ENV**
```
production
```

**PORT** (Render uses 10000)
```
10000
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

**DATABASE_URL**
```
<YOUR_POSTGRES_INTERNAL_URL_FROM_RENDER>
```

---

## ⚠️ Important Notes

### Free Tier Limitations
- ✅ 750 hours/month (enough for 1 app)
- ⚠️ Cold starts after 15 min inactivity (~30s first request)
- ⚠️ PostgreSQL expires after 90 days (backup required)

### Solutions for Cold Starts
- **Accept it**: First request slow, rest fast
- **Keep-alive**: Use UptimeRobot.com (free) to ping every 5 min
- **Upgrade**: $7/mo for always-on

### Database Backup
Set reminder for day 85 to backup before expiration:
```bash
# In Render Shell
pg_dump $DATABASE_URL > backup.sql
```

---

## 🆘 Troubleshooting

**Build fails**: Check logs, verify `backend/package.json` exists  
**DB connection error**: Use Internal Database URL, not External  
**CORS errors**: Check CORS_ORIGIN has no trailing slash  
**Wrong database**: Verify DATABASE_URL is set in Render  
**Port error**: Must use PORT=10000 for Render

---

## 📚 Documentation

- **RENDER-DEPLOYMENT.md** - Complete step-by-step guide
- **FREE-BACKEND-ALTERNATIVES.md** - Compare all free options
- **QUICK-REF.md** - Original Railway reference (deprecated)

---

## 🎯 Alternative Options

If Render doesn't work for you, see **FREE-BACKEND-ALTERNATIVES.md** for:
- Fly.io + Supabase (best performance, requires credit card)
- Vercel Postgres (serverless, needs code changes)
- Cyclic + Supabase (separate services)
- Koyeb (similar to Render)

---

**Ready?** Open **RENDER-DEPLOYMENT.md** and follow the guide! 🚀
