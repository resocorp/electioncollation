# Dashboard Testing Guide

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the dashboard:**
   Navigate to `http://localhost:3000/dashboard`

3. **Run API tests:**
   ```bash
   node scripts/test-dashboard-api.js
   ```

## What to Test

### 1. Enhanced Stats Cards

#### PU Agents Profiled Card
- **Expected:** Shows number of profiled agents
- **Details line:** "of X total PUs (Y%)"
- **Verify:** 
  - Number matches agents with role='pu_agent'
  - Total matches polling_units table count
  - Percentage calculation is correct

#### Results Submitted Card
- **Expected:** Shows submitted results count
- **Details line:** "vs X expected (Y%)"
- **Verify:**
  - Count matches election_results table
  - Expected matches polling_units count
  - Percentage is submitted/expected * 100

#### Pending Validation Card
- **Expected:** Shows pending count
- **Details line:** "X validated"
- **Verify:**
  - Pending count matches validation_status='pending'
  - Validated count matches validation_status='validated'

#### Incidents Card
- **Expected:** Shows total incidents
- **Details line:** "X investigating, Y resolved"
- **Verify:**
  - Total matches incident_reports count
  - Investigating matches status='investigating'
  - Resolved matches status IN ('resolved', 'closed')

### 2. Live Results Feed

#### Display
- **Location:** Below the charts section
- **Title:** "Latest Results"
- **Subtitle:** "Real-time feed of validated results"

#### Content
Each result card should show:
- ✅ Polling unit code (bold)
- ✅ Ward and LGA (small gray text)
- ✅ Validation time (badge, top-right)
- ✅ Party votes in grid (2-4 columns, color-coded)
- ✅ Total votes count
- ✅ Agent name who submitted

#### Behavior
- **Auto-refresh:** Every 30 seconds
- **Limit:** Shows 5 most recent results
- **Sorting:** Newest first (by validated_at DESC)
- **Empty state:** "No validated results yet"

### 3. Auto-Refresh

- **Stats cards:** Refresh every 60 seconds
- **Live feed:** Refresh every 30 seconds
- **Verify:** Open browser console and watch for fetch requests

### 4. Responsive Design

Test on different screen sizes:
- **Desktop (1920x1080):** 4 columns for stats, 4 columns for party votes
- **Tablet (768px):** 2 columns for stats, 4 columns for party votes
- **Mobile (375px):** 1 column for stats, 2 columns for party votes

## Manual Testing Steps

### Test 1: Empty Database
```sql
-- Clear all data
DELETE FROM election_results;
DELETE FROM agents WHERE role = 'pu_agent';
DELETE FROM incident_reports;
```

**Expected Results:**
- All stats show 0
- Live feed shows "No validated results yet"
- No errors in console

### Test 2: Add Sample Agent
```sql
INSERT INTO agents (phone_number, name, polling_unit_code, ward, lga, state, role)
VALUES ('2348012345678', 'Test Agent', 'PU001', 'Ward 1', 'Awka North', 'Anambra', 'pu_agent');
```

**Expected Results:**
- "PU Agents Profiled" shows 1
- Profiling percentage updates

### Test 3: Add Sample Result
```sql
INSERT INTO election_results (
  reference_id, agent_id, polling_unit_code, ward, lga, state,
  party_votes, total_votes, validation_status, validated_at
)
VALUES (
  'TEST001',
  (SELECT id FROM agents WHERE phone_number = '2348012345678'),
  'PU001', 'Ward 1', 'Awka North', 'Anambra',
  '{"APC": 120, "PDP": 95, "APGA": 200, "LP": 85}'::jsonb,
  500,
  'validated',
  NOW()
);
```

**Expected Results:**
- "Results Submitted" shows 1
- Live feed shows the new result
- Charts update with party votes
- Total validated votes shows 500

### Test 4: Add Sample Incident
```sql
INSERT INTO incident_reports (
  reference_id, agent_id, polling_unit_code, ward, lga, state,
  incident_type, description, severity, status
)
VALUES (
  'INC001',
  (SELECT id FROM agents WHERE phone_number = '2348012345678'),
  'PU001', 'Ward 1', 'Awka North', 'Anambra',
  'general', 'Test incident', 'medium', 'investigating'
);
```

**Expected Results:**
- "Incidents" shows 1
- Details show "1 investigating, 0 resolved"

### Test 5: Resolve Incident
```sql
UPDATE incident_reports
SET status = 'resolved', resolved_at = NOW()
WHERE reference_id = 'INC001';
```

**Expected Results:**
- Details update to "0 investigating, 1 resolved"

## API Testing

### Test Stats Endpoint
```bash
curl http://localhost:3000/api/dashboard/stats | json_pp
```

**Expected Response:**
```json
{
  "expectedTotalPUs": 5720,
  "profiledAgents": 1,
  "profilingPercentage": 0,
  "submittedCount": 1,
  "validatedCount": 1,
  "pendingCount": 0,
  "submissionPercentage": 0,
  "totalIncidents": 1,
  "criticalIncidents": 0,
  "highIncidents": 0,
  "investigatingIncidents": 0,
  "resolvedIncidents": 1,
  "reportedIncidents": 0,
  "partyVotes": {
    "APC": 120,
    "PDP": 95,
    "APGA": 200,
    "LP": 85
  },
  "totalVotes": 500
}
```

### Test Latest Results Endpoint
```bash
curl "http://localhost:3000/api/dashboard/latest-results?limit=5" | json_pp
```

**Expected Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "referenceId": "TEST001",
      "pollingUnit": "PU001",
      "ward": "Ward 1",
      "lga": "Awka North",
      "partyVotes": {
        "APC": 120,
        "PDP": 95,
        "APGA": 200,
        "LP": 85
      },
      "totalVotes": 500,
      "validatedAt": "2025-10-26T...",
      "agentName": "Test Agent",
      "agentPhone": "2348012345678"
    }
  ],
  "count": 1
}
```

## Browser Console Tests

Open browser console and run:

```javascript
// Test stats fetch
fetch('/api/dashboard/stats')
  .then(r => r.json())
  .then(console.log);

// Test latest results fetch
fetch('/api/dashboard/latest-results?limit=5')
  .then(r => r.json())
  .then(console.log);
```

## Performance Testing

1. **Check load time:** Dashboard should load in < 2 seconds
2. **Monitor memory:** No memory leaks from intervals
3. **Network tab:** Verify refresh intervals (30s and 60s)

## Common Issues & Solutions

### Issue: Stats show 0 when data exists
**Solution:** Check RLS policies on polling_units table

### Issue: Live feed not updating
**Solution:** 
- Check browser console for errors
- Verify validation_status='validated' in database
- Check validated_at timestamp is not null

### Issue: Party colors not showing
**Solution:** Verify party acronyms match PARTY_COLORS object

### Issue: Percentages showing NaN
**Solution:** Check expectedTotalPUs is not 0

## Success Criteria

✅ All stats cards display correct data  
✅ Live feed shows latest 5 validated results  
✅ Auto-refresh works (30s for feed, 60s for stats)  
✅ Responsive layout works on all screen sizes  
✅ Party colors are consistent  
✅ No console errors  
✅ Empty states display correctly  
✅ Timestamps show in local time  
✅ API endpoints return valid JSON  
✅ Database queries are efficient (< 500ms)  

## Next Steps

After testing, you can:
1. Add filters by LGA/Ward
2. Add export functionality
3. Add real-time notifications for new results
4. Add charts for incident trends
5. Add map view for polling units
