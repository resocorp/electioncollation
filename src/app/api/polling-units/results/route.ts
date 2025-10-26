import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/polling-units/results
 * Fetch all polling units with their results and agent details
 * Query params: lga, ward, search, sortBy, sortOrder, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lga = searchParams.get('lga');
    const ward = searchParams.get('ward');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'polling_unit_code';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query to get all polling units with LEFT JOIN to results and agents
    let query = supabase
      .from('polling_units')
      .select(`
        id,
        polling_unit_code,
        polling_unit_name,
        ward,
        lga,
        state,
        latitude,
        longitude,
        registered_voters,
        election_results!left (
          id,
          reference_id,
          party_votes,
          total_votes,
          submitted_at,
          agents!inner (
            id,
            name,
            phone_number,
            email
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (lga && lga !== 'all') {
      query = query.ilike('lga', lga);
    }

    if (ward && ward !== 'all') {
      query = query.ilike('ward', ward);
    }

    if (search) {
      query = query.or(`polling_unit_code.ilike.%${search}%,polling_unit_name.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy as any, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching polling units with results:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to flatten the structure
    const transformedData = data?.map((pu: any) => {
      const result = pu.election_results?.[0]; // Get the first (most recent) result
      return {
        id: pu.id,
        polling_unit_code: pu.polling_unit_code,
        polling_unit_name: pu.polling_unit_name,
        ward: pu.ward,
        lga: pu.lga,
        state: pu.state,
        latitude: pu.latitude,
        longitude: pu.longitude,
        registered_voters: pu.registered_voters,
        result: result ? {
          id: result.id,
          reference_id: result.reference_id,
          party_votes: result.party_votes,
          total_votes: result.total_votes,
          submitted_at: result.submitted_at,
          agent: result.agents ? {
            id: result.agents.id,
            name: result.agents.name,
            phone_number: result.agents.phone_number,
            email: result.agents.email
          } : null
        } : null
      };
    });

    return NextResponse.json({
      polling_units: transformedData,
      total: count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in polling-units/results API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
