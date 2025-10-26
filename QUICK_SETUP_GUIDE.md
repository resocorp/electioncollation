# Quick Setup Guide - Optimized Agent Flow

## What Was Built

✅ **Cascading Dropdowns** for Add New Agent:
- State → LGA → Ward → Polling Unit
- Automatic GPS coordinates from polling unit database
- Shows registered voters count

✅ **New Database Table**: `polling_units`
- Stores all polling unit master data
- GPS coordinates (latitude, longitude)
- Ready to import from Google Sheets

✅ **New API Endpoint**: `/api/polling-units`
- Returns states, LGAs, wards, polling units
- Filtered cascading data

✅ **Updated Agent Form**: Clean, modern UI with auto-populated GPS

## Setup in 5 Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install the new `tsx` package for running the import script.

### Step 2: Apply Database Migration

**Option A: Via Supabase Dashboard**
1. Go to https://ncftsabdnuwemcqnlzmr.supabase.co
2. Click "SQL Editor" in sidebar
3. Open file: `supabase/migrations/003_polling_units.sql`
4. Copy all the SQL
5. Paste in SQL Editor
6. Click "Run"

**Option B: Via Command Line** (if you have Supabase CLI)
```bash
supabase db push
```

You should see:
- ✅ Table `polling_units` created
- ✅ Columns added to `agents`, `election_results`, `incident_reports`

### Step 3: Export Google Sheets Data

1. Open the Google Sheet:
   https://docs.google.com/spreadsheets/d/1-f5rlmkix9IcMiz_iIgtomgzBadyGdLoAsoZt7m1sd8/edit?gid=1436370438

2. File → Download → Comma Separated Values (.csv)

3. Save as: `scripts/anambra-polling-units.csv`

### Step 4: Import Polling Unit Data

```bash
npm run import-polling-units
```

You should see:
```
=== Polling Units Import Tool ===

✓ Found CSV file: scripts/anambra-polling-units.csv
✓ Parsed 4,000+ polling units from CSV

Sample data:
{
  "state": "Anambra",
  "lga": "Aguata",
  "ward": "Aguata I",
  "polling_unit_code": "PU001AG",
  "polling_unit_name": "Central School I",
  "latitude": 6.12345,
  "longitude": 7.23456,
  "registered_voters": 450
}

Importing 4,000+ polling units...
✓ Imported batch 1 (100/4000)
✓ Imported batch 2 (200/4000)
...

=== Import Summary ===
✓ Success: 4,000+
✗ Errors: 0
Total: 4,000+

✅ Import completed successfully!
```

### Step 5: Test the New Form

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/dashboard/agents

3. Click "Add Agent" button

4. Try the cascading dropdowns:
   - Select **State**: Anambra
   - Select **LGA**: (choose one)
   - Select **Ward**: (choose one)
   - Select **Polling Unit**: (choose one)
   - ✅ GPS coordinates auto-populate!

5. Fill in Name, Phone, Email

6. Click "Add Agent"

7. ✅ Agent created with GPS coordinates!

## Verify Setup

### Check Database

Go to Supabase → Table Editor → `polling_units`:

**You should see:**
- ~4,000+ rows for Anambra
- Columns: state, lga, ward, polling_unit_code, polling_unit_name, latitude, longitude, registered_voters

### Check API

Test the API endpoints:

**1. Get States:**
```
http://localhost:3000/api/polling-units?type=states
```

**2. Get LGAs for Anambra:**
```
http://localhost:3000/api/polling-units?type=lgas&state=Anambra
```

**3. Get Wards for Aguata:**
```
http://localhost:3000/api/polling-units?type=wards&state=Anambra&lga=Aguata
```

**4. Get Polling Units:**
```
http://localhost:3000/api/polling-units?type=polling_units&state=Anambra&lga=Aguata&ward=Aguata I
```

### Check Agent Form

Add a test agent:
- ✅ Cascading dropdowns work
- ✅ GPS coordinates show when polling unit selected
- ✅ Registered voters count displays
- ✅ Form submits successfully
- ✅ Agent has GPS coordinates in database

## What's Next?

### Immediate
1. ✅ Test with real data
2. ✅ Add more agents using new form
3. ✅ Verify GPS coordinates are correct

### Short-term
1. ⏳ Update bulk upload to use polling unit codes
2. ⏳ Add CSV template with polling unit codes
3. ⏳ Add validation to prevent duplicate agents per PU

### Long-term
1. 🔮 Build map visualization of agents
2. 🔮 Coverage analytics dashboard
3. 🔮 Expand to other states
4. 🔮 Mobile app with GPS auto-detection

## Troubleshooting

### "CSV file not found!"
**Solution:** Make sure you saved the CSV as `scripts/anambra-polling-units.csv`

### "No LGAs showing"
**Solution:** 
1. Check if polling units were imported: Go to Supabase → Table Editor → polling_units
2. If empty, run the import script again

### "GPS coordinates not showing"
**Solution:** 
1. Check if the CSV has LATITUDE and LONGITUDE columns
2. Re-import with GPS data

### "Dropdown shows Loading... forever"
**Solution:**
1. Open browser console (F12)
2. Check for API errors
3. Verify Supabase connection in .env.local

### Import script fails
**Solution:**
1. Check CSV format matches expected structure
2. Ensure STATE, LGA, WARD, POLLING_UNIT_CODE, POLLING_UNIT_NAME columns exist
3. Check environment variables in .env.local

## Files Reference

### New Files
- `src/components/add-agent-form.tsx` - New agent form with cascading dropdowns
- `src/app/api/polling-units/route.ts` - API for polling unit data
- `supabase/migrations/003_polling_units.sql` - Database migration
- `scripts/import-polling-units.ts` - CSV import tool
- `OPTIMIZED_AGENT_FLOW.md` - Detailed documentation

### Modified Files
- `src/app/dashboard/agents/page.tsx` - Updated to use new form
- `package.json` - Added import script

### Database Changes
- New table: `polling_units`
- Updated: `agents` (added lat/lng)
- Updated: `election_results` (added lat/lng)
- Updated: `incident_reports` (added lat/lng)

## Support

If you encounter any issues:
1. Check this guide
2. Read `OPTIMIZED_AGENT_FLOW.md` for detailed documentation
3. Check browser console for errors
4. Verify Supabase connection

---

**Setup complete!** The optimized agent flow is ready to use. 🎉
