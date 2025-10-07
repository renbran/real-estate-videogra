# CloudFlare Pages Deployment Configuration

## Build Settings
```
Build command: npm run build
Build output directory: dist
Root directory: /
Node.js version: 18
```

## Environment Variables (Recommended)
```
NODE_VERSION=18
NODE_ENV=production
```

## Troubleshooting Deployment Issues

### Common Problems & Solutions

1. **Build Failing?**
   - ✅ Framework preset: Must select **"Vite"** (not "None")
   - ✅ Build command: Must be exactly **"npm run build"**
   - ✅ Build output directory: Must be exactly **"dist"**
   - ✅ Add environment variables: NODE_VERSION=18

2. **404 Errors After Deployment?**
   - ✅ Ensure `_redirects` file is in your `public/` folder
   - ✅ Content should be: `/*    /index.html   200`

3. **Build Timeout or Memory Issues?**
   - ✅ Add environment variable: NODE_OPTIONS=--max-old-space-size=4096

4. **TypeScript Errors?**
   - ✅ Your build command already handles this: `tsc -b --noCheck && vite build`

### Debug Steps
1. Check build logs in Cloudflare Pages dashboard
2. Verify your GitHub repository is connected properly
3. Try "Retry deployment" button
4. Clear build cache in Cloudflare settings

## Custom Domain Setup (After Deployment)
1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to Custom domains
4. Add your domain (e.g., videography.yourdomain.com)

## Deployment Steps

### Method 1: GitHub Integration (Recommended)
1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Select "Connect to Git"
4. Choose your GitHub repository: `renbran/real-estate-videogra`
5. Configure build settings:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
6. Click "Save and Deploy"

### Method 2: Direct Upload
1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Select "Upload assets"
4. Upload the contents of the `dist` folder
5. Deploy

## Features Enabled
✅ Production-ready React app with TypeScript
✅ Client-side only (no backend dependencies)
✅ Interactive demo mode with 10 users
✅ Complete booking workflows
✅ Analytics dashboard
✅ Mobile-responsive design
✅ Professional branding

## Demo Access
Once deployed, your system will include:
- **sarah@premiumrealty.com** (Elite Agent)
- **alex@premiumrealty.com** (Manager)
- **chris@videopro.com** (Videographer)

## Performance Optimizations
- Assets optimized and minified
- Tree-shaking enabled
- Code splitting implemented
- Static assets cached by Cloudflare CDN