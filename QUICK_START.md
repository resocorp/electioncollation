# ⚡ Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Set Up Database (3 minutes)

1. **Open Supabase SQL Editor:**
   ```
   https://ncftsabdnuwemcqnlzmr.supabase.co
   ```
   - Click on **SQL Editor** in the left sidebar

2. **Run Schema (Create Tables):**
   - Open the file: `supabase/schema.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click **RUN** button
   - Wait for "Success ✔" message

3. **Run Seed Data (Load Sample Agents):**
   - Open the file: `supabase/seed-data.sql`
   - Copy ALL contents
   - Paste into Supabase SQL Editor
   - Click **RUN** button
   - Wait for "Success ✔" message

### Step 2: Verify Database Setup (30 seconds)

```bash
node scripts/test-database.js
```

**Expected Output:**
```
✅ Database connection successful
✅ Agents table exists
📊 Total agents in database: 111
✅ Sample data loaded successfully
✅ Parties configured: APGA, APC, PDP, LP, NNPP, ADC, YPP, SDP
🎉 ALL TESTS PASSED!
```

### Step 3: Start the App (30 seconds)

```bash
npm run dev
```

Open your browser: **http://localhost:3000**

### Step 4: Login & Test (1 minute)

**Login Credentials:**
- Phone: `2348000000000`
- Password: `Admin123!`

---

## 🧪 First Test: Submit a Result

### 1. Navigate to SMS Simulator
   - Click **SMS Simulator** in the sidebar

### 2. Send Test SMS
   - **Phone Number:** `2348011111101` (Chukwudi Okafor - Aguata)
   - **Message:** `R APGA:450 APC:320 PDP:280 LP:150`
   - Click **Send SMS**

### 3. Confirm Submission
   - You'll get a confirmation request
   - **Message:** `YES`
   - Click **Send SMS** again

### 4. View Result
   - Go to **Results** page
   - You should see 1 pending result
   - Click **Approve** button

### 5. Check Dashboard
   - Go back to **Dashboard**
   - You should see:
     - ✅ Submitted: 1
     - ✅ Validated: 1
     - ✅ Charts showing APGA:450, APC:320, PDP:280, LP:150

---

## 🎯 Quick Test Checklist

- [ ] Database setup complete (schema + seed data)
- [ ] Database test passed (`node scripts/test-database.js`)
- [ ] App running (`npm run dev`)
- [ ] Login successful
- [ ] SMS result submitted
- [ ] Result validated
- [ ] Dashboard updated with charts

---

## 🐛 Troubleshooting

### "Could not connect to database"
➡️ **Solution:** Run `supabase/schema.sql` in Supabase SQL Editor

### "No agents found"
➡️ **Solution:** Run `supabase/seed-data.sql` in Supabase SQL Editor

### "Phone number not registered"
➡️ **Solution:** Use one of these test numbers:
- `2348011111101` (Aguata)
- `2348011111201` (Awka North)
- `2348011111301` (Awka South)

### "npm run dev" not working
➡️ **Solution:** Make sure `npm install` completed successfully

### Dashboard not showing charts
➡️ **Solution:** Make sure you **validated** the result (not just submitted)

---

## 📱 Test Phone Numbers

Use these sample agent phone numbers for testing:

| Phone | Name | LGA | Ward |
|-------|------|-----|------|
| 2348011111101 | Chukwudi Okafor | Aguata | Aguata I |
| 2348011111201 | Obiora Udoka | Awka North | Amansea |
| 2348011111301 | Nkechi Chukwu | Awka South | Awka I |
| 2348011111401 | Chika Onwurah | Anambra East | Nando |

---

## 📋 SMS Command Examples

### Submit Results
```
R APGA:450 APC:320 PDP:280 LP:150
```

### Report Incident
```
I Vote buying observed at polling unit entrance
```

### Check Status
```
STATUS
```

### Get Help
```
HELP
```

---

## 🌐 Next: Test with GoIP

Once local testing works, use **ngrok** to test with real GoIP:

```bash
ngrok http 3000
```

Copy the `https://` URL and configure it in your GoIP device:
- SMS to HTTP URL: `https://YOUR-NGROK-URL.ngrok.io/api/sms/goip/incoming`
- Method: POST

---

## ✨ That's it!

You should now have a fully working election collation system.

**Need help?** Check `SETUP_INSTRUCTIONS.md` for detailed documentation.
