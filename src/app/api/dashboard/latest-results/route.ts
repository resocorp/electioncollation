import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/dashboard/latest-results - Get latest submitted results
 * Query params: limit (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get latest submitted results with agent info
    const { data: results, error } = await supabase
      .from('election_results')
      .select(`
        id,
        reference_id,
        polling_unit_code,
        ward,
        lga,
        party_votes,
        total_votes,
        submitted_at,
        agents!inner(name, phone_number)
      `)
      .order('submitted_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching latest results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch latest results' },
        { status: 500 }
      );
    }
    
    // Format the results
    const formattedResults = results?.map(result => {
      const agent = Array.isArray(result.agents) ? result.agents[0] : result.agents;
      return {
        id: result.id,
        referenceId: result.reference_id,
        pollingUnit: result.polling_unit_code,
        ward: result.ward,
        lga: result.lga,
        partyVotes: result.party_votes,
        totalVotes: result.total_votes,
        submittedAt: result.submitted_at,
        agentName: agent?.name || 'Unknown',
        agentPhone: agent?.phone_number || 'N/A'
      };
    }) || [];
    
    return NextResponse.json({
      results: formattedResults,
      count: formattedResults.length
    });
    
  } catch (error) {
    console.error('Error fetching latest results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
