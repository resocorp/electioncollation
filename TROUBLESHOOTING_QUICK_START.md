# Quick Start: Troubleshooting SMS Issues

## Current Problem
- ✅ DBL SMS server is receiving messages from `08066137843` (shown in Image 1)
- ❌ Messages are NOT appearing in Supabase database
- 🔍 Need to find where the webhook chain is breaking

## Step 1: Start Monitoring (Do This Now!)

### Open the SMS Monitor Dashboard
1. Make sure your Next.js app is running: `npm run dev`
2. Open browser to: **http://localhost:3000/dashboard/sms-monitor**
3. You should see a real-time monitoring dashboard
4. Leave this open - it auto-refreshes every 5 seconds

### Check Terminal Logs
Keep your terminal visible where `npm run dev` is running. You'll see detailed logs like:
```
================================================================================
[REQ-20251025-ABC123] Incoming webhook request at 2025-10-25T20:47:58.000Z
Headers: {...}
[REQ-20251025-ABC123] Raw body: {...}
```

## Step 2: Test Webhook Endpoint

### Quick Test (30 seconds)
```bash
# Test 1: Is the endpoint accessible?
curl https://9d7b0a7c3c32.ngrok-free.app/api/sms/goip/incoming
```
**Expected:** JSON response with `"status": "ok"`

**If it fails:**
- ❌ ngrok is down → restart: `ngrok http 3000`
- ❌ Next.js not running → run: `npm run dev`

### Test 2: Simulate an SMS
```bash
curl -X POST https://9d7b0a7c3c32.ngrok-free.app/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10102",
    "from_number": "2348066137843",
    "content": "HELP",
    "recv_time": "2025-10-25 20:47:58"
  }'
```

**What to look for:**
1. ✅ Check terminal - you should see `[REQ-xxx]` logs
2. ✅ Check SMS Monitor dashboard - new entry should appear
3. ✅ Check Supabase `sms_logs` table - new row added

**If this works but real SMS doesn't:**
→ **Problem is DBL server not forwarding to webhook**

## Step 3: Check Supabase Logs

### View Recent Logs (Browser)
1. Go to: https://ncftsabdnuwemcqnlzmr.supabase.co
2. Table Editor → `sms_logs`
3. Sort by `created_at` DESC

### View via API (Command Line)
```bash
# Last 10 logs
curl "https://9d7b0a7c3c32.ngrok-free.app/api/sms/logs?limit=10"

# Filter by phone
curl "https://9d7b0a7c3c32.ngrok-free.app/api/sms/logs?phone=2348066137843"
```

## Step 4: The Most Likely Issue

**If manual curl test works BUT real SMS doesn't show up:**

### DBL Server Not Configured
The DBL SMS server needs to be configured to forward incoming SMS to your webhook.

**What you need to do:**
1. Access DBL web interface: `http://159.65.59.78` (from your .env.local)
2. Login with credentials from .env.local
3. Find **SMS Forwarding** or **Webhook Settings**
4. Configure:
   - **Webhook URL:** `https://9d7b0a7c3c32.ngrok-free.app/api/sms/goip/incoming`
   - **Method:** POST
   - **Format:** JSON
   - **Lines:** Enable for `goip-10102` (or all lines)

5. **Important:** Check the exact JSON format DBL sends
   - Our webhook expects:
     ```json
     {
       "goip_line": "string",
       "from_number": "string",
       "content": "string",
       "recv_time": "string"
     }
     ```

## What I've Added for You

### 1. Enhanced Webhook Logging
Every webhook request now logs:
- ✅ Complete request headers
- ✅ Raw request body (before parsing)
- ✅ Validation errors with details
- ✅ Processing time for each step
- ✅ Unique request IDs for tracking
- ✅ All errors with stack traces

### 2. SMS Monitor Dashboard
**URL:** http://localhost:3000/dashboard/sms-monitor

Features:
- Real-time log viewer (auto-refresh every 5s)
- Filter by phone number
- Color-coded by direction (inbound/outbound)
- Shows event types (HELP, STATUS, errors, etc.)
- Visual status indicators
- Troubleshooting tips built-in

### 3. Log Viewer API
**URL:** `/api/sms/logs`

Query params:
- `limit` - number of logs (default: 50)
- `phone` - filter by phone number
- `direction` - 'inbound' or 'outbound'

Example:
```bash
curl "http://localhost:3000/api/sms/logs?phone=2348066137843&limit=20"
```

### 4. Audit Trail
All webhook requests are now logged to `sms_logs` table with metadata:
- `request_id` - Unique identifier
- `event_type` - Type of event (help_request, validation_failed, etc.)
- `error` - Error message if any
- `duration_ms` - Processing time
- `raw_body` - Original request data

## Diagnostic Decision Tree

```
Send "HELP" from 08066137843
    ↓
Does it appear in DBL interface?
    ↓ YES
Do you see logs in terminal?
    ↓ NO → DBL not forwarding to webhook
          → Configure DBL webhook URL
    ↓ YES
Does it show in SMS Monitor dashboard?
    ↓ NO → Check for errors in terminal logs
          → Check event_type in logs
    ↓ YES
Does user receive HELP response?
    ↓ NO → Check outbound SMS logs
          → Check DBL line status
    ↓ YES
✅ WORKING!
```

## Next Actions

### Right Now:
1. ✅ Open SMS Monitor: http://localhost:3000/dashboard/sms-monitor
2. ✅ Run curl test (Step 2 above)
3. ✅ Send real "HELP" SMS from phone
4. ✅ Compare: Does curl work but real SMS doesn't?

### If Real SMS Still Not Working:
→ **Primary suspect: DBL webhook configuration**

Check with DBL:
- Is webhook forwarding enabled?
- What is the configured webhook URL?
- Can they send a test webhook?
- What JSON format do they send?

### Verification Commands

**Test ngrok tunnel:**
```bash
curl -I https://9d7b0a7c3c32.ngrok-free.app/api/sms/goip/incoming
```

**Test from DBL server (if you have SSH access):**
```bash
curl -X POST http://YOUR-NGROK-URL/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{"goip_line":"goip-10102","from_number":"2348066137843","content":"TEST"}'
```

## Files Changed/Added

### Modified:
- ✅ `src/app/api/sms/goip/incoming/route.ts` - Enhanced logging

### Created:
- ✅ `src/app/api/sms/logs/route.ts` - Log viewer API
- ✅ `src/app/dashboard/sms-monitor/page.tsx` - Monitoring dashboard
- ✅ `SMS_WEBHOOK_MONITORING.md` - Detailed troubleshooting guide
- ✅ `TROUBLESHOOTING_QUICK_START.md` - This file!

## Need Help?

When reporting issues, include:
1. Screenshot of SMS Monitor dashboard
2. Last 10 lines from terminal
3. Result of curl test
4. Phone number being tested
5. DBL webhook configuration (if accessible)

---

**Remember:** The logging is now comprehensive. If you send an SMS and see NOTHING in the terminal, the DBL server is not forwarding to your webhook!
