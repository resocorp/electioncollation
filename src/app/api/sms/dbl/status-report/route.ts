import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDBLErrorMessage } from '@/lib/dbl-sms';

/**
 * DBL SMS Server Status Report Webhook
 * POST /api/sms/dbl/status-report
 * 
 * DBL SMS Server sends status reports when SMS transmission completes:
 * {
 *   "taskID": "5689.13600000000",
 *   "goip_line": "G101",
 *   "send": "succeeded" | "failed" | "unsend" | "sending",
 *   "receipt": "1",  // Optional: if delivery receipt received
 *   "err_code": "335"  // Optional: if failed
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const taskID = body.taskID;
    const goipLine = body.goip_line;
    const sendStatus = body.send;
    const receipt = body.receipt;
    const errCode = body.err_code;
    
    if (!taskID || !sendStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: taskID or send status' },
        { status: 400 }
      );
    }
    
    // Parse taskID to get recipient number (format: taskID.phoneNumber)
    const parts = taskID.split('.');
    const baseTaskID = parts[0];
    const recipientNumber = parts.length > 1 ? parts[1] : null;
    
    // Find the corresponding SMS log entry
    const { data: smsLogs, error: findError } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('direction', 'outbound')
      .eq('metadata->dbl_task_id', baseTaskID)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (findError || !smsLogs || smsLogs.length === 0) {
      console.warn(`SMS log not found for task ID: ${taskID}`);
      // Still return success to DBL
      return NextResponse.json({ status: 'received' });
    }
    
    // Match by phone number if available
    let matchedLog = smsLogs[0];
    if (recipientNumber && smsLogs.length > 1) {
      const match = smsLogs.find(log => 
        log.phone_number.includes(recipientNumber) || 
        recipientNumber.includes(log.phone_number.replace(/^\+?234/, ''))
      );
      if (match) matchedLog = match;
    }
    
    // Update SMS log with delivery status
    const updateData: any = {
      status: sendStatus === 'succeeded' ? 'delivered' : 
              sendStatus === 'failed' ? 'failed' : 
              sendStatus === 'sending' ? 'sending' : 'pending',
      metadata: {
        ...matchedLog.metadata,
        dbl_send_status: sendStatus,
        dbl_goip_line: goipLine,
        dbl_full_task_id: taskID,
        updated_at: new Date().toISOString()
      }
    };
    
    // Add delivery receipt info if available
    if (receipt) {
      updateData.metadata.dbl_delivery_receipt = receipt;
    }
    
    // Add error information if failed
    if (sendStatus === 'failed' && errCode) {
      updateData.metadata.dbl_error_code = errCode;
      updateData.metadata.dbl_error_message = getDBLErrorMessage(errCode);
    }
    
    await supabase
      .from('sms_logs')
      .update(updateData)
      .eq('id', matchedLog.id);
    
    // Log the status update
    console.log(`SMS Status Update: ${taskID} - ${sendStatus}${errCode ? ` (Error: ${errCode})` : ''}`);
    
    // Create audit log for failed SMS
    if (sendStatus === 'failed') {
      await supabase.from('audit_logs').insert({
        action: 'sms_delivery_failed',
        user_id: null,
        details: {
          task_id: taskID,
          phone_number: matchedLog.phone_number,
          error_code: errCode,
          error_message: errCode ? getDBLErrorMessage(errCode) : 'Unknown error',
          goip_line: goipLine
        }
      });
    }
    
    return NextResponse.json({ status: 'received' });
    
  } catch (error) {
    console.error('Error processing DBL status report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
