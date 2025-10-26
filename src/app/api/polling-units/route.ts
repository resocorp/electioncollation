import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/polling-units
 * Cascading dropdown API for States → LGAs → Wards → Polling Units
 * 
 * Query params:
 * - type: 'states' | 'lgas' | 'wards' | 'polling_units'
 * - state: (required for lgas, wards, polling_units)
 * - lga: (required for wards, polling_units)
 * - ward: (required for polling_units)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const state = searchParams.get('state');
    const lga = searchParams.get('lga');
    const ward = searchParams.get('ward');

    // Get all Nigerian states
    if (type === 'states') {
      const states = [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
        'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
        'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
        'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
        'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
      ];
      
      return NextResponse.json({ states });
    }

    // Get LGAs for a state
    if (type === 'lgas') {
      if (!state) {
        return NextResponse.json({ error: 'State is required' }, { status: 400 });
      }

      console.log('🔍 API: Fetching LGAs for state:', state);

      // Use raw SQL to get DISTINCT LGAs directly (bypasses 1000 row limit)
      const { data, error } = await supabase
        .rpc('get_distinct_lgas', { state_name: state });

      if (error) {
        console.error('❌ API: RPC Error:', error);
        // Fallback: try direct query with distinct
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('polling_units')
          .select('lga')
          .ilike('state', state)
          .limit(10000);
        
        if (fallbackError) {
          console.error('❌ API: Fallback Error:', fallbackError);
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }
        
        const lgas = [...new Set(fallbackData.map(item => item.lga))].sort();
        console.log('✅ API: Unique LGAs (fallback):', lgas.length, lgas);
        return NextResponse.json({ lgas });
      }

      // RPC returns array of {lga: "name"} objects, extract just the lga values
      const lgas = (data || []).map((item: any) => item.lga).sort();
      console.log('✅ API: Unique LGAs (RPC):', lgas.length, lgas);
      return NextResponse.json({ lgas });
    }

    // Get Wards for an LGA
    if (type === 'wards') {
      if (!state || !lga) {
        return NextResponse.json({ error: 'State and LGA are required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('polling_units')
        .select('ward')
        .ilike('state', state)
        .ilike('lga', lga)
        .order('ward');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get unique wards
      const wards = [...new Set(data.map(item => item.ward))];
      return NextResponse.json({ wards });
    }

    // Get Polling Units for a Ward
    if (type === 'polling_units') {
      if (!state || !lga || !ward) {
        return NextResponse.json({ error: 'State, LGA, and Ward are required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('polling_units')
        .select('*')
        .ilike('state', state)
        .ilike('lga', lga)
        .ilike('ward', ward)
        .order('polling_unit_name');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ polling_units: data });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching polling units:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
