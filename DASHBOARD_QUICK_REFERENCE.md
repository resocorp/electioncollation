# Dashboard Quick Reference

## 📊 Stats Cards Overview

### Card 1: PU Agents Profiled
**What it shows:** Number of polling unit agents who have been profiled in the system

**Calculation:**
```
Profiled Agents = COUNT(agents WHERE role = 'pu_agent')
Expected Total = COUNT(polling_units)
Percentage = (Profiled / Expected) × 100
```

**Example Display:**
```
150
of 5720 total PUs (3%)
```

**Use Case:** Track agent recruitment and profiling progress

---

### Card 2: Results Submitted
**What it shows:** Number of results submitted vs expected total

**Calculation:**
```
Submitted = COUNT(election_results)
Expected = COUNT(polling_units)
Percentage = (Submitted / Expected) × 100
```

**Example Display:**
```
1,234
vs 5720 expected (22%)
```

**Use Case:** Monitor result submission progress in real-time

---

### Card 3: Pending Validation
**What it shows:** Results awaiting validation and already validated count

**Calculation:**
```
Pending = COUNT(election_results WHERE validation_status = 'pending')
Validated = COUNT(election_results WHERE validation_status = 'validated')
```

**Example Display:**
```
45
234 validated
```

**Use Case:** Track validation workflow and backlog

---

### Card 4: Incidents
**What it shows:** Total incidents with breakdown by status

**Calculation:**
```
Total = COUNT(incident_reports)
Investigating = COUNT(incident_reports WHERE status = 'investigating')
Resolved = COUNT(incident_reports WHERE status IN ('resolved', 'closed'))
```

**Example Display:**
```
12
3 investigating, 8 resolved
```

**Use Case:** Monitor incident management and resolution

---

## 📡 Live Results Feed

### What it shows
Real-time feed of the 5 most recently validated election results

### Update Frequency
Refreshes every 30 seconds automatically

### Information Displayed
For each result:
- **Polling Unit Code** (e.g., "PU001")
- **Location** (Ward, LGA)
- **Validation Time** (e.g., "2:45:30 PM")
- **Party Votes** (color-coded by party)
- **Total Votes**
- **Agent Name** (who submitted)

### Example Entry
```
┌─────────────────────────────────────────┐
│ PU001                      2:45:30 PM   │
│ Ward 1, Awka North                      │
│                                         │
│ APC: 120    PDP: 95                    │
│ APGA: 200   LP: 85                     │
│                                         │
│ Total: 500 votes    By: John Doe       │
└─────────────────────────────────────────┘
```

---

## 🎨 Party Color Coding

All party names are color-coded consistently across the dashboard:

| Party | Color | Hex Code |
|-------|-------|----------|
| APGA  | Green | #006600  |
| APC   | Blue  | #0066CC  |
| PDP   | Red   | #FF0000  |
| LP    | Crimson | #DC143C |
| NNPP  | Orange | #FF6600 |
| ADC   | Forest Green | #228B22 |
| YPP   | Royal Blue | #4169E1 |
| SDP   | Gold | #FFD700 |

---

## 🔄 Auto-Refresh Intervals

| Component | Refresh Rate | Purpose |
|-----------|--------------|---------|
| Stats Cards | 60 seconds | Reduce server load |
| Live Feed | 30 seconds | Near real-time updates |
| Charts | 60 seconds | Sync with stats |

---

## 📱 Responsive Breakpoints

| Screen Size | Stats Layout | Party Votes Layout |
|-------------|--------------|-------------------|
| Desktop (≥1024px) | 4 columns | 4 columns |
| Tablet (768-1023px) | 2 columns | 4 columns |
| Mobile (<768px) | 1 column | 2 columns |

---

## 🔗 API Endpoints

### Get Dashboard Stats
```
GET /api/dashboard/stats
```

**Optional Query Parameters:**
- `lga` - Filter by Local Government Area
- `ward` - Filter by Ward

**Response:**
```json
{
  "expectedTotalPUs": 5720,
  "profiledAgents": 150,
  "profilingPercentage": 3,
  "submittedCount": 1234,
  "validatedCount": 234,
  "pendingCount": 45,
  "submissionPercentage": 22,
  "totalIncidents": 12,
  "investigatingIncidents": 3,
  "resolvedIncidents": 8,
  "partyVotes": { "APC": 120, "PDP": 95, ... },
  "totalVotes": 500
}
```

### Get Latest Results
```
GET /api/dashboard/latest-results?limit=5
```

**Query Parameters:**
- `limit` - Number of results (default: 10)

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "pollingUnit": "PU001",
      "ward": "Ward 1",
      "lga": "Awka North",
      "partyVotes": { "APC": 120, ... },
      "totalVotes": 500,
      "validatedAt": "2025-10-26T14:45:30Z",
      "agentName": "John Doe"
    }
  ],
  "count": 5
}
```

---

## 🎯 Key Metrics Explained

### Profiling Percentage
Indicates how many polling units have assigned agents
- **Target:** 100%
- **Critical:** < 50%
- **Good:** > 90%

### Submission Percentage
Shows result submission progress
- **Target:** 100%
- **Warning:** < 70% (after polls close)
- **Good:** > 95%

### Validation Backlog
Pending results awaiting review
- **Target:** 0
- **Warning:** > 100
- **Critical:** > 500

### Incident Resolution Rate
Percentage of resolved incidents
- **Formula:** (Resolved / Total) × 100
- **Target:** > 90%
- **Critical:** < 50%

---

## 🚨 Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Profiling % | < 70% | < 50% |
| Submission % | < 80% | < 60% |
| Pending Validation | > 100 | > 500 |
| Unresolved Incidents | > 20 | > 50 |

---

## 💡 Tips for Monitoring

1. **Check profiling progress daily** before election day
2. **Monitor submission rate** every 30 minutes on election day
3. **Prioritize validation** when pending count > 50
4. **Escalate incidents** that remain investigating > 2 hours
5. **Watch for anomalies** in party vote distributions
6. **Export data regularly** for backup and analysis

---

## 🔧 Troubleshooting

### Stats showing 0 when data exists
- Check database connection
- Verify RLS policies are enabled
- Check user authentication

### Live feed not updating
- Check browser console for errors
- Verify network connectivity
- Clear browser cache

### Percentages showing NaN
- Ensure polling_units table has data
- Check for division by zero
- Verify data types in calculations

### Party colors not displaying
- Check party acronym spelling
- Verify PARTY_COLORS object
- Check CSS loading

---

## 📞 Support

For technical issues:
1. Check browser console (F12)
2. Review error logs
3. Test API endpoints directly
4. Check database connectivity
5. Contact system administrator

---

## 📚 Related Documentation

- `DASHBOARD_ENHANCEMENTS.md` - Implementation details
- `TESTING_GUIDE.md` - Testing procedures
- `IMPLEMENTATION_CHECKLIST.md` - Deployment checklist
- `README.md` - General project information
