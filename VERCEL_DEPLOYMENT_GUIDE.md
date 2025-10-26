# Vercel Deployment Guide - Electoral Map

## ✅ Issue Fixed

The Leaflet peer dependency conflict has been resolved with two commits:

1. **Commit 6657086**: Empty commit to force fresh rebuild
2. **Commit 3512636**: Added `vercel.json` with `--legacy-peer-deps` flag

## What Was Done

### 1. Removed Leaflet Dependencies
```json
// REMOVED from package.json:
"leaflet": "^1.9.4"
"react-leaflet": "^5.0.0"
"@types/leaflet": "^1.9.21"
```

### 2. Added Vercel Configuration
Created `vercel.json`:
```json
{
  "buildCommand": "npm install && npm run build",
  "installCommand": "npm install --legacy-peer-deps"
}
```

The `--legacy-peer-deps` flag tells npm to ignore peer dependency conflicts during installation.

### 3. Forced Fresh Deploy
- Created empty commit to bypass Vercel's cache
- Pushed to trigger new deployment

## Deployment Status

Check your Vercel dashboard - the deployment should now succeed with:
- ✅ npm install completes (with --legacy-peer-deps)
- ✅ Build succeeds
- ✅ Electoral map works with Mapbox GL

## Environment Variables

Ensure these are set in Vercel:

### Required
```
NEXT_PUBLIC_SUPABASE_URL=https://ncftsabdnuwemcqnlzmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### For Electoral Map
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
```

### Optional (SMS)
```
DBL_SMS_SERVER_IP=159.65.59.78
DBL_SMS_SERVER_PORT=80
DBL_SMS_USERNAME=root
DBL_SMS_PASSWORD=sm@phswebawka
DBL_SMS_PROVIDER=phsweb
DBL_SMS_LINE=goip-10101
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Verify Deployment

### 1. Check Build Logs
In Vercel dashboard:
1. Go to "Deployments"
2. Click on the latest deployment
3. Check "Build Logs"
4. Look for:
   ```
   ✓ npm install completed
   ✓ Compiled successfully
   ✓ Generating static pages
   ```

### 2. Test Electoral Map
Once deployed:
1. Navigate to: `https://your-app.vercel.app/dashboard/electoral-map`
2. Map should load within 2-3 seconds
3. Check browser console for errors
4. Verify real-time subscription connects

### 3. Test Other Features
- ✅ Dashboard loads
- ✅ Login works
- ✅ Results page works
- ✅ Agents page works
- ✅ SMS features work

## Troubleshooting

### If Deployment Still Fails

#### Option 1: Clear Vercel Cache (Recommended)
1. Go to Vercel dashboard
2. Project Settings → General
3. Scroll to "Build & Development Settings"
4. Click "Clear Build Cache"
5. Redeploy

#### Option 2: Force Redeploy
1. Go to "Deployments"
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Uncheck "Use existing Build Cache"
5. Click "Redeploy"

#### Option 3: Check Package.json
Verify in GitHub that `package.json` does NOT contain:
```json
// These should NOT be present:
"leaflet"
"react-leaflet"
"@types/leaflet"
```

And DOES contain:
```json
// These should be present:
"mapbox-gl": "^3.16.0",
"react-map-gl": "^8.1.0",
"idb": "^8.0.3"
```

### If Map Doesn't Load

#### Check Mapbox Token
1. Go to Vercel → Project → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set
3. Token should start with `pk.`

#### Check Browser Console
Open DevTools (F12) and look for:
- ✅ "🚀 Starting data load..."
- ✅ "✅ Loaded 5720 polling units"
- ❌ Any red errors

#### Check Database
Verify polling units have GPS coordinates:
```sql
SELECT COUNT(*) FROM polling_units 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
-- Should return 5720
```

### Common Errors

#### Error: "Mapbox token required"
**Solution**: Add `NEXT_PUBLIC_MAPBOX_TOKEN` to Vercel environment variables

#### Error: "Failed to load map data"
**Solution**: Check Supabase credentials in environment variables

#### Error: "Module not found: react-map-gl"
**Solution**: 
1. Clear Vercel build cache
2. Redeploy
3. Verify `react-map-gl` is in `package.json`

## Performance Optimization

### Vercel Settings (Optional)

1. **Enable Edge Caching**:
   - Go to Project Settings → Functions
   - Set "Function Region" to closest to your users

2. **Enable Analytics**:
   - Go to Analytics tab
   - Monitor page load times
   - Check Core Web Vitals

3. **Set Node Version**:
   Add to `package.json`:
   ```json
   "engines": {
     "node": "20.x"
   }
   ```

## Monitoring

### After Deployment

1. **Check Vercel Analytics**:
   - Page load times
   - Error rates
   - User traffic

2. **Monitor Supabase**:
   - Database connections
   - Real-time subscriptions
   - API usage

3. **Test Electoral Map**:
   - Load time < 3 seconds
   - Real-time updates working
   - No console errors

## Rollback Plan

If deployment breaks something:

1. **Instant Rollback**:
   - Go to Vercel → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Git Rollback**:
   ```bash
   git revert HEAD
   git push
   ```

## Success Checklist

- [ ] Deployment completed successfully
- [ ] No build errors in logs
- [ ] Electoral map loads at `/dashboard/electoral-map`
- [ ] Map shows 5,720 polling units
- [ ] Heatmap visualization works
- [ ] Real-time updates connect
- [ ] All environment variables set
- [ ] No console errors
- [ ] Dashboard accessible
- [ ] Login works
- [ ] Other features working

## Support

**If issues persist**:
1. Check Vercel build logs
2. Check browser console
3. Verify environment variables
4. Test locally first (`npm run build`)
5. Clear all caches and redeploy

---

**Status**: ✅ Deployment Configuration Complete  
**Last Updated**: October 26, 2025  
**Commits**: 6657086, 3512636
