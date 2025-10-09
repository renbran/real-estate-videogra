# 🎯 QUICK DEPLOYMENT REFERENCE

## 📍 START HERE

**Time**: 30 minutes  
**Guide**: DEPLOY-NOW.md  
**Status**: Everything prepared ✅

---

## 🔗 Important Links

### Railway
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app/quick-start

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

### Railway Environment Variables

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

**DATABASE_URL**
```
${{Postgres.DATABASE_URL}}
```
(Use dropdown to reference PostgreSQL service)

---

## 🧪 Test Commands

### Test Railway Backend
```bash
# Health check (shows database type)
curl https://YOUR-APP-NAME.up.railway.app/health

# Login test
curl https://YOUR-APP-NAME.up.railway.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osusproperties.com","password":"demo123"}'
```

### Run Migration (Railway CLI)
```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migration
railway run npm run migrate:postgres --dir backend
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

### Railway Backend
- [ ] Service status: "Active"
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
Fix in Railway: CORS_ORIGIN=https://renbran.github.io
(NO trailing slash!)
```

### Build Fails
```
Check: Railway logs
Verify: All environment variables set
```

### Database Error
```
Verify: DATABASE_URL=${{Postgres.DATABASE_URL}}
Check: PostgreSQL service running
Run: Migration script
```

---

## 📚 Full Documentation

1. **DEPLOY-NOW.md** - Visual step-by-step (⭐ START HERE)
2. **DEPLOYMENT-STATUS.md** - Complete overview
3. **RAILWAY-QUICK-START.md** - Detailed guide
4. **RAILWAY-DEPLOYMENT.md** - Full reference

---

## ⏱️ Timeline

1. Railway setup: 15 min
2. GitHub Pages: 5 min
3. Testing: 10 min
4. **Total: 30 min**

---

**Ready? Open DEPLOY-NOW.md and start! 🚀**
