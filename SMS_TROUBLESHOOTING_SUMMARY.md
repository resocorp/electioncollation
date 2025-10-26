# 🔧 SMS Troubleshooting Summary - Oct 25, 2025

## ✅ Issues Fixed

### 1. **Phone Number Not Registered Error**
**Problem:** Real phone `+2348065137843` was sending SMS but getting "Phone number not registered"

**Root Cause:** The database only had test phone numbers (2348011111xxx). The real phone wasn't registered.

**Solution:** Registered the real phone as an agent:
```sql
INSERT INTO agents (phone_number, name, email, polling_unit_code, ward, lga, role)
VALUES ('2348065137843', 'Test Agent - Real Phone', 'testagent@election.com', 'PU001TEST', 'Test Ward', 'Awka North', 'pu_agent');
```

### 2. **YES Confirmation Not Working**
**Problem:** After sending result SMS, replying "YES" returned "Invalid format" error

**Root Cause:** The YES/NO logic was inside the `if (parsed.type === 'result')` block, but "YES" by itself doesn't parse as a result type, so it never reached the confirmation handler.

**Solution:** Moved YES/NO confirmation check BEFORE SMS parsing (lines 73-131 in route.ts)

### 3. **Dashboard Stats `.modify()` Error**
**Problem:** Dashboard was throwing `.modify is not a function` error

**Root Cause:** Supabase JS client doesn't have a `.modify()` method

**Solution:** Replaced with conditional query chaining:
```typescript
let query = supabase.from('table').select('*');
if (condition) query = query.eq('field', value);
const result = await query;
```

## 📋 Current Configuration

### Registered Agents
- **Admin:** 2348000000000 (Password: Admin123!)
- **Test Agent:** 2348065137843  
- **Seed Agents:** 2348011111101-105 (and 100+ more)

### Active GoIP Lines
- **goip-10101** - Active & Registered ✅
- **goip-10102** - Active & Registered ✅  
- goip-10103 to 10108 - Online but SIM not registered ⚠️

### Webhook URLs (for DBL SMS Server)
```
Incoming SMS: https://67dc65f9c5cb.ngrok-free.app/api/sms/goip/incoming
Status Reports: https://67dc65f9c5cb.ngrok-free.app/api/sms/dbl/status-report
```

## 🧪 Testing SMS Flow

### Method 1: Via Real Phone
1. Send SMS to DBL server: `R APGA:450 APC:320 PDP:280 LP:150`
2. System creates session and sends confirmation request
3. Reply with: `YES`
4. System saves to database and sends success message

### Method 2: Via API Testing
```powershell
# Step 1: Send result
curl -X POST "http://localhost:3000/api/sms/goip/incoming" `
  -H "Content-Type: application/json" `
  -d '{"goip_line":"goip-10102","from_number":"+2348065137843","content":"R APGA:100 APC:200","recv_time":"2025-10-25 21:00:00"}'

# Step 2: Confirm with YES
curl -X POST "http://localhost:3000/api/sms/goip/incoming" `
  -H "Content-Type: application/json" `
  -d '{"goip_line":"goip-10102","from_number":"+2348065137843","content":"YES","recv_time":"2025-10-25 21:00:30"}'

# Step 3: Check dashboard
curl "http://localhost:3000/api/dashboard/stats"
```

### Method 3: Via SMS Simulator (Dashboard)
1. Login to dashboard: http://localhost:3000 or ngrok URL
2. Go to **SMS Simulator** page
3. Enter phone: `2348065137843`
4. Send message: `R APGA:450 APC:320 PDP:280 LP:150`
5. Send follow-up: `YES`

## 📊 Verification Checklist

- [ ] HELP command returns success
- [ ] STATUS command returns agent status  
- [ ] Result submission creates session (awaiting_confirmation)
- [ ] YES confirmation saves to election_results table
- [ ] Dashboard shows submitted count > 0
- [ ] sms_logs table records all messages
- [ ] Outbound SMS sent via DBL (check DBL interface)

## 🔍 Debugging Tips

### Check if agent registered:
```powershell
curl "http://localhost:3000/api/agents?search=806"
```

### Check SMS logs in database:
```sql
SELECT * FROM sms_logs 
WHERE phone_number = '2348065137843' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check active sessions:
```sql
SELECT * FROM sms_sessions 
WHERE phone_number = '2348065137843';
```

### Check submitted results:
```sql
SELECT * FROM election_results 
ORDER BY submitted_at DESC 
LIMIT 5;
```

## ⚠️ Common Issues

### Issue: "Phone number not registered"
**Fix:** Register the phone number as an agent via `/api/agents` POST

### Issue: "NO" still parsing as invalid
**Fix:** Restart server with clean build: `rm -rf .next && npm run dev`

### Issue: Session expired
**Fix:** Sessions expire after 30 minutes. Send result SMS again to create new session

### Issue: DBL not receiving webhooks
**Fix:** 
1. Check ngrok is running
2. Verify webhook URLs configured in DBL
3. Test with: `curl https://YOUR-NGROK-URL.ngrok-free.app/api/sms/goip/incoming`

## 📝 Next Steps

1. **Test from real phone** - Send actual SMS and verify full flow
2. **Train agents** - Provide SMS command guide
3. **Monitor DBL logs** - Check for any delivery failures
4. **Set up alerts** - For failed SMS or validation errors
5. **Production deployment** - Replace ngrok with permanent domain

---

**Last Updated:** 2025-10-25 21:20 WAT  
**Status:** ✅ All critical bugs fixed, ready for testing
