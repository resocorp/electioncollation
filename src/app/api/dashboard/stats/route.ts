import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/dashboard/stats - Get dashboard statistics
 * Query params: lga, ward
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lga = searchParams.get('lga');
    const ward = searchParams.get('ward');
    
    // Get expected total PUs from polling_units table
    let expectedPUsQuery = supabase
      .from('polling_units')
      .select('id', { count: 'exact' });
    
    if (lga) expectedPUsQuery = expectedPUsQuery.eq('lga', lga);
    if (ward) expectedPUsQuery = expectedPUsQuery.eq('ward', ward);
    
    const { count: expectedTotalPUs } = await expectedPUsQuery;
    
    // Get profiled PU agents
    let puQuery = supabase
      .from('agents')
      .select('polling_unit_code', { count: 'exact' })
      .eq('role', 'pu_agent');
    
    if (lga) puQuery = puQuery.eq('lga', lga);
    if (ward) puQuery = puQuery.eq('ward', ward);
    
    const { count: profiledAgents } = await puQuery;
    
    // Get submitted results
    let submittedQuery = supabase
      .from('election_results')
      .select('*', { count: 'exact' });
    
    if (lga) submittedQuery = submittedQuery.eq('lga', lga);
    if (ward) submittedQuery = submittedQuery.eq('ward', ward);
    
    const { count: submittedCount, data: allResults } = await submittedQuery;
    
    // Note: Validation status removed - all submitted results are now shown
    
    // Get incidents with detailed breakdown
    let incidentQuery = supabase
      .from('incident_reports')
      .select('*', { count: 'exact' });
    
    if (lga) incidentQuery = incidentQuery.eq('lga', lga);
    if (ward) incidentQuery = incidentQuery.eq('ward', ward);
    
    const { count: totalIncidents, data: incidents } = await incidentQuery;
    
    // Count by severity and status
    const criticalIncidents = incidents?.filter(i => i.severity === 'critical').length || 0;
    const highIncidents = incidents?.filter(i => i.severity === 'high').length || 0;
    const investigatingIncidents = incidents?.filter(i => i.status === 'investigating').length || 0;
    const resolvedIncidents = incidents?.filter(i => i.status === 'resolved' || i.status === 'closed').length || 0;
    const reportedIncidents = incidents?.filter(i => i.status === 'reported').length || 0;
    
    // Aggregate party votes (all submitted results)
    const partyVotes: Record<string, number> = {};
    let totalVotes = 0;
    
    allResults?.forEach(result => {
      const votes = result.party_votes as Record<string, number>;
      Object.entries(votes).forEach(([party, count]) => {
        partyVotes[party] = (partyVotes[party] || 0) + count;
        totalVotes += count;
      });
    });
    
    return NextResponse.json({
      // PU Stats
      expectedTotalPUs: expectedTotalPUs || 0,
      profiledAgents: profiledAgents || 0,
      profilingPercentage: expectedTotalPUs ? Math.round((profiledAgents || 0) / expectedTotalPUs * 100) : 0,
      
      // Submission Stats
      submittedCount: submittedCount || 0,
      submissionPercentage: expectedTotalPUs ? Math.round((submittedCount || 0) / expectedTotalPUs * 100) : 0,
      
      // Incident Stats
      totalIncidents: totalIncidents || 0,
      criticalIncidents,
      highIncidents,
      investigatingIncidents,
      resolvedIncidents,
      reportedIncidents,
      
      // Vote Stats
      partyVotes,
      totalVotes,
      
      // Filters
      lga,
      ward
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
