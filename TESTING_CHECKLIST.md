# 🧪 Testing Checklist - Anambra Election Collation System

## ✅ Pre-Flight Setup

### Database Setup
- [ ] Opened Supabase SQL Editor (https://ncftsabdnuwemcqnlzmr.supabase.co)
- [ ] Executed `supabase/schema.sql` successfully
- [ ] Executed `supabase/seed-data.sql` successfully
- [ ] Ran `npm run test-db` - All tests passed ✅
- [ ] Verified 111 agents loaded (105 PU agents + 6 coordinators)
- [ ] Verified 8 parties configured (APGA, APC, PDP, LP, NNPP, ADC, YPP, SDP)

### Application Setup
- [ ] Dependencies installed (`npm install` completed)
- [ ] Environment variables configured (`.env.local` exists)
- [ ] Development server started (`npm run dev`)
- [ ] Application accessible at http://localhost:3000
- [ ] Login page loads correctly

---

## 🔐 Test 1: Authentication

- [ ] Login with admin credentials (2348000000000 / Admin123!)
- [ ] Dashboard loads successfully
- [ ] Sidebar navigation visible
- [ ] User name displayed in sidebar
- [ ] Role shows as "admin"

**Expected Result:** ✅ Full access to all menu items

---

## 👥 Test 2: Agent Management

### View Agents
- [ ] Navigate to **Agents** page
- [ ] Agent list displays (should show 111 agents)
- [ ] Search functionality works
- [ ] Filter by LGA works
- [ ] Agent details visible (name, phone, PU code, ward, LGA, role, status)

### Add Single Agent
- [ ] Click **Add Agent** button
- [ ] Fill form with test data:
  - Name: `Test Agent Alpha`
  - Phone: `2348099998881`
  - Email: `testalpha@test.com`
  - PU Code: `PU999TEST`
  - Ward: `Test Ward`
  - LGA: `Aguata`
  - Role: `pu_agent`
- [ ] Submit form
- [ ] Success message displayed
- [ ] New agent appears in list

### Bulk Upload
- [ ] Go to **Bulk Upload** tab
- [ ] Download CSV template
- [ ] Create test CSV with 3-5 agents
- [ ] Upload CSV file
- [ ] Success message shows correct count
- [ ] New agents appear in list

**Expected Result:** ✅ Agent management fully functional

---

## 📱 Test 3: SMS Result Submission

### Submit via SMS Simulator
- [ ] Navigate to **SMS Simulator** page
- [ ] Use phone number: `2348011111101` (Chukwudi Okafor - Aguata)
- [ ] Enter message: `R APGA:450 APC:320 PDP:280 LP:150`
- [ ] Click **Send SMS**
- [ ] Check success toast notification
- [ ] Log shows SMS sent

### Confirmation Workflow
- [ ] Send follow-up message: `YES`
- [ ] Success message received
- [ ] Reference ID generated (format: EL + timestamp)

### View Submission
- [ ] Go to **Results** page
- [ ] New result appears in **Pending** tab
- [ ] Details show correctly:
  - PU Code: PU001AG
  - Agent: Chukwudi Okafor
  - Ward: Aguata I
  - LGA: Aguata
  - Votes: APGA:450, APC:320, PDP:280, LP:150
  - Total: 1200
  - Status: Pending

**Expected Result:** ✅ SMS submission workflow complete

---

## ✔️ Test 4: Result Validation

### Approve Result
- [ ] Stay on **Results** page
- [ ] Click **Approve** button on pending result
- [ ] Confirmation received
- [ ] Status changes to "Validated"
- [ ] Result moves to **Validated** tab

### Reject Result (Optional)
- [ ] Submit another test result
- [ ] Click **Reject** button
- [ ] Enter rejection reason (e.g., "Incorrect party votes")
- [ ] Status changes to "Rejected"
- [ ] Rejection reason visible

**Expected Result:** ✅ Validation workflow functional

---

## 📊 Test 5: Live Dashboard Updates

### View Dashboard Stats
- [ ] Navigate to **Dashboard**
- [ ] Stats cards display correctly:
  - Total PUs: 105
  - Submitted: 1 (or more if you tested multiple)
  - Pending Validation: 0 (after approval)
  - Incidents: 0 (will test later)

### View Charts
- [ ] Bar chart displays validated results
- [ ] Correct party colors:
  - APGA: Green (#006600)
  - APC: Blue (#0066CC)
  - PDP: Red (#FF0000)
  - LP: Crimson (#DC143C)
- [ ] Pie chart shows vote distribution
- [ ] Total votes summary displays correctly

### Test Auto-Refresh
- [ ] Submit another result via SMS Simulator
- [ ] Validate the result
- [ ] Wait 60 seconds (or refresh page)
- [ ] Dashboard updates automatically

**Expected Result:** ✅ Real-time dashboard operational

---

## 🚨 Test 6: Incident Reporting

### Submit Incident
- [ ] Go to **SMS Simulator**
- [ ] Use phone: `2348011111201` (Obiora Udoka - Awka North)
- [ ] Message: `I Vote buying observed at polling unit entrance`
- [ ] Send SMS
- [ ] Reference ID generated (format: INC + timestamp)

### View Incident
- [ ] Navigate to **Incidents** page
- [ ] New incident visible in **Reported** tab
- [ ] Details correct:
  - Type: vote_buying (auto-detected)
  - Severity: high (auto-assigned)
  - Description matches
  - Reporter: Obiora Udoka
  - Location: Awka North

### Update Incident Status
- [ ] Change status to "Investigating"
- [ ] Add resolution notes: "Team dispatched to location"
- [ ] Status updates successfully
- [ ] Incident moves to **Investigating** tab

### Resolve Incident
- [ ] Change status to "Resolved"
- [ ] Enter resolution: "Issue resolved, no further action needed"
- [ ] Timestamp recorded
- [ ] Incident moves to **Resolved** tab

**Expected Result:** ✅ Incident management functional

---

## 🧪 Test 7: Edge Cases & Error Handling

### Invalid SMS Formats
- [ ] Send: `R XYZ:100` (invalid party)
  - ✅ Error message received
- [ ] Send: `R APGA:abc` (non-numeric votes)
  - ✅ Error message received
- [ ] Send: `R APGA` (missing votes)
  - ✅ Error message received
- [ ] Send: `RANDOM TEXT`
  - ✅ Error message received

### Unregistered Phone Number
- [ ] Use phone: `2348099999999` (not in database)
- [ ] Send result SMS
- [ ] ✅ Error: "Phone number not registered"

### Duplicate Submission Prevention
- [ ] Submit result from same agent twice
- [ ] ✅ System handles gracefully

### Help & Status Commands
- [ ] Send: `HELP`
  - ✅ Receives command guide
- [ ] Send: `STATUS`
  - ✅ Receives submission status

**Expected Result:** ✅ Error handling robust

---

## 📈 Test 8: Multiple Submissions (Stress Test)

### Simulate 10 Results
- [ ] Use SMS Simulator to submit 10 different results
- [ ] Use different agents from different LGAs
- [ ] Vary party votes for each
- [ ] All submissions successful

### Validate All Results
- [ ] Go to **Results** page
- [ ] Bulk validate all pending results
- [ ] All move to validated status

### Check Aggregates
- [ ] Dashboard shows correct totals
- [ ] Charts update with all results
- [ ] Submission percentage accurate (10/105 = ~9.5%)

**Expected Result:** ✅ System handles multiple submissions

---

## 🌐 Test 9: ngrok Integration (Optional - For GoIP)

### Setup ngrok
- [ ] Install ngrok
- [ ] Run: `ngrok http 3000`
- [ ] Copy public HTTPS URL

### Configure GoIP
- [ ] Access GoIP web interface
- [ ] Navigate to SMS to HTTP settings
- [ ] Set webhook URL: `https://YOUR-URL.ngrok.io/api/sms/goip/incoming`
- [ ] Set method: POST
- [ ] Save configuration

### Test Real SMS
- [ ] Send SMS from registered phone to GoIP number
- [ ] Format: `R APGA:450 APC:320 PDP:280 LP:150`
- [ ] GoIP forwards to webhook
- [ ] Result appears in dashboard

**Expected Result:** ✅ GoIP integration functional

---

## 📋 Final Verification

### System Health
- [ ] No console errors in browser
- [ ] All API endpoints responding
- [ ] Database queries executing smoothly
- [ ] No memory leaks observed
- [ ] SMS logs being recorded
- [ ] Audit logs being created

### Documentation
- [ ] README.md reviewed
- [ ] SETUP_INSTRUCTIONS.md clear
- [ ] QUICK_START.md easy to follow
- [ ] All scripts working

### Production Readiness
- [ ] All core features tested ✅
- [ ] Error handling verified ✅
- [ ] Performance acceptable ✅
- [ ] Security measures in place ✅

---

## 🎯 Test Completion Score

**Total Tests:** 50+
**Passed:** ___ / 50+
**Failed:** ___
**Skipped:** ___

### Overall Status: ⬜ READY FOR DEPLOYMENT

---

## 📝 Notes & Issues

_Document any issues encountered during testing:_

1. 
2. 
3. 

---

## ✅ Sign-Off

- **Tested By:** ________________
- **Date:** ________________
- **Time:** ________________
- **Environment:** Development / Staging / Production
- **Approved:** ☐ YES  ☐ NO

---

**Next Step:** Deploy to Digital Ocean for production use!
