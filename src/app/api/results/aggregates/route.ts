import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/results/aggregates - Get aggregated results
 * Query params: level (state|lga|ward), lga, ward
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level') || 'state';
    const lga = searchParams.get('lga');
    const ward = searchParams.get('ward');
    
    // Get validated results only
    let query = supabase
      .from('election_results')
      .select('*')
      .eq('validation_status', 'validated');
    
    if (level === 'lga' && lga) {
      query = query.eq('lga', lga);
    }
    
    if (level === 'ward' && ward && lga) {
      query = query.eq('lga', lga).eq('ward', ward);
    }
    
    const { data: results, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Aggregate party votes
    const aggregates: Record<string, number> = {};
    let totalVotes = 0;
    
    results?.forEach(result => {
      const partyVotes = result.party_votes as Record<string, number>;
      Object.entries(partyVotes).forEach(([party, votes]) => {
        aggregates[party] = (aggregates[party] || 0) + votes;
        totalVotes += votes;
      });
    });
    
    // Get total PUs and submitted count
    let puCountQuery = supabase.from('agents').select('polling_unit_code', { count: 'exact' }).eq('role', 'pu_agent');
    
    if (lga) {
      puCountQuery = puCountQuery.eq('lga', lga);
    }
    
    if (ward) {
      puCountQuery = puCountQuery.eq('ward', ward);
    }
    
    const { count: totalPUs } = await puCountQuery;
    
    // Get submitted count
    let submittedQuery = supabase.from('election_results').select('id', { count: 'exact' });
    
    if (lga) {
      submittedQuery = submittedQuery.eq('lga', lga);
    }
    
    if (ward) {
      submittedQuery = submittedQuery.eq('ward', ward);
    }
    
    const { count: submittedCount } = await submittedQuery;
    
    return NextResponse.json({
      level,
      lga,
      ward,
      partyVotes: aggregates,
      totalVotes,
      totalPUs: totalPUs || 0,
      submittedCount: submittedCount || 0,
      validatedCount: results?.length || 0,
      submissionPercentage: totalPUs ? Math.round((submittedCount || 0) / totalPUs * 100) : 0
    });
    
  } catch (error) {
    console.error('Error fetching aggregates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
