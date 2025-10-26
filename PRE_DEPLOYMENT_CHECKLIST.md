# Pre-Deployment Checklist
**Complete this before going live on election day**

Date: _______________  
Completed by: _______________

---

## ✅ Phase 1: Database Preparation

### Database Migration
- [ ] Migration `004_line_affinity_and_optimizations.sql` applied
- [ ] All 6 indexes created and verified
- [ ] Unique constraint `unique_agent_pu_result` exists
- [ ] Helper views created: `line_usage_stats`, `active_sms_sessions`
- [ ] Cleanup function `cleanup_old_sms_sessions()` exists

**Verification Commands**:
```sql
-- Check indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('election_results', 'sms_sessions', 'sms_logs')
ORDER BY tablename;
-- Should show 5+ new indexes

-- Check constraint
SELECT conname FROM pg_constraint 
WHERE conrelid = 'election_results'::regclass 
  AND conname = 'unique_agent_pu_result';
-- Should return 1 row

-- Check views
SELECT viewname FROM pg_views WHERE viewname IN ('line_usage_stats', 'active_sms_sessions');
-- Should return 2 rows
```

### Connection Pooling
- [ ] Supabase pool mode set to: **Transaction**
- [ ] Pool size configured: **50-100 connections**
- [ ] Tested under load: Connection count < 50% of pool size

**Settings Location**: Supabase Dashboard → Settings → Database → Connection Pooling

### Data Loading
- [ ] All 6000 agents loaded in `agents` table
- [ ] Phone numbers in correct format: `08XXXXXXXXX` (11 digits, starting with 0)
- [ ] Each agent has valid `polling_unit_code`, `ward`, `lga`
- [ ] No duplicate phone numbers

**Verification**:
```sql
-- Check agent count
SELECT COUNT(*) FROM agents WHERE role = 'pu_agent';
-- Should return: 6000

-- Check phone format
SELECT COUNT(*) FROM agents 
WHERE phone_number !~ '^0[0-9]{10}$' OR LENGTH(phone_number) != 11;
-- Should return: 0

-- Check for duplicates
SELECT phone_number, COUNT(*) 
FROM agents 
GROUP BY phone_number 
HAVING COUNT(*) > 1;
-- Should return: 0 rows
```

---

## ✅ Phase 2: DBL SMS Server Configuration

### GoIP Lines Status
- [ ] All 6 (or more) GoIP lines showing as **ONLINE**
- [ ] All lines showing as **LOGIN** (registered to network)
- [ ] Each line has SIM card properly inserted
- [ ] SIM PIN disabled on all cards
- [ ] SMS limits configured (or set to unlimited)

**Verification**: Check screenshot or run:
```bash
curl http://localhost:3000/api/sms/dbl/line-status | jq '.checks.goip_lines'
```

Expected:
```json
{
  "total": 6,
  "active": 6,
  "offline": 0
}
```

### Webhook Configuration
- [ ] Incoming SMS webhook URL configured in DBL
  - URL: `http://YOUR-SERVER-IP:3000/api/sms/goip/incoming`
  - Method: POST
  - Format: JSON

- [ ] Status report webhook URL configured in DBL
  - URL: `http://YOUR-SERVER-IP:3000/api/sms/dbl/status-report`
  - Method: POST
  - Format: JSON

- [ ] Test webhook with curl (should receive 200 OK):
```bash
curl -X POST http://YOUR-SERVER:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{"goip_line":"goip-10101","from_number":"08012345678","content":"TEST","recv_time":"2025-10-26T10:00:00Z"}'
```

### Network & Firewall
- [ ] DBL SMS Server can reach your application server
- [ ] Firewall allows incoming from DBL server IP: `159.65.59.78`
- [ ] Application server publicly accessible (or ngrok tunnel configured)

**Test connectivity**:
```bash
# From DBL server, test if it can reach your app
ping YOUR-SERVER-IP

# From your server, test if you can reach DBL
ping 159.65.59.78
curl http://159.65.59.78
```

---

## ✅ Phase 3: Application Deployment

### Environment Variables
- [ ] `.env.local` file exists and configured
- [ ] `DBL_SMS_SERVER_IP=159.65.59.78` ✓
- [ ] `DBL_SMS_SERVER_PORT=80` ✓
- [ ] `DBL_SMS_USERNAME` set correctly
- [ ] `DBL_SMS_PASSWORD` set correctly
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL

**Verify**:
```bash
cat .env.local | grep DBL_SMS
# Should show all 5 variables
```

### Code Deployment
- [ ] All code changes pulled from repository
- [ ] Dependencies installed: `npm install`
- [ ] Application built successfully: `npm run build`
- [ ] No TypeScript errors
- [ ] Application starts without errors: `npm run dev` or `npm start`

### Feature Verification
- [ ] Line affinity working (test script passed)
- [ ] Duplicate prevention working (test script passed)
- [ ] Message ordering safeguards active
- [ ] Failover logic tested
- [ ] Health monitoring accessible

**Run Tests**:
```bash
node scripts/test-line-affinity.js
node scripts/test-duplicate-prevention.js
curl http://localhost:3000/api/sms/health
```

---

## ✅ Phase 4: Monitoring Setup

### Health Monitoring
- [ ] Health check endpoint accessible: `GET /api/sms/health`
- [ ] Returns expected JSON structure
- [ ] Shows correct line status
- [ ] Cron job or scheduled task configured (every 5 minutes)

**Linux/Mac Cron**:
```bash
crontab -e
# Add:
*/5 * * * * /path/to/scripts/run-health-check.sh
```

**Windows Task Scheduler**:
```powershell
# Create scheduled task to run every 5 minutes:
# Action: powershell.exe
# Arguments: -File "C:\path\to\scripts\run-health-check.ps1"
```

### Logging
- [ ] Application logs being written
- [ ] Log rotation configured (if using file logs)
- [ ] Can view real-time logs: `npm run dev` console or `pm2 logs`

### Alerting
- [ ] Email/SMS alerts configured for critical issues
- [ ] Alert recipients verified
- [ ] Test alert sent and received

---

## ✅ Phase 5: Load Testing

### Database Performance
- [ ] Duplicate check query < 10ms
- [ ] Session lookup query < 5ms
- [ ] SMS log insert < 20ms

**Test**:
```sql
\timing on
-- Run the queries from QUICK_START_TESTING.md
-- All should complete in < 20ms
```

### Concurrent Load
- [ ] Load test passed: 10 requests/second for 1 minute
- [ ] No errors during load test
- [ ] Response times acceptable (< 2 seconds)
- [ ] Database connections stayed below 50% of pool

**Run**:
```bash
artillery run load-test.yml
# Monitor: curl http://localhost:3000/api/sms/health
```

### Stress Test (Optional but recommended)
- [ ] Simulated 100+ agents sending simultaneously
- [ ] System remained stable
- [ ] All messages processed correctly
- [ ] No database deadlocks or timeouts

---

## ✅ Phase 6: Capacity Planning

### Current Setup Review
Number of GoIP lines: _______ (minimum recommended: 6)
Expected peak agents submitting simultaneously: _______

**Capacity calculation**:
- Each line handles: ~15 SMS/min
- Total capacity: 6 lines × 15 = **90 SMS/min**
- Peak load estimate: 6000 agents in 10 min = **600 SMS/min**
- **Deficit**: 510 SMS/min (85% short)

### Mitigation Strategy Selected
Choose ONE:

- [ ] **Option A**: Add more GoIP lines (need 40 total)
  - Cost: _______
  - Timeline: _______
  - Status: _______

- [ ] **Option B**: Batch submissions by LGA (recommended)
  - Created submission schedule (21 LGAs × 5-min slots)
  - Schedule communicated to agents
  - Brings load to ~57 SMS/min ✓

- [ ] **Option C**: Hybrid (GoIP + SMS gateway)
  - SMS gateway configured: _______
  - Failover rules set
  - Cost: _______

**Selected option**: _______ (initial here: _______)

---

## ✅ Phase 7: Team Training

### Technical Team
- [ ] Trained on health monitoring dashboard
- [ ] Know how to read health check output
- [ ] Trained on common troubleshooting scenarios
- [ ] Have access to:
  - [ ] Supabase dashboard
  - [ ] DBL SMS Server web interface
  - [ ] Application server (SSH/RDP)
  - [ ] This documentation

### Support Team
- [ ] Trained on agent SMS commands
- [ ] Know how to check agent submission status
- [ ] Trained on duplicate submission handling
- [ ] Trained on line failure procedures
- [ ] Have access to:
  - [ ] Dashboard (read-only)
  - [ ] This documentation
  - [ ] Contact list for escalation

### Field Coordinators
- [ ] Trained agents on SMS format
- [ ] Distributed all 6 phone numbers to agents
- [ ] Explained what to do if no response
- [ ] Created backup plan (manual collection)

---

## ✅ Phase 8: Final Verification

### End-to-End Test
- [ ] Test agent submits result via SMS
- [ ] Result appears in dashboard within 10 seconds
- [ ] Response SMS received by agent
- [ ] Response comes from SAME number agent contacted
- [ ] Second submission is rejected

### Backup & Recovery
- [ ] Database backup configured (Supabase handles this)
- [ ] Know how to restore from backup
- [ ] Emergency contacts documented
- [ ] Rollback plan prepared

### Documentation
- [ ] All team members have access to:
  - [ ] `SCALE_FIXES_DEPLOYMENT_GUIDE.md`
  - [ ] `IMPLEMENTATION_SUMMARY.md`
  - [ ] `QUICK_START_TESTING.md`
  - [ ] This checklist

---

## ✅ Phase 9: Election Day Preparation

### 24 Hours Before
- [ ] Run full health check
- [ ] Verify all 6 lines online and registered
- [ ] Test end-to-end with 5-10 agents
- [ ] Clear any test data
- [ ] Notify DBL provider of expected high volume

### Election Morning (6:00 AM)
- [ ] Restart application (fresh start)
- [ ] Verify health check: all systems green
- [ ] Check GoIP lines: all active
- [ ] Test with 2-3 agents
- [ ] Team on standby

### During Voting (8:00 AM - 2:00 PM)
- [ ] Monitor health every 15 minutes
- [ ] Address any line failures immediately
- [ ] Support team available for agent queries

### Results Period (2:00 PM - 6:00 PM) - CRITICAL
- [ ] Monitor health every 5 minutes
- [ ] Full team on alert
- [ ] Watch for:
  - [ ] Line failures
  - [ ] High error rates (>10%)
  - [ ] Database slowdown
  - [ ] Webhook gaps

---

## 🚨 Emergency Contacts

**Technical Lead**: _________________ (Phone: _____________)  
**Database Admin**: _________________ (Phone: _____________)  
**DBL Support**: _________________ (Phone: _____________)  
**Network Admin**: _________________ (Phone: _____________)

---

## ✅ Sign-Off

I confirm that all items in this checklist have been completed and verified.

**Technical Lead**: ___________________ Date: _______ Signature: _________

**Project Manager**: _________________ Date: _______ Signature: _________

**System Administrator**: ____________ Date: _______ Signature: _________

---

## 📊 Final Go/No-Go Decision

Based on this checklist, the system is:

- [ ] **GO** - Ready for election day
- [ ] **NO-GO** - Issues must be resolved first

**Issues preventing GO** (if any):
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

**Date of GO decision**: _____________
**Authorized by**: _____________________

---

**Keep this checklist for post-election review and future reference.**
