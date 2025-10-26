# Check Result Submissions

## Quick Checks

### 1. Check Recent SMS Logs
Go to SMS Monitor: http://localhost:3000/dashboard/sms-monitor

Or check the terminal logs for messages starting with "R " (result submissions).

### 2. Check Database

**Option A: Via Supabase Dashboard**
1. Go to: https://ncftsabdnuwemcqnlzmr.supabase.co
2. Table Editor → `election_results`
3. Sort by `submitted_at` DESC

**Option B: Check SMS Logs**
1. Go to Supabase
2. Table Editor → `sms_logs`
3. Filter: `direction = 'inbound'`
4. Sort by `created_at` DESC
5. Look for messages starting with "R "

### 3. Check Terminal Logs

Look for these patterns in the terminal:

**Successful Result Submission:**
```
[REQ-xxx] Message: R APGA:450 APC:320 PDP:280 LP:150
[REQ-xxx] Handling RESULT submission
[REQ-xxx] Result confirmed and saved
```

**Failed Result Submission:**
```
[REQ-xxx] Message: [whatever was sent]
Error:
Invalid format. Send HELP for instructions.
```

## Why Results Might Not Show on Dashboard

### Reason 1: Result Never Submitted Successfully
- Message format was incorrect
- Error was sent back to user
- Check for "Invalid format" errors in terminal

### Reason 2: Result is Pending Validation
- Result was submitted but status is "pending"
- Dashboard only shows "validated" results
- Check `election_results` table for status

### Reason 3: Result Submitted but Dashboard Not Refreshing
- Try refreshing the dashboard page
- Check browser console for errors

## Correct Result Format

**Valid format:**
```
R APGA:450 APC:320 PDP:280 LP:150
```

**Must have:**
- Start with "R " (R followed by space)
- At least 2 parties
- Format: PARTY:VOTES
- Valid parties: APC, PDP, APGA, LP, NNPP, ADC, YPP, SDP

**Invalid formats:**
- ❌ `RESULTS: APGA:100` - doesn't start with "R "
- ❌ `R APGA:100` - only 1 party (need at least 2)
- ❌ `RAPGA:100` - no space after R
- ❌ `R APGA 100` - missing colon

## What to Do Now

### Step 1: Check What Was Actually Sent
Scroll up in the terminal and look for:
```
[REQ-xxx] Message: [the message that was sent]
```

### Step 2: If Format Was Correct
Check the `election_results` table in Supabase:
```sql
SELECT * FROM election_results 
WHERE agent_id = (SELECT id FROM agents WHERE phone_number = '08066137843')
ORDER BY submitted_at DESC;
```

### Step 3: If Format Was Incorrect
Resend with correct format:
```
R APGA:450 APC:320 PDP:280 LP:150
```

The system will:
1. Parse the message
2. Send confirmation: "Confirm: APGA:450 APC:320 PDP:280 LP:150 Total: 1000. Reply YES to submit or NO to cancel."
3. Wait for "YES" confirmation
4. Save to database
5. Send success message with reference ID

### Step 4: Check for Confirmation
If you sent a result, did you:
1. Receive a confirmation message?
2. Reply "YES" to confirm?

## Quick Test

Send this exact message from the registered phone:
```
R APGA:100 APC:50
```

You should receive:
```
Confirm:
APGA:100 APC:50
Total: 150

Reply YES to submit or NO to cancel.
```

Then reply:
```
YES
```

You should receive:
```
✓ Result submitted!
APGA:100 APC:50
Total: 150
Ref: EL1729889234567

C&CC will validate shortly.
```

Then check the dashboard - it should show in the Results section (might need to validate it first).
