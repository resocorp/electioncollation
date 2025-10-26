# SMS Statistics Dashboard Feature
**Added**: October 26, 2025  
**Status**: ✅ Implemented

---

## 📊 What Was Added

SMS statistics are now displayed on the main dashboard, showing real-time SMS activity for the last 24 hours.

### New Dashboard Cards

1. **Total Messages** - Total SMS sent/received in last 24 hours with success rate
2. **Inbound SMS** - Messages received from agents
3. **Outbound SMS** - Responses sent to agents
4. **Active Sessions** - Number of agents with active SMS sessions in the last hour

---

## 🎯 Features

### Real-Time Metrics
- **24-hour SMS volume** - Total inbound + outbound messages
- **Success rate** - Percentage of successfully delivered messages
- **Active sessions** - Agents currently communicating via SMS
- **Line usage stats** - Message distribution across GoIP lines

### Data Sources
- `sms_logs` table - Message history
- `sms_sessions` table - Active agent sessions
- `line_usage_stats` view - Per-line message volume

---

## 📂 Files Modified

### Backend API
**File**: `src/app/api/dashboard/stats/route.ts`

**Changes**:
```typescript
// Added SMS statistics queries
const { data: smsLogs } = await supabase
  .from('sms_logs')
  .select('direction, status, created_at')
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

const totalSMS = smsLogs?.length || 0;
const inboundSMS = smsLogs?.filter(log => log.direction === 'inbound').length || 0;
const outboundSMS = smsLogs?.filter(log => log.direction === 'outbound').length || 0;
const failedSMS = smsLogs?.filter(log => log.status === 'failed').length || 0;
const successRate = totalSMS > 0 ? Math.round(((totalSMS - failedSMS) / totalSMS) * 100) : 100;

// Get active sessions (last hour)
const { count: activeSessions } = await supabase
  .from('sms_sessions')
  .select('*', { count: 'exact' })
  .gte('last_activity', new Date(Date.now() - 60 * 60 * 1000).toISOString());

// Get line usage from view
const { data: lineUsageData } = await supabase
  .from('line_usage_stats')
  .select('*')
  .limit(50);
```

**Response includes**:
```json
{
  "smsStats": {
    "totalSMS": 245,
    "inboundSMS": 120,
    "outboundSMS": 125,
    "failedSMS": 5,
    "successRate": 98,
    "activeSessions": 45,
    "lineUsage": [...]
  }
}
```

### Frontend Dashboard
**File**: `src/app/dashboard/page.tsx`

**Changes**:
1. Added new icons: `MessageSquare`, `Send`, `Inbox`, `TrendingUp`
2. Added SMS statistics section with 4 cards
3. Auto-refreshes every 60 seconds (same as other stats)

**UI Structure**:
```tsx
{stats?.smsStats && (
  <>
    <h2>SMS Activity (Last 24 Hours)</h2>
    <div className="grid grid-cols-4 gap-6">
      <Card>Total Messages</Card>
      <Card>Inbound SMS</Card>
      <Card>Outbound SMS</Card>
      <Card>Active Sessions</Card>
    </div>
  </>
)}
```

---

## 🎨 Dashboard Layout

### Before
```
┌─────────────────────────────────────────┐
│ Dashboard Overview                      │
├─────────────────────────────────────────┤
│ [PU Agents] [Results] [Votes] [Incidents]
├─────────────────────────────────────────┤
│ [Party Votes Chart] [Vote Distribution] │
├─────────────────────────────────────────┤
│ [Latest Results Feed]                   │
└─────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────┐
│ Dashboard Overview                      │
├─────────────────────────────────────────┤
│ [PU Agents] [Results] [Votes] [Incidents]
├─────────────────────────────────────────┤
│ SMS Activity (Last 24 Hours)            │ ← NEW
│ [Total] [Inbound] [Outbound] [Sessions] │ ← NEW
├─────────────────────────────────────────┤
│ [Party Votes Chart] [Vote Distribution] │
├─────────────────────────────────────────┤
│ [Latest Results Feed]                   │
└─────────────────────────────────────────┘
```

---

## 📈 Metrics Explained

### Total Messages
- **What**: Sum of all SMS (inbound + outbound) in last 24 hours
- **Includes**: Successful and failed messages
- **Color**: Purple
- **Icon**: MessageSquare
- **Subtext**: Success rate percentage

### Inbound SMS
- **What**: Messages received from agents
- **Examples**: Result submissions, STATUS queries, HELP requests
- **Color**: Blue
- **Icon**: Inbox
- **Subtext**: "From agents"

### Outbound SMS
- **What**: Messages sent to agents
- **Examples**: Confirmations, error messages, status responses
- **Color**: Green
- **Icon**: Send
- **Subtext**: "Responses sent"

### Active Sessions
- **What**: Number of unique agents who sent SMS in the last hour
- **Tracked by**: `sms_sessions` table with `last_activity` timestamp
- **Color**: Orange
- **Icon**: TrendingUp
- **Subtext**: "Last hour"

---

## 🔍 Monitoring Use Cases

### Election Day Monitoring

**Normal Activity**:
```
Total Messages: 1,245 (98% success)
Inbound: 620
Outbound: 625
Active Sessions: 150
```

**High Activity (Results Submission)**:
```
Total Messages: 5,680 (95% success)
Inbound: 2,840
Outbound: 2,840
Active Sessions: 1,200
```

**Problem Detection**:
```
Total Messages: 450 (65% success) ← Low success rate!
Inbound: 300
Outbound: 150 ← Fewer responses than inbound!
Active Sessions: 5 ← Very low activity during peak!
```

### What to Watch

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| **Success Rate** | >95% | 85-95% | <85% |
| **Inbound/Outbound Ratio** | ~1:1 | 1:0.8 | 1:0.5 |
| **Active Sessions (Peak)** | 500+ | 100-500 | <100 |
| **Total Messages (Peak)** | 1000+/hr | 500-1000/hr | <500/hr |

---

## 🚀 How to Use

### View SMS Stats
1. Go to main dashboard: `http://localhost:3000/dashboard`
2. Scroll to "SMS Activity (Last 24 Hours)" section
3. Stats auto-refresh every 60 seconds

### Interpret the Data

**Scenario 1: Low success rate**
```
Total: 500 (70% success) ← Problem!
```
**Action**: 
- Check `/dashboard/sms-lines` for offline lines
- Check `/api/sms/health` for system status
- Review `sms_logs` for error patterns

**Scenario 2: Imbalanced inbound/outbound**
```
Inbound: 300
Outbound: 150 ← Only 50% responses!
```
**Action**:
- Check application logs for errors
- Verify webhook is working
- Check if responses are being sent

**Scenario 3: No active sessions during peak**
```
Active Sessions: 0 ← During 4 PM results time!
```
**Action**:
- Check if webhook is down
- Verify agents have correct phone numbers
- Check if GoIP lines are online

---

## 🔗 Related Features

### SMS Line Status Page
**URL**: `/dashboard/sms-lines`
**Shows**: Real-time GoIP line status (online/offline/registered)
**Refresh**: Every 30 seconds

### Health Monitoring API
**URL**: `/api/sms/health`
**Shows**: System health, line status, error rates
**Use**: Automated monitoring scripts

### Line Usage Stats View
**Database**: `line_usage_stats` view
**Shows**: Message volume per GoIP line per hour
**Query**:
```sql
SELECT * FROM line_usage_stats 
ORDER BY hour_bucket DESC 
LIMIT 20;
```

---

## 📊 Sample Queries

### Get SMS stats for specific time range
```sql
SELECT 
  direction,
  status,
  COUNT(*) as count
FROM sms_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY direction, status
ORDER BY direction, status;
```

### Get hourly SMS volume
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  direction,
  COUNT(*) as message_count
FROM sms_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), direction
ORDER BY hour DESC;
```

### Get active sessions with details
```sql
SELECT 
  phone_number,
  session_data->>'last_goip_line' as line,
  session_data->>'message_count' as messages,
  last_activity
FROM sms_sessions
WHERE last_activity > NOW() - INTERVAL '1 hour'
ORDER BY last_activity DESC;
```

### Get success rate by line
```sql
SELECT 
  metadata->>'goip_line' as line,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status != 'failed') as successful,
  ROUND(COUNT(*) FILTER (WHERE status != 'failed')::numeric / COUNT(*) * 100, 1) as success_rate
FROM sms_logs
WHERE direction = 'outbound'
  AND created_at >= NOW() - INTERVAL '24 hours'
  AND metadata->>'goip_line' IS NOT NULL
GROUP BY metadata->>'goip_line'
ORDER BY success_rate DESC;
```

---

## ✅ Testing

### Test SMS Stats Display

1. **Start development server**:
```bash
npm run dev
```

2. **Open dashboard**:
```
http://localhost:3000/dashboard
```

3. **Verify SMS stats section appears** (may show 0 if no recent SMS)

4. **Send test SMS**:
```bash
curl -X POST http://localhost:3000/api/sms/goip/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "goip_line": "goip-10101",
    "from_number": "08012345678",
    "content": "STATUS",
    "recv_time": "2025-10-26T10:00:00Z"
  }'
```

5. **Refresh dashboard** - Should see:
- Total Messages: 2 (inbound + outbound)
- Inbound SMS: 1
- Outbound SMS: 1
- Active Sessions: 1

### Verify Database Queries

```sql
-- Check if stats are being calculated correctly
SELECT 
  (SELECT COUNT(*) FROM sms_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as total_sms,
  (SELECT COUNT(*) FROM sms_logs WHERE direction = 'inbound' AND created_at >= NOW() - INTERVAL '24 hours') as inbound,
  (SELECT COUNT(*) FROM sms_logs WHERE direction = 'outbound' AND created_at >= NOW() - INTERVAL '24 hours') as outbound,
  (SELECT COUNT(*) FROM sms_sessions WHERE last_activity >= NOW() - INTERVAL '1 hour') as active_sessions;
```

---

## 🎓 Benefits

### For System Administrators
- **Real-time visibility** into SMS system health
- **Early problem detection** (low success rates, imbalanced traffic)
- **Capacity monitoring** (active sessions during peak)

### For Election Coordinators
- **Agent engagement tracking** (active sessions = agents communicating)
- **System performance** (success rate = reliable delivery)
- **Activity patterns** (peak times, quiet periods)

### For Technical Support
- **Quick diagnostics** (one glance shows if SMS is working)
- **Trend analysis** (comparing current vs historical activity)
- **Issue prioritization** (critical if success rate drops during peak)

---

## 🔄 Auto-Refresh

Stats automatically refresh every **60 seconds** (same as other dashboard stats).

To change refresh interval:
```typescript
// In src/app/dashboard/page.tsx
const statsInterval = setInterval(fetchStats, 60000); // Change to desired ms
```

---

## 🎯 Next Steps

### Potential Enhancements

1. **SMS Volume Chart**
   - Line chart showing hourly SMS volume
   - Separate lines for inbound/outbound
   - Last 24 hours

2. **Line Distribution Chart**
   - Bar chart showing messages per GoIP line
   - Helps identify load imbalance

3. **Success Rate Trend**
   - Track success rate over time
   - Alert when drops below threshold

4. **Agent Activity Heatmap**
   - Show which LGAs/wards are most active
   - Identify areas with low engagement

5. **SMS Response Time**
   - Track time between inbound and outbound
   - Identify processing delays

---

## 📝 Summary

✅ SMS statistics now visible on main dashboard  
✅ Real-time metrics for last 24 hours  
✅ Auto-refreshes every 60 seconds  
✅ Uses database views for efficient queries  
✅ Helps monitor system health during elections  

**Status**: Ready for production use!
