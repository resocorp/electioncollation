# Election Collation System - Setup Instructions

## 🚀 Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

#### Step 2.1: Access Supabase SQL Editor
1. Go to your Supabase project: https://ncftsabdnuwemcqnlzmr.supabase.co
2. Navigate to **SQL Editor** (left sidebar)

#### Step 2.2: Run Database Schema
1. Copy the entire contents of `supabase/schema.sql`
2. Paste into the SQL Editor
3. Click **Run** to execute
4. Wait for confirmation (should see "Success" message)

#### Step 2.3: Load Sample Data
1. Copy the entire contents of `supabase/seed-data.sql`
2. Paste into the SQL Editor
3. Click **Run** to execute
4. This will create 105 sample agents across all 21 LGAs in Anambra State

### 3. Verify Environment Variables

Check that `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ncftsabdnuwemcqnlzmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yfqwdfHDBZGJ48k2viDaag_3onwq4BC
SUPABASE_SERVICE_ROLE_KEY=sb_secret_uSVP_KNYYxQV6KEdgBN2fQ_oyJL2TzI
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Login Credentials

### Admin Account
- **Phone:** `2348000000000`
- **Password:** `Admin123!`

---

## ✅ Testing Core Functionalities

### Test 1: Agent Onboarding

#### Single Agent Registration
1. Login with admin credentials
2. Navigate to **Agents** page
3. Click **Add Agent** button
4. Fill in the form:
   - Name: `Test Agent`
   - Phone: `2348099999999`
   - Polling Unit: `PU999TEST`
   - Ward: `Test Ward`
   - LGA: `Aguata`
   - Role: `pu_agent`
5. Click **Add Agent**
6. Verify agent appears in the list

#### Bulk Upload (CSV)
1. Go to **Agents** → **Bulk Upload** tab
2. Click **Download Template** to get CSV format
3. Prepare CSV file with multiple agents
4. Upload the CSV file
5. Verify success/failure count
6. Check agent list for new entries

### Test 2: SMS Result Submission

1. Navigate to **SMS Simulator** page
2. Use a sample agent phone number (e.g., `2348011111101`)
3. Send result SMS:
   ```
   R APGA:450 APC:320 PDP:280 LP:150
   ```
4. System should respond with confirmation request
5. Reply with: `YES`
6. Check **Results** page to see the submission (status: Pending)

#### Test Different SMS Commands
- **Incident Report:**
  ```
  I Vote buying observed at polling unit entrance
  ```
- **Status Check:**
  ```
  STATUS
  ```
- **Help:**
  ```
  HELP
  ```

### Test 3: Live Dashboard

1. After submitting results, go to **Dashboard**
2. Verify stats update:
   - Total PUs: 105 (from seed data)
   - Submitted: Should show your test submission
   - Charts should update when results are validated
3. Dashboard auto-refreshes every 60 seconds

### Test 4: Result Validation

1. Navigate to **Results** page
2. Click **Pending** tab
3. Find your submitted result
4. Click **Approve** button
5. Result status changes to "Validated"
6. Go back to **Dashboard** to see updated vote counts and charts

### Test 5: Incident Management

1. Use SMS Simulator to report an incident:
   ```
   I Violence reported near polling station
   ```
2. Navigate to **Incidents** page
3. Find the reported incident
4. Change status to "Investigating"
5. Later, change to "Resolved" and add resolution notes
6. Verify incident tracking works correctly

---

## 🌐 Testing with GoIP (Production)

### For ngrok Testing

1. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

2. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

3. **Configure GoIP:**
   - Access GoIP web interface
   - Navigate to **SMS to HTTP** settings
   - Enable SMS forwarding
   - Set URL: `https://abc123.ngrok.io/api/sms/goip/incoming`
   - Method: `POST`
   - Save settings

4. **Test with real SMS:**
   - Send SMS from registered agent phone to GoIP number
   - Format: `R APGA:450 APC:320 PDP:280 LP:150`
   - GoIP forwards to your ngrok URL
   - Check dashboard for real-time updates

---

## 📊 Database Verification

### Check Tables in Supabase

1. Go to **Table Editor** in Supabase
2. Verify these tables exist:
   - `agents` (should have 105+ rows after seed)
   - `election_results`
   - `incident_reports`
   - `sms_logs`
   - `sms_sessions`
   - `parties` (should have 8 parties)
   - `audit_logs`

### Query Sample Data

Run in SQL Editor:
```sql
-- Count agents by LGA
SELECT lga, COUNT(*) as count 
FROM agents 
WHERE role = 'pu_agent' 
GROUP BY lga 
ORDER BY lga;

-- View all parties
SELECT * FROM parties ORDER BY display_order;

-- Check recent results
SELECT * FROM election_results ORDER BY submitted_at DESC LIMIT 10;
```

---

## 🔧 Troubleshooting

### Issue: "Error fetching data"
- Check Supabase URL and keys in `.env.local`
- Verify database schema was executed successfully
- Check browser console for detailed errors

### Issue: "Phone number not registered"
- Make sure seed data was loaded
- Check phone number format (must be `234xxxxxxxxxx`)
- Verify agent exists in Supabase Table Editor

### Issue: "Invalid SMS format"
- Check SMS format guide in SMS Simulator
- Party acronyms must be uppercase: APGA, APC, PDP, LP, etc.
- Format: `R PARTY:VOTES PARTY:VOTES`

### Issue: Dashboard not updating
- Hard refresh browser (Ctrl+Shift+R)
- Check if results are "validated" (only validated results show in charts)
- Verify Supabase Realtime is enabled

---

## 📱 Sample Test Workflow

### Complete End-to-End Test

1. **Login** as admin (`2348000000000` / `Admin123!`)
2. **View Dashboard** - should show 105 total PUs, 0 submitted
3. **Go to SMS Simulator**
4. **Submit result** from `2348011111101` (Chukwudi Okafor - Aguata):
   ```
   R APGA:450 APC:320 PDP:280 LP:150
   ```
5. **Confirm** with `YES`
6. **Check Results** page - should see 1 pending result
7. **Approve** the result
8. **Return to Dashboard** - should show:
   - Submitted: 1
   - Validated: 1
   - Charts showing APGA:450, APC:320, PDP:280, LP:150
9. **Submit incident** from same agent:
   ```
   I Vote buying observed
   ```
10. **Check Incidents** page - should see 1 reported incident
11. **Update incident** status to "Investigating"
12. **Verify all changes** reflected in dashboard stats

---

## 🎯 Next Steps

After testing core functionality:

1. **Configure GoIP for production use**
2. **Set up ngrok or deploy to Digital Ocean**
3. **Configure webhook URL in GoIP**
4. **Register actual agents** (replace seed data)
5. **Train field agents** on SMS commands
6. **Monitor system** on election day

---

## 📞 Support

For issues during testing:
- Check browser console for errors
- Review Supabase logs
- Check SMS logs in database
- Verify network connectivity

---

## ✨ Features Implemented

✅ Agent registration (single + bulk CSV)
✅ SMS webhook endpoint (GoIP compatible)
✅ SMS parser (results + incidents)
✅ Result submission workflow with confirmation
✅ Real-time dashboard with charts
✅ Result validation system
✅ Incident reporting and tracking
✅ SMS simulator for testing
✅ Role-based access control
✅ Comprehensive audit logging
✅ Anambra State data (21 LGAs, 8 parties)

---

**Ready to test! Start with Step 1-4 above and proceed through the test cases.** 🚀
