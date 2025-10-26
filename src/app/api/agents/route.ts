import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * GET /api/agents - List agents
 * Query params: role, lga, ward, status, search, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const lga = searchParams.get('lga');
    const ward = searchParams.get('ward');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('agents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (role) {
      query = query.eq('role', role);
    }
    
    if (lga) {
      query = query.eq('lga', lga);
    }
    
    if (ward) {
      query = query.eq('ward', ward);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%,polling_unit_code.ilike.%${search}%`);
    }
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      agents: data,
      total: count,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents - Create a new agent
 * Body: { name, phone_number, email?, polling_unit_code, ward, lga, role }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone_number, email, polling_unit_code, ward, lga, role } = body;
    
    if (!name || !phone_number || !polling_unit_code || !ward || !lga || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const formattedPhone = formatPhoneNumber(phone_number);
    
    // Check if phone number already exists
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('phone_number', formattedPhone)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('agents')
      .insert({
        name,
        phone_number: formattedPhone,
        email,
        polling_unit_code,
        ward,
        lga,
        state: 'Anambra',
        role,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // TODO: Send welcome SMS
    
    return NextResponse.json({ agent: data }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
