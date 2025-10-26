import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * POST /api/agents/bulk-upload - Bulk upload agents via CSV
 * Body: { agents: Array<{ name, phone_number, polling_unit_code, ward, lga, role }> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agents } = body;
    
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return NextResponse.json(
        { error: 'Invalid agents data' },
        { status: 400 }
      );
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>
    };
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      
      // Validate required fields
      if (!agent.name || !agent.phone_number || !agent.polling_unit_code || !agent.ward || !agent.lga || !agent.role) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: 'Missing required fields',
          data: agent
        });
        continue;
      }
      
      try {
        const formattedPhone = formatPhoneNumber(agent.phone_number);
        
        // Check if phone number already exists
        const { data: existing } = await supabase
          .from('agents')
          .select('id')
          .eq('phone_number', formattedPhone)
          .single();
        
        if (existing) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Phone number already registered',
            data: agent
          });
          continue;
        }
        
        const { error } = await supabase
          .from('agents')
          .insert({
            name: agent.name,
            phone_number: formattedPhone,
            email: agent.email || null,
            polling_unit_code: agent.polling_unit_code,
            ward: agent.ward,
            lga: agent.lga,
            state: 'Anambra',
            role: agent.role,
            status: 'active'
          });
        
        if (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: error.message,
            data: agent
          });
        } else {
          results.success++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: err.message || 'Unknown error',
          data: agent
        });
      }
    }
    
    return NextResponse.json({
      message: `Uploaded ${results.success} agents, ${results.failed} failed`,
      ...results
    });
    
  } catch (error) {
    console.error('Error bulk uploading agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
