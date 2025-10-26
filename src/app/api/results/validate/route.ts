import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/results/validate - Validate or reject a result
 * Body: { resultId, action: 'approve'|'reject', reason?, validatorId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resultId, action, reason, validatorId } = body;
    
    if (!resultId || !action || !validatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }
    
    const updateData: any = {
      validated_by: validatorId,
      validated_at: new Date().toISOString()
    };
    
    if (action === 'approve') {
      updateData.validation_status = 'validated';
    } else if (action === 'reject') {
      updateData.validation_status = 'rejected';
      updateData.rejection_reason = reason;
    }
    
    const { data, error } = await supabase
      .from('election_results')
      .update(updateData)
      .eq('id', resultId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // TODO: Send SMS notification to agent
    
    return NextResponse.json({ result: data });
    
  } catch (error) {
    console.error('Error validating result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
