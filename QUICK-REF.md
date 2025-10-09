# 🎯 QUICK DEPLOYMENT REFERENCE

## 📍 START HERE - UPDATED

**Platform**: Render.com (Railway no longer free)  
**Time**: 15-20 minutes  
**Guide**: RENDER-DEPLOYMENT.md ⭐  
**Status**: Everything prepared ✅

---

## 🔗 Important Links

### Render.com (Recommended)
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Sign up: https://render.com (free, no credit card)

### GitHub
- Repository: https://github.com/renbran/real-estate-videogra
- Actions: https://github.com/renbran/real-estate-videogra/actions
- Pages Settings: https://github.com/renbran/real-estate-videogra/settings/pages
- Secrets: https://github.com/renbran/real-estate-videogra/settings/secrets/actions

### Your App (After Deployment)
- Frontend: https://renbran.github.io/real-estate-videogra/
- Backend: https://YOUR-APP-NAME.up.railway.app
- Health: https://YOUR-APP-NAME.up.railway.app/health

---

## 🔑 Copy-Paste Values

### Render.com Environment Variables

**NODE_ENV**
```
production
```

**PORT**
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
<PASTE_INTERNAL_DATABASE_URL_FROM_RENDER>
```
(Copy from Render PostgreSQL dashboard - Internal Database URL)

---

## 🧪 Test Commands

### Test Render Backend
```bash
# Health check (shows database type)
curl https://YOUR-APP-NAME.onrender.com/health

# Login test
curl https://YOUR-APP-NAME.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osusproperties.com","password":"demo123"}'
```

### Migration (Automatic)
Migration runs automatically on first deployment via start command:
```
npm run migrate:postgres && npm start
```

---

## 👤 Demo Accounts

All use password: `demo123`

```
sarah.j@realty.com          → Agent (Elite)
manager@realty.com          → Manager
video@realty.com            → Videographer
admin@osusproperties.com    → Admin
```

---

## ✅ Success Checklist

### Render Backend
- [ ] Service status: "Live" (green indicator)
- [ ] Health endpoint: `"database": "PostgreSQL (Production)"`
- [ ] Login returns access token
- [ ] No errors in logs

### GitHub Pages
- [ ] Site loads without 404
- [ ] Signup form works
- [ ] Login works
- [ ] No CORS errors in console

---

## 🆘 Emergency Fixes

### CORS Error
```
Fix in Render: CORS_ORIGIN=https://renbran.github.io
(NO trailing slash!)
```

### Build Fails
```
Check: Render logs
Verify: All environment variables set
Verify: Root Directory = backend
```

### Database Error
```
Verify: DATABASE_URL is Internal Database URL from Render
Check: PostgreSQL database is running
Check: Same region for service and database
```

---

## 📚 Full Documentation

1. **RENDER-DEPLOYMENT.md** - Complete step-by-step guide (⭐ START HERE)
2. **FREE-BACKEND-ALTERNATIVES.md** - All free options comparison
3. **DEPLOYMENT-STATUS.md** - Project overview

---

## ⏱️ Timeline

1. Render setup: 15 min
2. GitHub Pages update: 3 min
3. Testing: 5 min
4. **Total: 20-25 min**

---

## 🆕 What Changed?

**Railway is no longer free** - We've switched to Render.com which is:
- ✅ Still 100% free
- ✅ No credit card required
- ✅ PostgreSQL included (free for 90 days)
- ✅ Easy to use
- ⚠️ Sleeps after 15min inactivity (wakes in 30-60 sec)

**Alternative options** also available in FREE-BACKEND-ALTERNATIVES.md

---

**Ready? Open RENDER-DEPLOYMENT.md and start! 🚀**
