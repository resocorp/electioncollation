import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  parseSMS, 
  generateResultConfirmation, 
  generateResultSuccess,
  generateErrorMessage,
  generateHelpMessage,
  generateIncidentConfirmation,
  generateStatusMessage
} from '@/lib/sms-parser';
import { generateReferenceId, formatPhoneNumber } from '@/lib/utils';
import { sendSMSViaDbl, validateDBLIncomingSMS } from '@/lib/dbl-sms';

/**
 * GET /api/sms/goip/incoming - Test endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'SMS webhook endpoint is active',
    endpoint: '/api/sms/goip/incoming',
    method: 'POST',
    expectedFormat: {
      goip_line: 'string',
      from_number: 'string (e.g., 2348012345678)',
      content: 'string (SMS message)',
      recv_time: 'string (optional, ISO date)'
    }
  });
}

/**
 * DBL SMS Server Webhook Handler - Receives incoming SMS
 * POST /api/sms/goip/incoming
 * 
 * DBL SMS Server forwards incoming SMS in JSON format:
 * {
 *   "goip_line": "G101",
 *   "from_number": "2348012345678",
 *   "content": "R APGA:450 APC:320",
 *   "recv_time": "2025-10-25 15:30:00"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateReferenceId('REQ');
  
  console.log('='.repeat(80));
  console.log(`[${requestId}] Incoming webhook request at ${new Date().toISOString()}`);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Get raw body for logging
    const rawBody = await request.text();
    console.log(`[${requestId}] Raw body:`, rawBody);
    
    // Parse JSON
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log(`[${requestId}] Parsed JSON:`, JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      await logAudit({
        request_id: requestId,
        event_type: 'webhook_error',
        raw_body: rawBody,
        error: parseError instanceof Error ? parseError.message : 'JSON parse failed',
        duration_ms: Date.now() - startTime
      });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    // Validate incoming SMS data
    const incomingSMS = validateDBLIncomingSMS(body);
    
    if (!incomingSMS) {
      console.error(`[${requestId}] Validation failed for body:`, body);
      await logAudit({
        request_id: requestId,
        event_type: 'validation_failed',
        raw_body: JSON.stringify(body),
        error: 'Invalid SMS data format - missing required fields',
        duration_ms: Date.now() - startTime
      });
      return NextResponse.json({ error: 'Invalid SMS data format' }, { status: 400 });
    }
    
    console.log(`[${requestId}] Validated SMS:`, incomingSMS);
    
    const sender = incomingSMS.from_number;
    const message = incomingSMS.content;
    const goipLine = incomingSMS.goip_line;
    const recvTime = incomingSMS.recv_time;
    
    console.log(`[${requestId}] SMS Details:`);
    console.log(`  From: ${sender}`);
    console.log(`  Message: ${message}`);
    console.log(`  Line: ${goipLine}`);
    console.log(`  Time: ${recvTime}`);
    
    // Format phone number
    const phoneNumber = formatPhoneNumber(sender);
    console.log(`  Formatted Phone: ${phoneNumber}`);
    
    // Log incoming SMS
    const { data: smsLog, error: smsLogError } = await supabase.from('sms_logs').insert({
      phone_number: phoneNumber,
      direction: 'inbound',
      message: message,
      status: 'received',
      metadata: { 
        goip_line: goipLine,
        recv_time: recvTime,
        request_id: requestId
      }
    }).select().single();
    
    if (smsLogError) {
      console.error(`[${requestId}] Error logging to sms_logs:`, smsLogError);
    } else {
      console.log(`[${requestId}] SMS logged to database with ID:`, smsLog?.id);
    }
    
    // Get agent details
    console.log(`[${requestId}] Looking up agent with phone: ${phoneNumber}`);
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (agentError || !agent) {
      console.log(`[${requestId}] Agent not found:`, agentError?.message || 'No agent');
      // Unknown agent
      const errorMsg = 'Phone number not registered. Contact your coordinator.';
      await sendSMS(phoneNumber, errorMsg, requestId);
      await logAudit({
        request_id: requestId,
        event_type: 'unknown_agent',
        phone_number: phoneNumber,
        message: message,
        duration_ms: Date.now() - startTime
      });
      return NextResponse.json({ status: 'error', message: 'Unknown agent' });
    }
    
    console.log(`[${requestId}] Agent found: ${agent.name} (ID: ${agent.id})`);
    
    // Parse SMS
    const parsed = parseSMS(message);
    
    // Handle different SMS types
    let responseMessage = '';
    
    if (parsed.type === 'help') {
      console.log(`[${requestId}] Handling HELP command`);
      responseMessage = generateHelpMessage();
      await sendSMS(phoneNumber, responseMessage, requestId);
      await logAudit({
        request_id: requestId,
        event_type: 'help_request',
        phone_number: phoneNumber,
        agent_id: agent.id,
        duration_ms: Date.now() - startTime
      });
      console.log(`[${requestId}] HELP response sent successfully`);
      return NextResponse.json({ status: 'success', type: 'help' });
    }
    
    if (parsed.type === 'status') {
      // Check if agent has submitted results
      const { data: results } = await supabase
        .from('election_results')
        .select('*')
        .eq('agent_id', agent.id)
        .order('submitted_at', { ascending: false })
        .limit(1);
      
      const hasSubmitted = !!(results && results.length > 0);
      const status = hasSubmitted ? results[0].validation_status : undefined;
      const refId = hasSubmitted ? results[0].reference_id : undefined;
      
      responseMessage = generateStatusMessage(hasSubmitted, refId, status);
      await sendSMS(phoneNumber, responseMessage, requestId);
      return NextResponse.json({ status: 'success', type: 'status' });
    }
    
    if (parsed.type === 'result') {
      if (!parsed.isValid) {
        responseMessage = generateErrorMessage(parsed.errors);
        await sendSMS(phoneNumber, responseMessage, requestId);
        return NextResponse.json({ status: 'error', errors: parsed.errors });
      }
      
      // Save result IMMEDIATELY (no confirmation needed)
      console.log(`[${requestId}] Saving result immediately - no confirmation required`);
      const referenceId = generateReferenceId('EL');
      
      const { error: insertError } = await supabase
        .from('election_results')
        .insert({
          reference_id: referenceId,
          agent_id: agent.id,
          polling_unit_code: agent.polling_unit_code,
          ward: agent.ward,
          lga: agent.lga,
          state: agent.state,
          party_votes: parsed.partyVotes,
          total_votes: parsed.totalVotes,
          validation_status: 'pending'
        });
      
      if (insertError) {
        console.error(`[${requestId}] Error inserting election result:`, insertError);
        responseMessage = 'Error saving result. Please try again or contact support.';
        await sendSMS(phoneNumber, responseMessage, requestId);
        return NextResponse.json({ status: 'error', message: 'Database error', error: insertError.message });
      }
      
      console.log(`[${requestId}] Result saved successfully with ref: ${referenceId}`);
      responseMessage = generateResultSuccess(referenceId, parsed);
      await sendSMS(phoneNumber, responseMessage, requestId);
      return NextResponse.json({ status: 'success', reference_id: referenceId });
    }
    
    if (parsed.type === 'incident') {
      if (!parsed.isValid) {
        responseMessage = generateErrorMessage(parsed.errors);
        await sendSMS(phoneNumber, responseMessage, requestId);
        return NextResponse.json({ status: 'error', errors: parsed.errors });
      }
      
      // Save incident to database
      const referenceId = generateReferenceId('INC');
      
      const { error: insertError } = await supabase
        .from('incident_reports')
        .insert({
          reference_id: referenceId,
          agent_id: agent.id,
          polling_unit_code: agent.polling_unit_code,
          ward: agent.ward,
          lga: agent.lga,
          state: agent.state,
          incident_type: parsed.incidentType,
          description: parsed.description,
          severity: parsed.severity,
          status: 'reported'
        });
      
      if (insertError) {
        responseMessage = 'Error saving incident. Please try again or contact support.';
      } else {
        responseMessage = generateIncidentConfirmation(referenceId, parsed.severity);
        
        // TODO: Send notifications to coordinators based on severity
      }
      
      await sendSMS(phoneNumber, responseMessage, requestId);
      return NextResponse.json({ status: 'success', reference_id: referenceId });
    }
    
    console.log(`[${requestId}] Processing completed successfully in ${Date.now() - startTime}ms`);
    console.log('='.repeat(80));
    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error(`[${requestId}] Fatal error processing SMS:`, error);
    await logAudit({
      request_id: requestId,
      event_type: 'fatal_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: Date.now() - startTime
    });
    console.log('='.repeat(80));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Log audit event to sms_logs table
 */
async function logAudit(data: {
  request_id: string;
  event_type: string;
  phone_number?: string;
  agent_id?: string;
  message?: string;
  raw_body?: string;
  error?: string;
  stack?: string;
  duration_ms: number;
}): Promise<void> {
  try {
    await supabase.from('sms_logs').insert({
      phone_number: data.phone_number || 'SYSTEM',
      direction: 'inbound',
      message: `[${data.event_type}] ${data.message || data.error || ''}`,
      status: data.error ? 'failed' : 'received',
      metadata: {
        request_id: data.request_id,
        event_type: data.event_type,
        raw_body: data.raw_body,
        error: data.error,
        stack: data.stack,
        duration_ms: data.duration_ms,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error logging audit:', err);
  }
}

/**
 * Send SMS via DBL SMS Server
 */
async function sendSMS(phoneNumber: string, message: string, requestId?: string): Promise<boolean> {
  const logPrefix = requestId ? `[${requestId}]` : '';
  console.log(`${logPrefix} Sending SMS to ${phoneNumber} (keeping in local format)`);
  
  try {
    // Send SMS via DBL API using LOCAL format (08066137843)
    // DBL SMS server expects local Nigerian format, not international
    const response = await sendSMSViaDbl(phoneNumber, message);
    
    // Log outgoing SMS with DBL response (use local format for database)
    await supabase.from('sms_logs').insert({
      phone_number: phoneNumber, // Store in local format (0xxxxxxxxxx)
      direction: 'outbound',
      message: message,
      status: response.result === 'ACCEPT' ? 'sent' : 'failed',
      metadata: {
        dbl_result: response.result,
        dbl_task_id: response.taskID,
        dbl_reason: response.reason,
        sent_to_number: phoneNumber, // DBL received local format
        request_id: requestId
      }
    });
    
    if (response.result === 'REJECT') {
      console.error(`${logPrefix} SMS sending rejected: ${response.reason}`);
      return false;
    }
    
    console.log(`${logPrefix} SMS sent successfully. Task ID: ${response.taskID}`);
    return true;
  } catch (error) {
    console.error(`${logPrefix} Error sending SMS:`, error);
    
    // Log failed attempt (use local format for database)
    await supabase.from('sms_logs').insert({
      phone_number: phoneNumber, // Store in local format (0xxxxxxxxxx)
      direction: 'outbound',
      message: message,
      status: 'failed',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sent_to_number: phoneNumber,
        request_id: requestId
      }
    });
    
    return false;
  }
}
