# Phone Number Format Fix

## Problem Identified
- **Database stores:** `08066137843` (local Nigerian format)
- **DBL sends incoming SMS from:** `2348066137843` (international format)
- **System was converting to:** `2348066137843` for lookups
- **Result:** Agent lookup failed because `08066137843` ≠ `2348066137843`

## Solution Implemented

### Two Separate Functions

#### 1. `formatPhoneNumber()` - For Database Storage/Lookups
**Purpose:** Convert ANY format to local Nigerian format (0xxxxxxxxxx)

**Examples:**
```typescript
formatPhoneNumber('2348066137843')   → '08066137843'
formatPhoneNumber('+2348066137843')  → '08066137843'
formatPhoneNumber('08066137843')     → '08066137843'
formatPhoneNumber('8066137843')      → '08066137843'
```

**Used in:**
- Receiving incoming SMS (webhook)
- Looking up agents in database
- Storing phone numbers in logs

#### 2. `formatPhoneNumberForSending()` - For DBL API
**Purpose:** Convert ANY format to international format (234xxxxxxxxxx)

**Examples:**
```typescript
formatPhoneNumberForSending('08066137843')    → '2348066137843'
formatPhoneNumberForSending('8066137843')     → '2348066137843'
formatPhoneNumberForSending('2348066137843')  → '2348066137843'
formatPhoneNumberForSending('+2348066137843') → '2348066137843'
```

**Used in:**
- Sending SMS via DBL API
- All outbound messages

## What Changed

### 1. `src/lib/utils.ts`
- ✅ `formatPhoneNumber()` now converts TO local format (not international)
- ✅ Added `formatPhoneNumberForSending()` for DBL API calls

### 2. `src/app/api/sms/goip/incoming/route.ts`
- ✅ Incoming SMS: Convert from international to local for database lookup
- ✅ Outgoing SMS: Convert from local to international for sending
- ✅ Logs show both formats for debugging

### 3. `src/app/api/sms/send/route.ts`
- ✅ Accept any phone format
- ✅ Store in database as local format
- ✅ Send via DBL as international format

## Flow Example

**Incoming SMS:**
```
DBL sends: 2348066137843
↓
formatPhoneNumber() → 08066137843
↓
Database lookup: SELECT * FROM agents WHERE phone_number = '08066137843'
✅ MATCH FOUND!
↓
Send response to: 08066137843 (local)
↓
formatPhoneNumberForSending() → 2348066137843
↓
DBL API receives: 2348066137843
✅ SMS DELIVERED!
```

## Testing

### Test 1: Manual Webhook Call
```bash
curl -X POST https://9d7b0a7c3c32.ngrok-free.app/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10102",
    "from_number": "2348066137843",
    "content": "HELP",
    "recv_time": "2025-10-25 22:00:00"
  }'
```

**Expected Console Output:**
```
[REQ-xxx] Incoming webhook request...
[REQ-xxx] From: 2348066137843
[REQ-xxx] Formatted Phone: 08066137843
[REQ-xxx] Looking up agent with phone: 08066137843
[REQ-xxx] Agent found: Test Agent - Real Phone (ID: xxx)
[REQ-xxx] Handling HELP command
[REQ-xxx] Sending SMS to 08066137843 (local format)
[REQ-xxx] Converted to international format: 2348066137843
[REQ-xxx] SMS sent successfully
```

### Test 2: Check Database
```sql
-- Agent table has local format
SELECT phone_number, name FROM agents;
-- Result: 08066137843 | Test Agent - Real Phone

-- SMS logs have local format
SELECT phone_number, direction, message FROM sms_logs 
WHERE phone_number = '08066137843'
ORDER BY created_at DESC LIMIT 5;
```

### Test 3: Real SMS
1. Send "HELP" from `08066137843`
2. DBL receives from `2348066137843`
3. Webhook converts to `08066137843`
4. Agent lookup succeeds
5. Response sent to `08066137843` → converted to `2348066137843` for DBL
6. User receives HELP message

## Console Logs to Look For

**✅ SUCCESS - You'll see:**
```
[REQ-xxx] From: 2348066137843
[REQ-xxx] Formatted Phone: 08066137843
[REQ-xxx] Agent found: Test Agent - Real Phone (ID: ...)
[REQ-xxx] Sending SMS to 08066137843 (local format)
[REQ-xxx] Converted to international format: 2348066137843
```

**❌ BEFORE FIX - You would have seen:**
```
[REQ-xxx] From: 2348066137843
[REQ-xxx] Formatted Phone: 2348066137843  ← WRONG!
[REQ-xxx] Agent not found
[REQ-xxx] Sending error: Phone number not registered
```

## Database Schema Note

**IMPORTANT:** The `agents` table and `sms_logs` table now store phone numbers in **local format only**:
- ✅ `08066137843` (Stored in database)
- ❌ `2348066137843` (NOT stored, only used for DBL API)

All conversions happen at the API boundary:
- **Incoming:** International → Local (for database)
- **Outgoing:** Local → International (for DBL)

## Verification Checklist

After the fix:
- [ ] Send "HELP" from real phone (08066137843)
- [ ] Check console shows format conversion
- [ ] Check agent lookup succeeds
- [ ] Check user receives HELP response
- [ ] Verify SMS logs show `08066137843` in database
- [ ] Verify metadata shows `sent_to_number: 2348066137843`

## Files Modified

1. ✅ `src/lib/utils.ts` - Phone formatting functions
2. ✅ `src/app/api/sms/goip/incoming/route.ts` - Webhook handler
3. ✅ `src/app/api/sms/send/route.ts` - Send SMS endpoint

---

**The phone number mismatch is now fixed!** 🎉

Database stores `08066137843`, lookups use `08066137843`, and DBL API receives `2348066137843`.
