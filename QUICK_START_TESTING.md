# Quick Start Testing Guide
**Run these tests immediately after deployment**

---

## 🚀 Step 1: Deploy the Fixes

### 1.1 Apply Database Migration

**Option A - Via Supabase Dashboard** (Easiest):
```
1. Go to https://ncftsabdnuwemcqnlzmr.supabase.co
2. Click "SQL Editor" in left menu
3. Open file: supabase/migrations/004_line_affinity_and_optimizations.sql
4. Copy all content
5. Paste into SQL Editor
6. Click "Run"
7. Wait for "Success" message
```

**Option B - Via Command Line**:
```bash
# Get your database URL from Supabase Dashboard
psql "postgresql://postgres:[PASSWORD]@db.ncftsabdnuwemcqnlzmr.supabase.co:5432/postgres" \
  -f supabase/migrations/004_line_affinity_and_optimizations.sql
```

### 1.2 Verify Migration

```sql
-- Run in Supabase SQL Editor
-- Check indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('election_results', 'sms_sessions', 'sms_logs')
ORDER BY tablename, indexname;

-- Should show:
-- idx_results_agent_pu
-- idx_sms_sessions_phone
-- idx_sms_sessions_activity
-- idx_sms_logs_task_id
-- idx_sms_logs_created_status

-- Check constraint
SELECT conname FROM pg_constraint 
WHERE conrelid = 'election_results'::regclass
  AND conname = 'unique_agent_pu_result';

-- Should return: unique_agent_pu_result
```

### 1.3 Configure Connection Pool

```
1. Go to Supabase Dashboard → Settings → Database
2. Scroll to "Connection Pooling"
3. Set Mode: Transaction
4. Set Pool Size: 50-100
5. Click "Save"
```

### 1.4 Restart Application

```bash
npm run dev
```

---

## 🧪 Step 2: Run Automated Tests

### 2.1 Test Line Affinity

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run:
node scripts/test-line-affinity.js
```

**Expected Output**:
```
🧪 Testing Line Affinity Implementation
============================================================
📋 Testing Agent 1 (08011111101)
------------------------------------------------------------
1️⃣ Test: HELP command
   ✅ Response: success
   📝 Expected: Response sent via goip-10101

2️⃣ Test: STATUS query
   ✅ Response: success
   📝 Expected: Response sent via goip-10101

3️⃣ Test: Message from different line
   ✅ Response: success
   📝 Expected: Response STILL sent via goip-10101 (original line)
```

**Verify in Database**:
```sql
-- Check sessions were created
SELECT phone_number, session_data->>'last_goip_line' as assigned_line
FROM sms_sessions
WHERE phone_number = '08011111101';
-- Should show: goip-10101

-- Check outbound messages used correct line
SELECT phone_number, metadata->>'goip_line' as used_line, 
       SUBSTRING(message, 1, 30) as message_preview
FROM sms_logs
WHERE direction = 'outbound'
  AND phone_number = '08011111101'
ORDER BY created_at DESC
LIMIT 5;
-- All should show: goip-10101
```

### 2.2 Test Duplicate Prevention

```bash
node scripts/test-duplicate-prevention.js
```

**Expected Output**:
```
🧪 Testing Duplicate Submission Prevention
============================================================
📋 Test Agent: 08011111101
------------------------------------------------------------
1️⃣ Test: First result submission
   ✅ PASS: First submission accepted
   📝 Reference ID: EL-XXXXX

2️⃣ Test: Duplicate submission (same results)
   ✅ PASS: Duplicate detected and prevented
   📝 Existing ref: EL-XXXXX

3️⃣ Test: Different results, same polling unit
   ✅ PASS: Still prevented (correct behavior)
```

**Verify in Database**:
```sql
-- Should only have ONE result
SELECT COUNT(*) as result_count,
       reference_id,
       submitted_at
FROM election_results
WHERE agent_id = (SELECT id FROM agents WHERE phone_number = '08011111101')
GROUP BY reference_id, submitted_at;
-- Should show: result_count = 1
```

### 2.3 Test Health Monitoring

```bash
# Using curl (Linux/Mac)
curl http://localhost:3000/api/sms/health | jq '.'

# Using PowerShell (Windows)
Invoke-RestMethod -Uri "http://localhost:3000/api/sms/health" | ConvertTo-Json -Depth 5
```

**Expected Output**:
```json
{
  "status": "healthy",
  "summary": {
    "overall_status": "healthy",
    "webhook_health": "idle",
    "lines_available": 2,
    "error_rate": "0%",
    "active_users": 0
  },
  "checks": {
    "database": "ok",
    "webhook_activity": {
      "last_5_min": 0,
      "status": "idle"
    },
    "goip_lines": {
      "total": 8,
      "active": 2,
      "offline": 6
    }
  }
}
```

---

## 🎯 Step 3: Manual Testing Scenarios

### Scenario 1: Line Affinity with Real Agents

**Setup**:
1. Ensure 3 test agents exist in database
2. Note their phone numbers and assigned lines

**Test**:
```bash
# Simulate agent sending to goip-10101
curl -X POST http://localhost:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10101",
    "from_number": "08012345678",
    "content": "HELP",
    "recv_time": "2025-10-26T10:00:00Z"
  }'

# Check application logs for:
# "[Line Affinity] Phone: 08012345678, Preferred: goip-10101"
```

**Verify**:
```sql
-- Check session
SELECT session_data FROM sms_sessions WHERE phone_number = '08012345678';

-- Check response was sent via same line
SELECT metadata->>'goip_line' FROM sms_logs 
WHERE phone_number = '08012345678' 
  AND direction = 'outbound'
ORDER BY created_at DESC LIMIT 1;
```

### Scenario 2: Duplicate Prevention

**Test**:
```bash
# First submission
curl -X POST http://localhost:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10101",
    "from_number": "08012345678",
    "content": "R APGA:450 APC:320 PDP:280",
    "recv_time": "2025-10-26T10:01:00Z"
  }'

# Should respond: "Result submitted! Ref: EL-XXXXX"

# Second submission (duplicate)
curl -X POST http://localhost:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10101",
    "from_number": "08012345678",
    "content": "R APGA:450 APC:320 PDP:280",
    "recv_time": "2025-10-26T10:02:00Z"
  }'

# Should respond: "You already submitted results (EL-XXXXX)..."
```

**Verify**:
```sql
-- Should only have 1 result
SELECT COUNT(*) FROM election_results 
WHERE agent_id = (SELECT id FROM agents WHERE phone_number = '08012345678');
```

### Scenario 3: Message Ordering

**Test**:
```bash
# Send RESULT
curl -X POST http://localhost:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10101",
    "from_number": "08012345679",
    "content": "R APGA:450 APC:320",
    "recv_time": "2025-10-26T10:03:00Z"
  }'

# Immediately send STATUS (before result finishes processing)
curl -X POST http://localhost:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10101",
    "from_number": "08012345679",
    "content": "STATUS",
    "recv_time": "2025-10-26T10:03:01Z"
  }'

# Should include note: "(If you just sent results, they may still be processing...)"
```

### Scenario 4: Failover

**Test**:
```bash
# Try to send via non-existent line
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "08012345678",
    "message": "Test message",
    "goip_line": "goip-99999"
  }'

# Check logs for:
# "Line goip-99999 failed, attempting failover..."
# "Failover successful! Used alternative line."
```

---

## 📊 Step 4: Verify Database Performance

### 4.1 Check Index Usage

```sql
-- See which indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as rows_read,
  idx_tup_fetch as rows_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('election_results', 'sms_sessions', 'sms_logs')
ORDER BY idx_scan DESC;

-- After running tests, you should see idx_scan > 0 for new indexes
```

### 4.2 Check Query Performance

```sql
-- Enable timing
\timing on

-- Test duplicate check query (should be < 10ms)
SELECT reference_id FROM election_results 
WHERE agent_id = 'some-uuid' 
  AND polling_unit_code = 'some-code';

-- Test session lookup (should be < 5ms)
SELECT session_data FROM sms_sessions 
WHERE phone_number = '08012345678';

-- Test status report update (should be < 10ms)
SELECT * FROM sms_logs 
WHERE direction = 'outbound' 
  AND metadata->>'dbl_task_id' = '5689'
LIMIT 1;
```

---

## 🔍 Step 5: Monitor During Load Test

### 5.1 Simple Load Test

```bash
# Install artillery (if not installed)
npm install -g artillery

# Create test config: load-test.yml
cat > load-test.yml << 'EOF'
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - post:
        url: '/api/sms/goip/incoming'
        json:
          goip_line: 'goip-10101'
          from_number: '0801{{ $randomNumber() }}'
          content: 'STATUS'
          recv_time: '{{ $timestamp }}'
EOF

# Run load test
artillery run load-test.yml

# Monitor health during test
watch -n 5 'curl -s http://localhost:3000/api/sms/health | jq ".summary"'
```

### 5.2 Monitor Database Connections

```sql
-- Check active connections during load test
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = current_database();

-- Should stay well below pool size (50-100)
```

---

## ✅ Success Criteria

All tests pass if:

- [x] Line affinity: Responses come from correct line
- [x] Duplicate prevention: Second submission rejected
- [x] Message ordering: Helpful note shown when appropriate
- [x] Failover: Works transparently
- [x] Health check: Returns expected data
- [x] Database: Indexes used, queries < 10ms
- [x] Load test: No errors at 10 requests/sec
- [x] Connection pool: Stays below 50% capacity

---

## 🚨 Troubleshooting

### Test fails: "Agent not found"

**Solution**: Create test agents in database
```sql
INSERT INTO agents (phone_number, name, polling_unit_code, ward, lga, role)
VALUES 
  ('08011111101', 'Test Agent 1', 'TEST-PU-001', 'Test Ward', 'Test LGA', 'pu_agent'),
  ('08011111102', 'Test Agent 2', 'TEST-PU-002', 'Test Ward', 'Test LGA', 'pu_agent'),
  ('08011111103', 'Test Agent 3', 'TEST-PU-003', 'Test Ward', 'Test LGA', 'pu_agent');
```

### Test fails: "Cannot connect to DBL SMS Server"

**Solution**: Update .env.local with correct DBL server IP
```env
DBL_SMS_SERVER_IP=159.65.59.78
DBL_SMS_SERVER_PORT=80
DBL_SMS_USERNAME=root
DBL_SMS_PASSWORD=sm@phswebawka
```

### Indexes not being used

**Solution**: Analyze tables
```sql
ANALYZE election_results;
ANALYZE sms_sessions;
ANALYZE sms_logs;
```

---

## 📞 Next Steps

After all tests pass:

1. **Clean up test data**:
```sql
DELETE FROM election_results WHERE reference_id LIKE 'EL-%TEST%';
DELETE FROM sms_sessions WHERE phone_number LIKE '080111111%';
```

2. **Deploy to staging** (if available)

3. **Load test with realistic data** (100+ agents)

4. **Train team** on monitoring and troubleshooting

5. **Schedule election day readiness check**

---

**🎉 Ready for production once all tests pass!**
