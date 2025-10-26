import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/incidents - List incident reports
 * Query params: lga, status, severity, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lga = searchParams.get('lga');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('incident_reports')
      .select(`
        *,
        agents:agent_id (
          name,
          phone_number,
          polling_unit_code
        )
      `, { count: 'exact' })
      .order('reported_at', { ascending: false });
    
    if (lga) {
      query = query.eq('lga', lga);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      incidents: data,
      total: count,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
