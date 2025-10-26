import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { queryDblLineStatus } from '@/lib/dbl-sms';

/**
 * SMS System Health Check
 * GET /api/sms/health
 * 
 * Monitors:
 * - Webhook activity (detects gaps in message flow)
 * - GoIP line status
 * - Database connectivity
 * - Recent error rates
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const health: any = {
      timestamp: now.toISOString(),
      status: 'healthy',
      checks: {},
      warnings: [],
      errors: []
    };

    // 1. Check webhook activity (last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const { data: recentInbound, error: inboundError } = await supabase
      .from('sms_logs')
      .select('id, created_at')
      .eq('direction', 'inbound')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });

    if (inboundError) {
      health.errors.push('Database connectivity issue');
      health.status = 'unhealthy';
      health.checks.database = 'failed';
    } else {
      health.checks.database = 'ok';
      health.checks.webhook_activity = {
        last_5_min: recentInbound?.length || 0,
        status: (recentInbound && recentInbound.length > 0) ? 'active' : 'idle'
      };
    }

    // 2. Check for gaps in message flow (during peak hours)
    const hour = now.getHours();
    const isPeakHours = hour >= 14 && hour <= 18; // 2 PM - 6 PM election day
    
    if (isPeakHours && (!recentInbound || recentInbound.length === 0)) {
      health.warnings.push('No messages received in last 5 minutes during peak hours - webhook may be down');
      health.status = 'warning';
    }

    // 3. Check GoIP line status
    try {
      const lineStatuses = await queryDblLineStatus();
      const activeLines = lineStatuses.filter(l => l.online === '1' && l.reg === 'LOGIN');
      const totalLines = lineStatuses.length;

      health.checks.goip_lines = {
        total: totalLines,
        active: activeLines.length,
        offline: totalLines - activeLines.length,
        details: lineStatuses.map(line => ({
          id: line.goip_line,
          online: line.online === '1',
          registered: line.reg === 'LOGIN',
          remaining_sms: line.remain_sms === '-1' ? 'unlimited' : line.remain_sms
        }))
      };

      if (activeLines.length === 0) {
        health.errors.push('No active GoIP lines available');
        health.status = 'critical';
      } else if (activeLines.length < totalLines * 0.5) {
        health.warnings.push(`Only ${activeLines.length}/${totalLines} lines active`);
        if (health.status === 'healthy') health.status = 'warning';
      }
    } catch (lineError) {
      health.errors.push('Cannot connect to DBL SMS Server');
      health.status = 'critical';
      health.checks.goip_lines = 'failed';
    }

    // 4. Check recent error rates (last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('sms_logs')
      .select('status')
      .gte('created_at', oneHourAgo);

    if (recentLogs) {
      const total = recentLogs.length;
      const failed = recentLogs.filter(log => log.status === 'failed').length;
      const errorRate = total > 0 ? (failed / total) * 100 : 0;

      health.checks.error_rate = {
        last_hour: `${errorRate.toFixed(1)}%`,
        total_messages: total,
        failed_messages: failed,
        status: errorRate > 10 ? 'high' : errorRate > 5 ? 'moderate' : 'normal'
      };

      if (errorRate > 10) {
        health.warnings.push(`High error rate: ${errorRate.toFixed(1)}% in last hour`);
        if (health.status === 'healthy') health.status = 'warning';
      }
    }

    // 5. Check for stuck sessions (no activity in 2 hours)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: activeSessions } = await supabase
      .from('sms_sessions')
      .select('phone_number, last_activity')
      .gte('last_activity', twoHoursAgo);

    health.checks.active_sessions = {
      count: activeSessions?.length || 0,
      status: 'ok'
    };

    // 6. Summary
    health.summary = {
      overall_status: health.status,
      webhook_health: health.checks.webhook_activity?.status || 'unknown',
      lines_available: health.checks.goip_lines?.active || 0,
      error_rate: health.checks.error_rate?.last_hour || '0%',
      active_users: activeSessions?.length || 0
    };

    return NextResponse.json(health, {
      status: health.status === 'critical' ? 500 : 200
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
