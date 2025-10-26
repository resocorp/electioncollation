# SMS Webhook Monitoring & Troubleshooting Guide

## Overview
This guide helps you monitor and troubleshoot SMS webhook issues where the DBL SMS server receives messages but they're not appearing in Supabase.

## Quick Diagnostic Steps

### 1. Check Webhook Endpoint Accessibility

**Test the webhook is accessible:**
```bash
# Replace with your ngrok URL from .env.local
curl https://9d7b0a7c3c32.ngrok-free.app/api/sms/goip/incoming
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T20:47:58.000Z",
  "message": "SMS webhook endpoint is active",
  "endpoint": "/api/sms/goip/incoming",
  "method": "POST"
}
```

If this fails:
- ❌ ngrok tunnel is down - restart it
- ❌ Next.js server is not running - start with `npm run dev`
- ❌ URL in `.env.local` is outdated - update `NEXT_PUBLIC_APP_URL`

### 2. View Recent SMS Logs

**Check last 20 SMS logs:**
```bash
curl "https://9d7b0a7c3c32.ngrok-free.app/api/sms/logs?limit=20"
```

**Filter by phone number:**
```bash
curl "https://9d7b0a7c3c32.ngrok-free.app/api/sms/logs?phone=2348066137843"
```

**Filter by direction (inbound only):**
```bash
curl "https://9d7b0a7c3c32.ngrok-free.app/api/sms/logs?direction=inbound&limit=50"
```

### 3. Check Application Logs

**In your terminal where Next.js is running, look for:**

✅ **Successful webhook request:**
```
================================================================================
[REQ-20251025-ABC123] Incoming webhook request at 2025-10-25T20:47:58.000Z
Headers: {...}
[REQ-20251025-ABC123] Raw body: {"goip_line":"goip-10102","from_number":"2348066137843","content":"HELP","recv_time":"2025-10-25 20:47:58"}
[REQ-20251025-ABC123] Parsed JSON: {
  "goip_line": "goip-10102",
  "from_number": "2348066137843",
  "content": "HELP",
  "recv_time": "2025-10-25 20:47:58"
}
[REQ-20251025-ABC123] Validated SMS: {...}
[REQ-20251025-ABC123] SMS Details:
  From: 2348066137843
  Message: HELP
  Line: goip-10102
  Time: 2025-10-25 20:47:58
  Formatted Phone: 2348066137843
[REQ-20251025-ABC123] SMS logged to database with ID: 123
[REQ-20251025-ABC123] Looking up agent with phone: 2348066137843
[REQ-20251025-ABC123] Agent found: John Doe (ID: agent-123)
[REQ-20251025-ABC123] Handling HELP command
[REQ-20251025-ABC123] Sending SMS to 2348066137843: Election SMS Commands...
[REQ-20251025-ABC123] SMS sent successfully. Task ID: 456
[REQ-20251025-ABC123] HELP response sent successfully
[REQ-20251025-ABC123] Processing completed successfully in 234ms
================================================================================
```

❌ **No logs appearing = DBL server isn't forwarding to webhook**

## Common Issues & Solutions

### Issue 1: DBL Receives SMS but Webhook Not Called

**Symptoms:**
- SMS appears in DBL interface (Image 1 shows messages)
- No logs in Supabase `sms_logs` table
- No console logs in Next.js terminal

**Cause:** DBL SMS server is not configured to forward incoming SMS to your webhook URL.

**Solution:**
1. Log into DBL SMS Server web interface at `http://159.65.59.78`
2. Navigate to **SMS Forwarding** or **Webhook Configuration**
3. Set the webhook URL to: `https://9d7b0a7c3c32.ngrok-free.app/api/sms/goip/incoming`
4. Enable forwarding for the line (e.g., `goip-10102`)
5. Test with: Send "HELP" to the line

### Issue 2: Webhook Called but Validation Fails

**Symptoms:**
- Console shows `[REQ-xxx] Validation failed for body:`
- Supabase has audit logs with `event_type: 'validation_failed'`

**Cause:** DBL is sending data in a different format than expected.

**Check the raw body in logs:**
```
[REQ-xxx] Raw body: {...}
```

**Expected format:**
```json
{
  "goip_line": "goip-10102",
  "from_number": "2348066137843",
  "content": "HELP",
  "recv_time": "2025-10-25 20:47:58"
}
```

**Solution:**
- Compare raw body to expected format
- Update `validateDBLIncomingSMS()` function in `src/lib/dbl-sms.ts` if format differs

### Issue 3: Agent Not Found

**Symptoms:**
- SMS reaches webhook ✅
- Console shows: `[REQ-xxx] Agent not found`
- User receives: "Phone number not registered"

**Cause:** Phone number format mismatch or agent not in database.

**Check:**
```sql
-- In Supabase SQL Editor
SELECT * FROM agents WHERE phone_number LIKE '%08066137843%';
```

**Solution:**
1. Verify agent exists in database
2. Check phone number format (should be: `2348066137843` without `+` or spaces)
3. Add agent if missing:
```sql
INSERT INTO agents (phone_number, name, polling_unit_code, ward, lga, state)
VALUES ('2348066137843', 'Test Agent', 'PU001', 'Ward 1', 'LGA 1', 'Anambra');
```

### Issue 4: ngrok URL Changed

**Symptoms:**
- Webhook worked before but stopped
- ngrok was restarted

**Solution:**
1. Get new ngrok URL:
```bash
ngrok http 3000
```

2. Update `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://NEW-NGROK-URL.ngrok-free.app
```

3. Update DBL SMS server webhook configuration

4. Restart Next.js:
```bash
npm run dev
```

## Monitoring Dashboard

### View Logs in Supabase

1. Go to: https://ncftsabdnuwemcqnlzmr.supabase.co
2. Navigate to **Table Editor** → `sms_logs`
3. Filter by:
   - `phone_number = '2348066137843'`
   - `direction = 'inbound'`
   - `created_at > current_date - interval '1 hour'`

### Audit Logs

Check for webhook errors:
```sql
SELECT * FROM sms_logs 
WHERE metadata->>'event_type' IN ('webhook_error', 'validation_failed', 'fatal_error')
ORDER BY created_at DESC 
LIMIT 20;
```

### HELP Command Tracking

```sql
SELECT * FROM sms_logs 
WHERE metadata->>'event_type' = 'help_request'
ORDER BY created_at DESC;
```

## Testing the Complete Flow

### 1. Send Test SMS via API

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

**Expected Response:**
```json
{
  "status": "success",
  "type": "help"
}
```

### 2. Check Logs Immediately

```bash
curl "https://9d7b0a7c3c32.ngrok-free.app/api/sms/logs?phone=2348066137843&limit=5"
```

Should show:
1. Inbound "HELP" message (status: received)
2. Outbound help text (status: sent)

## Log Interpretation

### Request ID Format
- `REQ-20251025-ABC123` - Unique ID for each webhook request
- Prefix: `REQ`
- Date: `20251025`
- Random: `ABC123`

### Metadata Fields
```json
{
  "request_id": "REQ-20251025-ABC123",
  "event_type": "help_request",
  "goip_line": "goip-10102",
  "recv_time": "2025-10-25 20:47:58",
  "duration_ms": 234
}
```

### Event Types
- `help_request` - User sent HELP
- `status_request` - User sent STATUS
- `result_submission` - User submitted results
- `incident_report` - User reported incident
- `unknown_agent` - Phone not registered
- `validation_failed` - Invalid webhook data
- `webhook_error` - JSON parse error
- `fatal_error` - Unhandled exception

## Troubleshooting Checklist

When SMS isn't reaching Supabase:

- [ ] Next.js server is running (`npm run dev`)
- [ ] ngrok tunnel is active and URL matches `.env.local`
- [ ] Webhook endpoint returns 200 OK on GET test
- [ ] DBL SMS server is configured with correct webhook URL
- [ ] DBL is forwarding SMS for the specific line
- [ ] Agent exists in database with correct phone format
- [ ] Check application console logs for errors
- [ ] Check Supabase `sms_logs` table for audit entries
- [ ] Test with manual webhook POST request

## Next Steps

If the issue persists:

1. **Capture DBL webhook payload:**
   - Check if DBL has webhook logs showing request sent
   - Compare expected vs actual JSON format

2. **Enable DBL verbose logging:**
   - Check DBL server logs for forwarding errors

3. **Network connectivity:**
   - Verify DBL server can reach ngrok URL
   - Test from DBL server: `curl https://YOUR-NGROK-URL.ngrok-free.app/api/sms/goip/incoming`

4. **Contact DBL support:**
   - Confirm webhook forwarding is enabled
   - Ask for sample webhook payload format

## Support Queries

When asking for help, provide:
1. Request ID from logs (if any)
2. Phone number being tested
3. Screenshot of DBL SMS interface showing received message
4. Output of `curl` test to webhook endpoint
5. Last 10 lines from `sms_logs` table
6. Console log excerpt showing the error
