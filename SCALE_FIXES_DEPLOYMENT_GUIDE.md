# Scale Fixes Deployment Guide
## 6000 Agents Across 6 GoIP Lines - Critical Fixes Implemented

**Last Updated**: October 26, 2025  
**Status**: Ready for Deployment

---

## 🎯 Summary of Fixes

All critical issues for handling 6000 agents across 6 GoIP lines have been implemented:

### ✅ Implemented Fixes

1. **✅ Session-Based Line Affinity** (CRITICAL)
   - Agents receive replies from the SAME line they contacted
   - Prevents confusion from multiple phone numbers
   - Uses `sms_sessions` table to track line assignments

2. **✅ Duplicate Submission Prevention** (HIGH)
   - Agents cannot submit results twice for same polling unit
   - Database constraint + application-level check
   - Clear error message with existing reference ID

3. **✅ Database Optimization** (HIGH)
   - Indexes added for high-concurrency scenarios
   - Optimized for 12,000 SMS operations in 10 minutes
   - Connection pooling recommendations included

4. **✅ Message Ordering Safeguards** (MEDIUM)
   - Handles out-of-order webhook delivery gracefully
   - Detects if RESULT is still processing when STATUS arrives
   - Provides helpful messages to agents

5. **✅ Automatic Failover** (MEDIUM)
   - If preferred line fails, automatically uses another line
   - Transparent to agents
   - Logged for monitoring

6. **✅ Webhook Health Monitoring** (LOW)
   - New `/api/sms/health` endpoint
   - Detects webhook downtime
   - Monitors line status and error rates

---

## 📋 Deployment Steps

### Step 1: Run Database Migration

```bash
# Navigate to project root
cd /path/to/electioncollation

# Apply the migration
psql $DATABASE_URL -f supabase/migrations/004_line_affinity_and_optimizations.sql
```

**Or via Supabase Dashboard:**
1. Go to https://ncftsabdnuwemcqnlzmr.supabase.co
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/004_line_affinity_and_optimizations.sql`
4. Execute the migration

**What this does:**
- ✅ Adds performance indexes
- ✅ Adds unique constraint for duplicate prevention
- ✅ Creates helper views for monitoring
- ✅ Creates cleanup functions

### Step 2: Verify Migration

```sql
-- Check if indexes were created
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('election_results', 'sms_sessions', 'sms_logs');

-- Check constraint
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'election_results'::regclass;

-- Test line affinity function
SELECT get_line_affinity('08011111111');
```

### Step 3: Configure Supabase Connection Pooler

1. Go to Supabase Dashboard → Settings → Database
2. Enable **Transaction Mode** pooler
3. Set pool size: **50-100 connections**
4. Update your `.env.local` if needed

### Step 4: Deploy Application

```bash
# Install dependencies (if any new ones)
npm install

# Build for production
npm run build

# Or restart development server
npm run dev
```

### Step 5: Test Core Functionality

#### Test 1: Line Affinity
```bash
# Send test SMS to goip-10101 (e.g., 0801-1111-111)
# Response should come from SAME number

# Check session tracking
curl http://localhost:3000/api/sms/health | jq '.checks.active_sessions'
```

#### Test 2: Duplicate Prevention
```bash
# Have agent send result twice
# Second attempt should be rejected with error message

# Check database
SELECT * FROM election_results WHERE agent_id = 'xxx';
# Should only have ONE entry
```

#### Test 3: Failover
```bash
# Disable goip-10103 in DBL SMS Server
# Send SMS to agent assigned to that line
# Response should still be delivered via different line

# Check logs for failover message
```

#### Test 4: Health Monitoring
```bash
curl http://localhost:3000/api/sms/health | jq '.'

# Should show:
# - Webhook activity
# - GoIP line status
# - Error rates
# - Active sessions
```

---

## 🔍 Monitoring & Alerts

### Real-Time Monitoring

**Health Check Endpoint:**
```bash
curl http://your-server:3000/api/sms/health
```

**Example Response:**
```json
{
  "status": "healthy",
  "summary": {
    "overall_status": "healthy",
    "webhook_health": "active",
    "lines_available": 5,
    "error_rate": "2.3%",
    "active_users": 247
  },
  "checks": {
    "database": "ok",
    "webhook_activity": {
      "last_5_min": 15,
      "status": "active"
    },
    "goip_lines": {
      "total": 6,
      "active": 5,
      "offline": 1
    },
    "error_rate": {
      "last_hour": "2.3%",
      "status": "normal"
    }
  },
  "warnings": ["Line goip-10104 offline"]
}
```

### Set Up Monitoring Cron Job

**Option A: Simple Bash Script**
```bash
#!/bin/bash
# monitor-sms.sh

HEALTH_URL="http://your-server:3000/api/sms/health"
ALERT_EMAIL="admin@election.com"

response=$(curl -s $HEALTH_URL)
status=$(echo $response | jq -r '.status')

if [ "$status" != "healthy" ]; then
  echo "SMS System Alert: Status is $status" | mail -s "SMS Alert" $ALERT_EMAIL
fi
```

Run every 5 minutes:
```bash
crontab -e
# Add line:
*/5 * * * * /path/to/monitor-sms.sh
```

**Option B: Node.js Script**
Create `scripts/monitor-health.js`:
```javascript
const fetch = require('node-fetch');

async function checkHealth() {
  const response = await fetch('http://localhost:3000/api/sms/health');
  const health = await response.json();
  
  console.log(`[${new Date().toISOString()}] Status: ${health.status}`);
  
  if (health.status !== 'healthy') {
    console.error('⚠️ ALERT:', health.warnings);
    console.error('❌ ERRORS:', health.errors);
    // Send email/SMS alert here
  }
  
  if (health.checks.goip_lines) {
    console.log(`Lines: ${health.checks.goip_lines.active}/${health.checks.goip_lines.total} active`);
  }
}

checkHealth();
```

Run: `node scripts/monitor-health.js`

### Key Metrics to Watch

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| **Active Lines** | 6/6 | 4-5/6 | <4/6 |
| **Error Rate** | <5% | 5-10% | >10% |
| **Webhook Activity** | >0 msgs/5min | 0 msgs (off-peak) | 0 msgs (peak) |
| **Response Time** | <2s | 2-5s | >5s |
| **Active Sessions** | Variable | N/A | N/A |

---

## 🚨 Troubleshooting

### Issue: "You already submitted results"

**Cause**: Duplicate prevention working correctly  
**Solution**: Agent should contact supervisor to modify results  
**Database Check**:
```sql
SELECT reference_id, submitted_at, validation_status 
FROM election_results 
WHERE agent_id = 'xxx' AND polling_unit_code = 'yyy';
```

### Issue: Agent receives reply from different number

**Cause**: Line affinity not working  
**Check Session**:
```sql
SELECT * FROM sms_sessions WHERE phone_number = '08012345678';
```

**Expected**: `session_data->>'last_goip_line'` should match the line they contacted  
**Fix**: Clear session and have agent resend:
```sql
DELETE FROM sms_sessions WHERE phone_number = '08012345678';
```

### Issue: No messages being received

**Check 1**: Webhook configured correctly in DBL
```bash
# DBL SMS Server webhook URL should be:
http://your-server:3000/api/sms/goip/incoming
```

**Check 2**: Firewall allows DBL server
```bash
sudo ufw allow from DBL_SERVER_IP to any port 3000
```

**Check 3**: Health endpoint
```bash
curl http://localhost:3000/api/sms/health | jq '.checks.webhook_activity'
```

### Issue: High error rate

**Check Recent Failures**:
```sql
SELECT 
  phone_number,
  message,
  metadata->>'dbl_error_code' as error_code,
  metadata->>'dbl_error_message' as error_msg,
  created_at
FROM sms_logs
WHERE status = 'failed'
  AND direction = 'outbound'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

**Common Errors**:
- **Code 331**: No network service (SIM not registered)
- **Code 310**: SIM not inserted
- **Code 322**: Memory full
- **none_line**: Line not available (failover should handle this)

### Issue: Failover not working

**Check Logs**:
```bash
# Look for failover messages in application logs
npm run dev

# Should see:
# "Line goip-10103 failed, attempting failover..."
# "Failover successful! Used alternative line. Task ID: 5689"
```

**Test Manually**:
```javascript
// Test in browser console or Node
const response = await fetch('http://localhost:3000/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '08012345678',
    message: 'Test failover',
    goip_line: 'goip-10199' // Non-existent line
  })
});
console.log(await response.json());
// Should still succeed via round-robin
```

---

## 📊 Database Queries for Monitoring

### Check Line Distribution

```sql
SELECT 
  session_data->>'last_goip_line' as assigned_line,
  COUNT(*) as agent_count
FROM sms_sessions
WHERE last_activity > NOW() - INTERVAL '2 hours'
GROUP BY session_data->>'last_goip_line'
ORDER BY agent_count DESC;
```

### Check Submission Rate

```sql
SELECT 
  DATE_TRUNC('minute', submitted_at) as minute,
  COUNT(*) as submissions
FROM election_results
WHERE submitted_at > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', submitted_at)
ORDER BY minute DESC
LIMIT 60;
```

### Check Error Distribution by Line

```sql
SELECT 
  metadata->>'goip_line' as line,
  status,
  COUNT(*) as count
FROM sms_logs
WHERE direction = 'outbound'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY metadata->>'goip_line', status
ORDER BY line, status;
```

### Find Agents with Issues

```sql
SELECT 
  a.name,
  a.phone_number,
  a.polling_unit_code,
  COUNT(DISTINCT sl.id) as message_count,
  MAX(sl.created_at) as last_message
FROM agents a
LEFT JOIN sms_logs sl ON sl.phone_number = a.phone_number
WHERE sl.created_at > NOW() - INTERVAL '1 hour'
GROUP BY a.id, a.name, a.phone_number, a.polling_unit_code
HAVING COUNT(CASE WHEN sl.status = 'failed' THEN 1 END) > 2
ORDER BY last_message DESC;
```

---

## ✅ Pre-Launch Checklist

Before election day, verify:

### Database
- [ ] Migration 004 applied successfully
- [ ] Unique constraint `unique_agent_pu_result` exists
- [ ] All indexes created (check with `\di` in psql)
- [ ] Connection pool set to 50-100
- [ ] All 6000 agents loaded with correct phone numbers

### DBL SMS Server
- [ ] All 6 GoIP lines online and registered
- [ ] Webhook URLs configured:
  - [ ] Incoming: `http://your-server/api/sms/goip/incoming`
  - [ ] Status Report: `http://your-server/api/sms/dbl/status-report`
- [ ] Each line has unlimited SMS (or sufficient limit)
- [ ] Network connectivity stable

### Application
- [ ] Code deployed with all fixes
- [ ] Health endpoint accessible: `GET /api/sms/health`
- [ ] Test line affinity with 3+ different numbers
- [ ] Test duplicate prevention
- [ ] Test failover (disable a line and verify)
- [ ] Environment variables correct

### Monitoring
- [ ] Health check script running every 5 minutes
- [ ] Alert system configured
- [ ] Dashboard showing real-time stats
- [ ] Log aggregation working

### Testing
- [ ] End-to-end test with 10 agents on different lines
- [ ] Load test with 100 concurrent requests
- [ ] Verify no cross-contamination between agents
- [ ] Check response times under load

---

## 🎓 Training Notes for Election Day

### For System Administrators

**Monitor these during peak hours (2-6 PM):**
1. Health endpoint every 5 minutes
2. Error rate (should stay <10%)
3. Active lines (keep at least 4/6 online)
4. Database connection count (should not exceed pool size)

**What to do if:**
- **Line goes offline**: Agents can send to any of the other 5 numbers
- **Webhook stops**: Restart application, check firewall
- **High error rate**: Check DBL SMS Server, check SIM balances
- **Database slow**: Check connection pool, restart if needed

### For Support Staff

**Common agent issues:**
1. **"Why different number replied?"** 
   - This was a bug, now fixed. Ask them to resend.

2. **"I sent results twice by mistake"**
   - System prevents duplicates. Check dashboard for their submission.

3. **"No response received"**
   - Check if their number is registered
   - Check if line they used is online
   - Have them try different number

---

## 📞 Support Contacts

**System Issues**:
- Check: `GET /api/sms/health`
- Logs: `npm run dev` console
- Database: Supabase dashboard

**DBL Server Issues**:
- Web interface: `http://159.65.59.78`
- Username: `root`
- Check line status: `GET /api/sms/dbl/line-status`

---

## 🎯 Success Criteria

System is **ready for 6000 agents** if:

✅ All 6 lines online and registered  
✅ Line affinity tested and working  
✅ Duplicate prevention tested  
✅ Failover tested and working  
✅ Health monitoring operational  
✅ Database indexes applied  
✅ Connection pool configured  
✅ No errors in test submissions  

---

## 📝 Post-Election Cleanup

After election day:

```sql
-- Clean up old SMS sessions (after 7 days)
SELECT cleanup_old_sms_sessions();

-- Archive election results
CREATE TABLE election_results_2025_archive AS 
SELECT * FROM election_results;

-- Generate final report
SELECT 
  lga,
  COUNT(DISTINCT polling_unit_code) as units_reported,
  SUM(total_votes) as total_votes,
  COUNT(*) as total_submissions
FROM election_results
WHERE validation_status = 'validated'
GROUP BY lga
ORDER BY lga;
```

---

**🎉 All fixes implemented and ready for deployment!**

For questions or issues during deployment, refer to application logs and health endpoint first.
