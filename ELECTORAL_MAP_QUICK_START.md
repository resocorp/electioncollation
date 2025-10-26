# Electoral Map - Quick Start Guide

## 🚀 Ready to Use!

The electoral map is now fully implemented and ready for testing.

## Quick Setup (2 minutes)

### 1. Add Mapbox Token to .env.local

The token is already in `.env.example`. Copy it to your `.env.local`:

```bash
# Mapbox Configuration (for electoral map)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
```

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Access the Map

Navigate to: **http://localhost:3000/dashboard/electoral-map**

Or click **"Electoral Map"** in the dashboard sidebar.

## What You'll See

### Initial Load
- Loading spinner with progress
- "Loading electoral map... Preparing 5,720 polling units"
- Takes 2-3 seconds on first load
- Subsequent loads: <1 second (cached)

### Map Interface

**Top Left - Controls:**
- 🌊 **Heatmap** button (toggle smooth color diffusion)
- 📍 **Markers** button (toggle individual points)
- **LGA Filter** dropdown
- **Ward Filter** dropdown (appears after LGA selection)
- 🔄 **Refresh Data** button

**Bottom Right - Legend:**
- Total polling units: 5,720
- Results received: 0 (initially)
- Pending: 5,720
- Completion: 0%
- Party wins (appears when results arrive)

### Map Features
- **Zoom**: Scroll or pinch to zoom
- **Pan**: Click and drag to move
- **Heatmap**: Smooth color diffusion showing party dominance
- **Markers**: Individual polling unit points (toggle on/off)

## Testing Scenarios

### Scenario 1: View Empty Map (No Results Yet)
1. Open map
2. See all 5,720 polling units as gray points
3. Heatmap is empty (no colors)
4. Legend shows 0% completion

### Scenario 2: Add Test Results

Run this in your database:

```sql
-- Insert a test result for a polling unit
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
  'TEST-001',
  (SELECT id FROM agents LIMIT 1),
  (SELECT polling_unit_code FROM polling_units LIMIT 1),
  (SELECT ward FROM polling_units LIMIT 1),
  (SELECT lga FROM polling_units LIMIT 1),
  'Anambra',
  '{"APC": 150, "PDP": 120, "LP": 80, "APGA": 50}'::jsonb,
  400,
  'validated',
  NOW()
);
```

**Expected Result:**
- Map updates automatically (real-time)
- One polling unit changes color (winning party)
- Heatmap shows small colored area
- Legend updates: "Results received: 1"
- Party wins shows winning party

### Scenario 3: Test Filters

1. Click **LGA Filter** dropdown
2. Select any LGA (e.g., "Aguata")
3. Map zooms to show only that LGA
4. Ward filter appears
5. Select a ward to zoom further

### Scenario 4: Toggle Views

1. **Heatmap ON, Markers OFF** (default)
   - Smooth color diffusion only
   - Best for overview

2. **Heatmap ON, Markers ON**
   - Colors + individual points
   - Good for detailed analysis

3. **Heatmap OFF, Markers ON**
   - Only individual points
   - Best for precise locations

### Scenario 5: Test Caching

1. Load map (takes 2-3 seconds)
2. Refresh page (F5)
3. Map loads instantly (<1 second)
4. Data loaded from IndexedDB cache

### Scenario 6: Test Real-Time Updates

1. Open map in browser
2. Open browser console (F12)
3. Look for: "🔴 Subscribing to real-time results..."
4. Insert a result in database (see Scenario 2)
5. Console shows: "📡 Real-time update received"
6. Map updates automatically

## Performance Expectations

### Loading Times
- **First Load**: 2-3 seconds (fetching 5,720 units)
- **Cached Load**: <1 second
- **Real-time Update**: <500ms

### Data Transfer
- **Initial**: ~1.1 MB (5,720 polling units)
- **Updates**: ~1 KB per result (incremental)

### Rendering
- **Frame Rate**: 60 FPS (smooth)
- **Zoom**: Instant response
- **Pan**: Smooth dragging

## Troubleshooting

### Map Not Loading

**Check Console (F12):**
```
✅ Good: "🚀 Starting data load..."
✅ Good: "✅ Loaded 5720 polling units"
❌ Bad: "Failed to load map data"
```

**Solutions:**
1. Verify Mapbox token in `.env.local`
2. Check database connection
3. Verify polling_units table has data:
   ```sql
   SELECT COUNT(*) FROM polling_units WHERE latitude IS NOT NULL;
   ```

### Real-Time Not Working

**Check Console:**
```
✅ Good: "🔴 Subscribing to real-time results..."
✅ Good: "Real-time subscription status: SUBSCRIBED"
❌ Bad: "Real-time subscription status: CLOSED"
```

**Solutions:**
1. Check Supabase realtime is enabled
2. Verify network connection
3. Check browser allows WebSocket connections

### Slow Performance

**Solutions:**
1. Turn off markers (keep only heatmap)
2. Close other browser tabs
3. Clear cache: `indexedDB.deleteDatabase('electoral-map-cache')`

## Pre-Event Checklist

### Day Before Event (5:00 PM)

- [ ] Verify all 5,720 polling units loaded
- [ ] Test map loads in <3 seconds
- [ ] Test cache works (instant reload)
- [ ] Test real-time with sample result
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Verify Mapbox token is valid
- [ ] Check database has GPS coordinates

### Event Day (Before Polls Close)

- [ ] Pre-load map on all monitoring stations
- [ ] Verify real-time subscription active
- [ ] Test manual refresh works
- [ ] Clear old cache if needed
- [ ] Have backup plan ready

### During Event (Results Arriving)

- [ ] Monitor console for errors
- [ ] Watch for real-time updates
- [ ] Check legend statistics
- [ ] Verify colors spreading correctly
- [ ] Monitor performance

## Browser Console Commands

### Check Cache Status
```javascript
// Open IndexedDB
indexedDB.databases().then(console.log);

// Clear cache
indexedDB.deleteDatabase('electoral-map-cache');
```

### Check Real-Time Status
```javascript
// Already logged automatically
// Look for: "Real-time subscription status: SUBSCRIBED"
```

### Force Refresh
```javascript
// Click "Refresh Data" button
// Or reload page (F5)
```

## API Endpoints Used

The map uses these internal APIs:

1. **Polling Units**: `/api/polling-units` (via Supabase)
2. **Results**: `/api/results` (via Supabase)
3. **Parties**: `/api/parties` (via Supabase)
4. **Real-time**: Supabase WebSocket

## Navigation

**From Dashboard:**
1. Click "Electoral Map" in sidebar
2. Or navigate to `/dashboard/electoral-map`

**Back to Dashboard:**
1. Click "Dashboard" in sidebar
2. Or click browser back button

## Tips for Best Experience

### For Monitoring
- Use **Heatmap Only** mode (markers off)
- Full screen (F11)
- Zoom to show entire state
- Watch colors spread in real-time

### For Analysis
- Use **Both** heatmap and markers
- Zoom to specific LGA/Ward
- Use filters to focus on areas
- Check legend for statistics

### For Presentations
- Full screen mode
- Heatmap only (cleaner view)
- Zoom to show entire state
- Legend visible for context

## Next Steps

1. **Test Now**: Load the map and verify it works
2. **Add Sample Data**: Insert test results to see colors
3. **Test Real-Time**: Verify automatic updates
4. **Test Filters**: Try LGA/Ward filtering
5. **Test Performance**: Check loading times

## Support

**Documentation:**
- Full guide: `ELECTORAL_MAP_IMPLEMENTATION.md`
- This quick start: `ELECTORAL_MAP_QUICK_START.md`

**Common Issues:**
- Check browser console (F12) for errors
- Verify database connection
- Test with sample data first
- Clear cache if needed

---

**Status**: ✅ Ready for Testing  
**Build**: ✅ Passing  
**Performance**: ✅ Optimized  
**Real-Time**: ✅ Active

**Start Testing Now!** 🚀
