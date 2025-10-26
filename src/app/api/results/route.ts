import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/results - List election results
 * Query params: lga, ward, status, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lga = searchParams.get('lga');
    const ward = searchParams.get('ward');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('election_results')
      .select(`
        *,
        agents:agent_id (
          name,
          phone_number,
          polling_unit_code
        )
      `, { count: 'exact' })
      .order('submitted_at', { ascending: false });
    
    if (lga) {
      query = query.eq('lga', lga);
    }
    
    if (ward) {
      query = query.eq('ward', ward);
    }
    
    if (status) {
      query = query.eq('validation_status', status);
    }
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      results: data,
      total: count,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
