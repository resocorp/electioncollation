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
    const requestedLimit = parseInt(searchParams.get('limit') || '10000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch ALL polling units in batches to overcome Supabase 1000 row limit
    const batchSize = 1000;
    let allPollingUnits: any[] = [];
    let currentOffset = offset;
    let totalCount = 0;
    let hasMore = true;

    // First, get the total count
    let countQuery = supabase
      .from('polling_units')
      .select('*', { count: 'exact', head: true });

    if (lga && lga !== 'all') {
      countQuery = countQuery.eq('lga', lga);
    }
    if (ward && ward !== 'all') {
      countQuery = countQuery.eq('ward', ward);
    }
    if (search) {
      countQuery = countQuery.or(`polling_unit_code.ilike.%${search}%,polling_unit_name.ilike.%${search}%`);
    }

    const { count } = await countQuery;
    totalCount = count || 0;

    // Fetch in batches until we have all records
    let batchNumber = 0;
    while (hasMore && allPollingUnits.length < totalCount) {
      batchNumber++;
      console.log(`🔄 Fetching batch ${batchNumber}: offset ${currentOffset}, target ${totalCount}`);
      
      let puQuery = supabase
        .from('polling_units')
        .select('*');

      // Apply filters
      if (lga && lga !== 'all') {
        puQuery = puQuery.eq('lga', lga);
      }
      if (ward && ward !== 'all') {
        puQuery = puQuery.eq('ward', ward);
      }
      if (search) {
        puQuery = puQuery.or(`polling_unit_code.ilike.%${search}%,polling_unit_name.ilike.%${search}%`);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      puQuery = puQuery.order(sortBy as any, { ascending });

      // Fetch batch
      puQuery = puQuery.range(currentOffset, currentOffset + batchSize - 1);

      const { data: batch, error: puError } = await puQuery;

      if (puError) {
        console.error('❌ Error fetching polling units batch:', puError);
        return NextResponse.json({ error: puError.message }, { status: 500 });
      }

      if (!batch || batch.length === 0) {
        console.log(`⚠️ No more data at offset ${currentOffset}`);
        hasMore = false;
      } else {
        console.log(`✅ Batch ${batchNumber}: fetched ${batch.length} records, total so far: ${allPollingUnits.length + batch.length}`);
        allPollingUnits = allPollingUnits.concat(batch);
        currentOffset += batchSize;
        
        // Stop if we've fetched a partial batch (means we're at the end)
        if (batch.length < batchSize) {
          console.log(`✅ Reached end of data (partial batch: ${batch.length} < ${batchSize})`);
          hasMore = false;
        }
        
        // Safety check: don't fetch more than total count
        if (allPollingUnits.length >= totalCount) {
          console.log(`✅ Reached total count: ${allPollingUnits.length} >= ${totalCount}`);
          hasMore = false;
        }
      }
    }

    const pollingUnits = allPollingUnits;

    console.log(`✅ Fetched ${pollingUnits.length} polling units out of ${totalCount} total`);

    // Get all results for these polling units
    // PostgreSQL has a limit on IN clause size, so fetch results in batches
    const puCodes = pollingUnits?.map(pu => pu.polling_unit_code) || [];
    console.log(`📊 Fetching results for ${puCodes.length} polling units...`);
    
    let allResults: any[] = [];
    const resultsBatchSize = 1000; // Fetch results in batches of 1000 PU codes
    
    for (let i = 0; i < puCodes.length; i += resultsBatchSize) {
      const batchCodes = puCodes.slice(i, i + resultsBatchSize);
      
      let resultsQuery = supabase
        .from('election_results')
        .select(`
          *,
          agents!election_results_agent_id_fkey(id, name, phone_number, email)
        `)
        .in('polling_unit_code', batchCodes)
        .order('submitted_at', { ascending: false });

      const { data: batchResults, error: resultsError } = await resultsQuery;

      if (resultsError) {
        console.error(`❌ Error fetching results batch ${i / resultsBatchSize + 1}:`, resultsError);
        // Continue without this batch rather than failing
      } else if (batchResults) {
        allResults = allResults.concat(batchResults);
      }
    }
    
    console.log(`✅ Fetched ${allResults.length} results total`);
    const results = allResults;

    // Create a map of polling_unit_code to result
    const resultsMap = new Map();
    results?.forEach((result: any) => {
      // Only keep the most recent result per polling unit
      if (!resultsMap.has(result.polling_unit_code)) {
        resultsMap.set(result.polling_unit_code, result);
      }
    });

    // Transform data to include results
    const transformedData = pollingUnits?.map((pu: any) => {
      const result = resultsMap.get(pu.polling_unit_code);
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
      total: totalCount,
      limit: requestedLimit,
      offset,
      returned: transformedData?.length || 0
    });

  } catch (error) {
    console.error('Error in polling-units/results API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
