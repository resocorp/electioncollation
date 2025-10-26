# Electoral Map - Testing Checklist

## ✅ Pre-Testing Setup

### Environment Configuration
- [ ] Mapbox token added to `.env.local`
  ```bash
  NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
  ```

### Database Verification
- [ ] Polling units table has GPS coordinates
  ```sql
  SELECT COUNT(*) FROM polling_units WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  -- Expected: 5720
  ```

- [ ] Parties table is populated
  ```sql
  SELECT COUNT(*) FROM parties WHERE is_active = true;
  -- Expected: 16+
  ```

### Build Verification
- [ ] Project builds successfully
  ```bash
  npm run build
  # Expected: ✓ Compiled successfully
  ```

---

## 🧪 Testing Scenarios

### Test 1: Initial Load (No Results)
**Steps**:
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/dashboard/electoral-map`
3. Wait for map to load

**Expected Results**:
- [ ] Loading spinner appears
- [ ] Progress message: "Loading electoral map... Preparing 5,720 polling units"
- [ ] Map loads within 2-3 seconds
- [ ] All polling units visible as gray points
- [ ] Legend shows:
  - Total Units: 5,720
  - Results Received: 0
  - Pending: 5,720
  - Completion: 0%
- [ ] No heatmap colors (no results yet)

**Console Output**:
```
✅ "🚀 Starting data load..."
✅ "📡 Fetching polling units from server..."
✅ "✅ Loaded 5720 polling units"
✅ "✅ Loaded 0 results"
✅ "✅ Loaded 16 parties"
✅ "✅ Map data ready!"
✅ "🔴 Subscribing to real-time results..."
```

---

### Test 2: Cache Performance
**Steps**:
1. Load map (first time)
2. Note load time
3. Refresh page (F5)
4. Note load time

**Expected Results**:
- [ ] First load: 2-3 seconds
- [ ] Second load: <1 second
- [ ] Console shows: "✅ Loaded polling units from cache"
- [ ] Map appears instantly

---

### Test 3: Add Single Result
**Steps**:
1. Keep map open
2. Run SQL query:
```sql
INSERT INTO election_results (
  reference_id,
  agent_id,
  polling_unit_code,
  ward,
  lga,
  state,
  party_votes,
  total_votes,
  validation_status,
  submitted_at
) VALUES (
  'TEST-MAP-001',
  (SELECT id FROM agents LIMIT 1),
  (SELECT polling_unit_code FROM polling_units WHERE latitude IS NOT NULL LIMIT 1),
  (SELECT ward FROM polling_units WHERE latitude IS NOT NULL LIMIT 1),
  (SELECT lga FROM polling_units WHERE latitude IS NOT NULL LIMIT 1),
  'Anambra',
  '{"APC": 150, "PDP": 120, "LP": 80, "APGA": 50}'::jsonb,
  400,
  'validated',
  NOW()
);
```

**Expected Results**:
- [ ] Console shows: "📡 Real-time update received"
- [ ] Map updates automatically (no manual refresh needed)
- [ ] One polling unit changes color (APC blue in this case)
- [ ] Small heatmap appears around that unit
- [ ] Legend updates:
  - Results Received: 1
  - Completion: 0.02%
  - Party Wins: APC: 1
- [ ] Update happens within 1 second

---

### Test 4: Add Multiple Results
**Steps**:
1. Insert 10-20 test results across different LGAs
2. Watch map update in real-time

**Expected Results**:
- [ ] Each result appears automatically
- [ ] Colors spread across the map
- [ ] Heatmap shows party dominance areas
- [ ] Legend updates continuously
- [ ] No lag or freezing

---

### Test 5: Toggle Controls
**Steps**:
1. Click "Heatmap" button (toggle off)
2. Click "Markers" button (toggle on)
3. Toggle both on
4. Toggle both off

**Expected Results**:
- [ ] Heatmap ON: Smooth color diffusion visible
- [ ] Heatmap OFF: No color diffusion
- [ ] Markers ON: Individual points visible
- [ ] Markers OFF: No points visible
- [ ] Both ON: Colors + points
- [ ] Both OFF: Empty map (gray background only)

---

### Test 6: LGA Filter
**Steps**:
1. Click "LGA Filter" dropdown
2. Select an LGA (e.g., "Aguata")
3. Observe map

**Expected Results**:
- [ ] Dropdown shows all LGAs
- [ ] Map zooms to selected LGA
- [ ] Only polling units in that LGA visible
- [ ] Ward filter appears
- [ ] Legend updates to show only that LGA's stats

---

### Test 7: Ward Filter
**Steps**:
1. Select an LGA first
2. Click "Ward Filter" dropdown
3. Select a ward

**Expected Results**:
- [ ] Dropdown shows wards in selected LGA only
- [ ] Map zooms to selected ward
- [ ] Only polling units in that ward visible
- [ ] Legend updates accordingly

---

### Test 8: Manual Refresh
**Steps**:
1. Click "Refresh Data" button
2. Observe behavior

**Expected Results**:
- [ ] Button shows spinning icon
- [ ] Data refetches from server
- [ ] Map updates with latest results
- [ ] Button returns to normal
- [ ] No errors in console

---

### Test 9: Zoom and Pan
**Steps**:
1. Scroll to zoom in/out
2. Click and drag to pan
3. Test at different zoom levels

**Expected Results**:
- [ ] Smooth zooming (60 FPS)
- [ ] Smooth panning (no lag)
- [ ] Heatmap adjusts radius with zoom
- [ ] Markers adjust size with zoom
- [ ] No rendering glitches

---

### Test 10: Dark Mode
**Steps**:
1. Toggle dark mode in dashboard
2. Observe map

**Expected Results**:
- [ ] Map background adjusts to dark theme
- [ ] Controls visible in dark mode
- [ ] Legend readable in dark mode
- [ ] Heatmap colors still visible
- [ ] No contrast issues

---

### Test 11: Browser Compatibility
**Test in each browser**:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

**Expected Results**:
- [ ] Map loads in all browsers
- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable

---

### Test 12: Mobile Responsiveness
**Steps**:
1. Open in mobile browser or use DevTools mobile view
2. Test all features

**Expected Results**:
- [ ] Map fills screen
- [ ] Controls accessible
- [ ] Touch gestures work (pinch zoom, pan)
- [ ] Legend readable
- [ ] No horizontal scroll

---

### Test 13: Network Failure
**Steps**:
1. Load map successfully
2. Disconnect network
3. Refresh page

**Expected Results**:
- [ ] Map loads from cache
- [ ] Shows cached data
- [ ] Warning about offline mode (optional)
- [ ] Real-time updates pause
- [ ] No crash or blank screen

---

### Test 14: Large Dataset Performance
**Steps**:
1. Insert 100+ results
2. Observe map performance

**Expected Results**:
- [ ] Map remains smooth (60 FPS)
- [ ] No lag when zooming/panning
- [ ] Heatmap renders correctly
- [ ] Legend updates quickly
- [ ] No memory leaks

---

### Test 15: Clear Cache
**Steps**:
1. Open browser console
2. Run: `indexedDB.deleteDatabase('electoral-map-cache')`
3. Refresh page

**Expected Results**:
- [ ] Cache cleared
- [ ] Map refetches from server
- [ ] Takes 2-3 seconds to load
- [ ] New cache created
- [ ] Subsequent loads fast again

---

## 🐛 Known Issues & Limitations

### TypeScript IDE Warnings
- **Issue**: Red squiggles on `react-map-gl` imports in IDE
- **Impact**: None - build works fine
- **Solution**: Restart TypeScript server or ignore

### Mapbox Token
- **Issue**: Using public demo token
- **Impact**: May have rate limits
- **Solution**: Create free Mapbox account for production

---

## 📊 Performance Benchmarks

### Expected Performance
- **Initial Load**: 2-3 seconds
- **Cached Load**: <1 second
- **Real-time Update**: <500ms
- **Frame Rate**: 60 FPS
- **Data Transfer**: ~1.1 MB initial, ~1 KB per update

### If Performance is Worse
- [ ] Check network speed
- [ ] Verify database indexes exist
- [ ] Check browser has GPU acceleration
- [ ] Close other tabs/applications
- [ ] Clear cache and retry

---

## ✅ Sign-Off Checklist

### Before Production Deployment
- [ ] All 15 tests passed
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Real-time working
- [ ] Cache working
- [ ] Filters working
- [ ] Mobile tested
- [ ] Dark mode tested
- [ ] Documentation reviewed
- [ ] Team trained on usage

### Production Readiness
- [ ] Mapbox token configured
- [ ] Database optimized
- [ ] Monitoring in place
- [ ] Backup plan ready
- [ ] Support team briefed

---

## 📞 Support

**If tests fail**:
1. Check console for error messages
2. Review `ELECTORAL_MAP_IMPLEMENTATION.md`
3. Check `ELECTORAL_MAP_QUICK_START.md`
4. Verify database connection
5. Test with sample data

**Common Solutions**:
- Clear cache: `indexedDB.deleteDatabase('electoral-map-cache')`
- Verify Mapbox token in `.env.local`
- Check polling_units have GPS coordinates
- Restart dev server

---

**Testing Date**: _______________  
**Tested By**: _______________  
**Status**: ⬜ Pass | ⬜ Fail  
**Notes**: _______________
