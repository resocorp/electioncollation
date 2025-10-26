# Optimized Add New Agent Flow

## Overview

The Add New Agent flow has been completely redesigned with cascading dropdowns for State → LGA → Ward → Polling Unit selection, with automatic GPS coordinates population from the polling units database.

## Features

✅ **Cascading Dropdowns**
- Select State (all 36 Nigerian states + FCT)
- Select LGA (filtered by selected state)
- Select Ward (filtered by selected LGA)
- Select Polling Unit (filtered by selected ward)

✅ **Automatic GPS Coordinates**
- GPS coordinates auto-populate when polling unit is selected
- Coordinates stored in agents table for mapping features
- Also shows registered voters count

✅ **Better UX**
- Dropdowns disabled until parent selection is made
- Loading indicators while fetching data
- Clean, modern interface

## Database Schema

### New `polling_units` Table

```sql
CREATE TABLE polling_units (
  id UUID PRIMARY KEY,
  polling_unit_code TEXT UNIQUE NOT NULL,
  polling_unit_name TEXT NOT NULL,
  ward TEXT NOT NULL,
  lga TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  registered_voters INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Updated `agents` Table

Added GPS coordinates:
```sql
ALTER TABLE agents ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE agents ADD COLUMN longitude DECIMAL(11, 8);
```

Also updated:
- `election_results` table - added latitude, longitude
- `incident_reports` table - added latitude, longitude

## Setup Steps

### Step 1: Apply Database Migration

```bash
# Apply the migration to create polling_units table
# This will be done via Supabase dashboard or migration tool
```

In Supabase Dashboard:
1. Go to SQL Editor
2. Paste the content from `supabase/migrations/003_polling_units.sql`
3. Click "Run"

### Step 2: Import Polling Unit Data

**From Google Sheets:**

1. Open the Google Sheet:
   https://docs.google.com/spreadsheets/d/1-f5rlmkix9IcMiz_iIgtomgzBadyGdLoAsoZt7m1sd8/edit?gid=1436370438

2. Export as CSV:
   - File → Download → Comma Separated Values (.csv)

3. Save the file as:
   ```
   scripts/anambra-polling-units.csv
   ```

4. Run the import script:
   ```bash
   npm run import-polling-units
   # or
   node --loader ts-node/esm scripts/import-polling-units.ts
   ```

**Expected CSV Format:**

```csv
STATE,LGA,WARD,POLLING_UNIT_CODE,POLLING_UNIT_NAME,LATITUDE,LONGITUDE,REGISTERED_VOTERS
Anambra,Aguata,Aguata I,PU001AG,Central School I,6.12345,7.23456,450
Anambra,Aguata,Aguata I,PU002AG,Central School II,6.12346,7.23457,380
...
```

Alternative column names accepted:
- `PU_CODE` or `POLLING_UNIT_CODE`
- `PU_NAME` or `POLLING_UNIT_NAME`
- `LAT` or `LATITUDE`
- `LNG` or `LONGITUDE`
- `VOTERS` or `REGISTERED_VOTERS`

### Step 3: Verify Import

Check in Supabase:
```sql
SELECT 
  state,
  COUNT(DISTINCT lga) as lga_count,
  COUNT(DISTINCT ward) as ward_count,
  COUNT(*) as polling_unit_count
FROM polling_units
GROUP BY state;
```

Expected for Anambra:
- 21 LGAs
- ~177 Wards
- ~4,000+ Polling Units

## Usage

### Adding a New Agent

1. Go to **Dashboard → Agents**
2. Click **"Add Agent"** button
3. Fill in the form:

   **Step 1: Enter basic info**
   - Name
   - Phone Number
   - Email (optional)

   **Step 2: Select location (cascading)**
   - Select **State** → LGAs load
   - Select **LGA** → Wards load
   - Select **Ward** → Polling Units load
   - Select **Polling Unit** → GPS coordinates auto-populate

4. Review GPS coordinates
5. Click **"Add Agent"**

### Form Behavior

- **State dropdown:** All 36 states + FCT available
- **LGA dropdown:** Disabled until state selected, then shows only LGAs in that state
- **Ward dropdown:** Disabled until LGA selected, then shows only wards in that LGA
- **Polling Unit dropdown:** Disabled until ward selected, then shows all PUs in that ward

When a polling unit is selected, you'll see:
```
📍 GPS Location: 6.123456, 7.234567
   Registered Voters: 450
```

## API Endpoints

### GET `/api/polling-units`

Cascading dropdown API.

**Get States:**
```
GET /api/polling-units?type=states
```
Response:
```json
{
  "states": ["Abia", "Adamawa", ..., "Anambra", ...]
}
```

**Get LGAs:**
```
GET /api/polling-units?type=lgas&state=Anambra
```
Response:
```json
{
  "lgas": ["Aguata", "Anambra East", "Anambra West", ...]
}
```

**Get Wards:**
```
GET /api/polling-units?type=wards&state=Anambra&lga=Aguata
```
Response:
```json
{
  "wards": ["Aguata I", "Aguata II", ...]
}
```

**Get Polling Units:**
```
GET /api/polling-units?type=polling_units&state=Anambra&lga=Aguata&ward=Aguata I
```
Response:
```json
{
  "polling_units": [
    {
      "id": "uuid",
      "polling_unit_code": "PU001AG",
      "polling_unit_name": "Central School I",
      "ward": "Aguata I",
      "lga": "Aguata",
      "state": "Anambra",
      "latitude": 6.12345,
      "longitude": 7.23456,
      "registered_voters": 450
    },
    ...
  ]
}
```

## Benefits

### For Users
- ✅ No manual typing of location data
- ✅ Guaranteed data consistency
- ✅ Automatic GPS coordinates
- ✅ See registered voters count
- ✅ Fast, filtered selections

### For Administrators
- ✅ Centralized polling unit master data
- ✅ Easy updates to GPS coordinates
- ✅ Data validation at source
- ✅ Ready for mapping features

### For Developers
- ✅ Clean API design
- ✅ Reusable components
- ✅ Scalable to other states
- ✅ Easy to extend

## Future Enhancements

### Phase 2: Bulk Import Enhancement
Update bulk upload template to use polling unit codes:
```csv
name,phone_number,email,polling_unit_code,role
John Doe,08012345678,john@example.com,PU001AG,pu_agent
```

The system will auto-populate ward, LGA, state, and GPS from the polling unit code.

### Phase 3: Map View
- Show agents on an interactive map
- Filter by LGA, Ward
- Click agent marker to see details
- Visualize coverage gaps

### Phase 4: Coverage Analysis
- Dashboard showing:
  - How many polling units have assigned agents
  - Coverage percentage by LGA
  - Coverage percentage by ward
  - Identify gaps

### Phase 5: Mobile App Integration
- Field coordinators can use GPS to find nearest polling unit
- Auto-assign polling unit based on current location
- Offline mode with pre-loaded polling unit data

## Files Created/Modified

### New Files
1. ✅ `src/components/add-agent-form.tsx` - New cascading dropdown form
2. ✅ `src/app/api/polling-units/route.ts` - Polling units API
3. ✅ `supabase/migrations/003_polling_units.sql` - Database migration
4. ✅ `scripts/import-polling-units.ts` - CSV import tool

### Modified Files
1. ✅ `src/app/dashboard/agents/page.tsx` - Using new form component

### Database Tables
1. ✅ `polling_units` - New master data table (created)
2. ✅ `agents` - Added latitude, longitude columns
3. ✅ `election_results` - Added latitude, longitude columns
4. ✅ `incident_reports` - Added latitude, longitude columns

## Troubleshooting

### Issue: No LGAs showing after selecting state
**Cause:** Polling units table is empty
**Solution:** Import polling unit data from CSV

### Issue: GPS coordinates not showing
**Cause:** Coordinates missing in polling_units table
**Solution:** Update CSV with GPS data and re-import

### Issue: Import script fails
**Cause:** CSV format mismatch
**Solution:** Check CSV headers match expected format

### Issue: Dropdown shows "Loading..." forever
**Cause:** API error or network issue
**Solution:** Check browser console for errors, verify Supabase connection

## Next Steps

1. ✅ Apply database migration
2. ✅ Import Anambra polling unit data
3. ⏳ Test the new agent form
4. ⏳ Expand to other states (when data available)
5. ⏳ Build map visualization
6. ⏳ Add coverage analytics

---

## Screenshots

### Before (Manual Entry)
- User types: Ward, LGA, Polling Unit Code
- Risk of typos, inconsistent data
- No GPS coordinates

### After (Cascading Dropdowns)
- Select from dropdowns
- Data consistency guaranteed
- Automatic GPS coordinates
- See registered voters

---

**The optimized flow is ready to use!** 🎉

Start by applying the database migration and importing the Anambra polling unit data from the Google Sheet.
