import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/sms/logs - View recent SMS logs
 * Query params:
 *   - limit: number of records (default: 50)
 *   - phone: filter by phone number
 *   - direction: 'inbound' or 'outbound'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const phone = searchParams.get('phone');
    const direction = searchParams.get('direction');

    let query = supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (phone) {
      query = query.eq('phone_number', phone);
    }

    if (direction) {
      query = query.eq('direction', direction);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SMS logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data.length,
      logs: data,
      filters: {
        limit,
        phone: phone || 'all',
        direction: direction || 'all'
      }
    });
  } catch (error) {
    console.error('Error in logs endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
