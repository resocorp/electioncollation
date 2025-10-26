import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PUT /api/incidents/[id] - Update incident status
 * Body: { status, resolution_notes?, assigned_to? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, resolution_notes, assigned_to } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes;
    }
    
    if (assigned_to) {
      updateData.assigned_to = assigned_to;
    }
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('incident_reports')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ incident: data });
    
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
