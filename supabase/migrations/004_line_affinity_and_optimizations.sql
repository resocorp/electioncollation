-- Migration 004: Line Affinity, Duplicate Prevention, and Performance Optimizations
-- Purpose: Fix critical issues for 6000-agent deployment across 6 GoIP lines

-- ====================================================================================
-- 1. ADD INDEXES FOR PERFORMANCE
-- ====================================================================================

-- Optimize agent + polling unit lookups (prevents duplicate submissions)
CREATE INDEX IF NOT EXISTS idx_results_agent_pu 
ON election_results(agent_id, polling_unit_code);

-- Optimize SMS session lookups by phone number
CREATE INDEX IF NOT EXISTS idx_sms_sessions_phone 
ON sms_sessions(phone_number);

-- Optimize SMS session by last activity (for cleanup queries)
CREATE INDEX IF NOT EXISTS idx_sms_sessions_activity 
ON sms_sessions(last_activity);

-- Optimize outbound SMS lookups by metadata task_id (for status updates)
CREATE INDEX IF NOT EXISTS idx_sms_logs_task_id 
ON sms_logs((metadata->>'dbl_task_id')) 
WHERE direction = 'outbound';

-- Optimize SMS logs by created_at and status (for monitoring)
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_status 
ON sms_logs(created_at, status);

-- ====================================================================================
-- 2. ADD UNIQUE CONSTRAINT FOR DUPLICATE PREVENTION
-- ====================================================================================

-- Prevent duplicate result submissions from same agent at same polling unit
-- Note: If there are existing duplicates, this will fail. Clean them up first.
DO $$ 
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_agent_pu_result'
  ) THEN
    -- Add unique constraint
    ALTER TABLE election_results 
    ADD CONSTRAINT unique_agent_pu_result 
    UNIQUE(agent_id, polling_unit_code);
  END IF;
END $$;

-- ====================================================================================
-- 3. ADD GOIP LINE TRACKING TO SMS SESSIONS
-- ====================================================================================

-- session_data JSONB already exists, but let's ensure it has proper structure
-- Add a comment to document the expected structure
COMMENT ON COLUMN sms_sessions.session_data IS 
'Expected structure: {
  "last_goip_line": "goip-10101",
  "last_contacted_at": "2025-10-26T08:00:00Z",
  "message_count": 5,
  "last_message_type": "result"
}';

-- ====================================================================================
-- 4. ADD STATUS FIELD TO SMS LOGS FOR DELIVERY TRACKING
-- ====================================================================================

-- Check if 'delivered' and 'sending' are already in the status enum
DO $$ 
BEGIN
  -- Add 'delivered' status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'delivered' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sms_logs_status_check')
  ) THEN
    -- Drop and recreate constraint to add new status
    ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_status_check;
    ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_status_check 
    CHECK (status IN ('received', 'sent', 'failed', 'pending', 'delivered', 'sending'));
  END IF;
END $$;

-- ====================================================================================
-- 5. ADD FUNCTION TO CLEAN UP OLD SMS SESSIONS
-- ====================================================================================

CREATE OR REPLACE FUNCTION cleanup_old_sms_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions older than 7 days with no activity
  DELETE FROM sms_sessions
  WHERE last_activity < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_sms_sessions() IS 
'Cleans up SMS sessions older than 7 days. Run this periodically via cron job.';

-- ====================================================================================
-- 6. ADD VIEW FOR LINE USAGE STATISTICS
-- ====================================================================================

CREATE OR REPLACE VIEW line_usage_stats AS
SELECT 
  metadata->>'goip_line' as goip_line,
  direction,
  status,
  COUNT(*) as message_count,
  DATE_TRUNC('hour', created_at) as hour_bucket
FROM sms_logs
WHERE metadata->>'goip_line' IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'goip_line', direction, status, DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC, goip_line;

COMMENT ON VIEW line_usage_stats IS 
'Shows SMS volume per GoIP line per hour for the last 24 hours. Use for monitoring line distribution.';

-- ====================================================================================
-- 7. ADD VIEW FOR ACTIVE SESSIONS
-- ====================================================================================

CREATE OR REPLACE VIEW active_sms_sessions AS
SELECT 
  phone_number,
  session_data->>'last_goip_line' as assigned_line,
  session_data->>'message_count' as message_count,
  last_activity,
  AGE(NOW(), last_activity) as idle_time
FROM sms_sessions
WHERE last_activity > NOW() - INTERVAL '1 hour'
ORDER BY last_activity DESC;

COMMENT ON VIEW active_sms_sessions IS 
'Shows active SMS sessions in the last hour with their assigned GoIP line.';

-- ====================================================================================
-- 8. ADD FUNCTION TO GET LINE AFFINITY FOR A PHONE NUMBER
-- ====================================================================================

CREATE OR REPLACE FUNCTION get_line_affinity(p_phone_number TEXT)
RETURNS TEXT AS $$
DECLARE
  v_line TEXT;
BEGIN
  SELECT session_data->>'last_goip_line'
  INTO v_line
  FROM sms_sessions
  WHERE phone_number = p_phone_number
  ORDER BY last_activity DESC
  LIMIT 1;
  
  RETURN v_line;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_line_affinity(TEXT) IS 
'Returns the last GoIP line used by a phone number, or NULL if no session exists.';

-- ====================================================================================
-- VERIFICATION QUERIES (Run these after migration to verify)
-- ====================================================================================

-- Check if indexes were created
-- SELECT schemaname, tablename, indexname FROM pg_indexes 
-- WHERE tablename IN ('election_results', 'sms_sessions', 'sms_logs');

-- Check constraint
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'election_results'::regclass;

-- Test line affinity function
-- SELECT get_line_affinity('08011111111');

-- View line usage stats
-- SELECT * FROM line_usage_stats LIMIT 20;

-- View active sessions
-- SELECT * FROM active_sms_sessions LIMIT 20;
