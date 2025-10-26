import { NextRequest, NextResponse } from 'next/server';
import { queryDblLineStatus } from '@/lib/dbl-sms';

/**
 * Query DBL SMS Server Line Status
 * GET /api/sms/dbl/line-status
 * 
 * Returns status of all GoIP lines connected to DBL SMS Server
 */
export async function GET(request: NextRequest) {
  try {
    const lineStatuses = await queryDblLineStatus();
    
    // Transform data for frontend
    const formattedStatuses = lineStatuses.map(line => ({
      lineId: line.goip_line,
      online: line.online === '1',
      registered: line.reg === 'LOGIN',
      registrationStatus: line.reg || 'LOGOUT',
      remainingSMS: line.remain_sms === '-1' ? 'Unlimited' : line.remain_sms,
      dailyRemaining: line.day_remain_sms === '-1' ? 'Unlimited' : line.day_remain_sms,
      status: line.online === '1' && line.reg === 'LOGIN' ? 'active' : 
              line.online === '1' ? 'online_not_registered' : 'offline'
    }));
    
    // Calculate summary stats
    const summary = {
      total: formattedStatuses.length,
      active: formattedStatuses.filter(l => l.status === 'active').length,
      online: formattedStatuses.filter(l => l.online).length,
      offline: formattedStatuses.filter(l => !l.online).length,
      notRegistered: formattedStatuses.filter(l => l.online && !l.registered).length
    };
    
    return NextResponse.json({
      summary,
      lines: formattedStatuses
    });
    
  } catch (error) {
    console.error('Error querying DBL line status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to query line status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
