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
      // Unknown agent - use current line for response
      const errorMsg = 'Phone number not registered. Contact your coordinator.';
      await sendSMS(phoneNumber, errorMsg, requestId, goipLine);
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
    
    // Update SMS session with line affinity
    await getOrUpdateSession(phoneNumber, goipLine, 'processing');
    
    // Get preferred line for responses (line affinity)
    const preferredLine = await getPreferredLine(phoneNumber, goipLine);
    console.log(`[${requestId}] Using line ${preferredLine} for responses (received on ${goipLine})`);
    
    // Parse SMS
    const parsed = parseSMS(message);
    
    // Handle different SMS types
    let responseMessage = '';
    
    if (parsed.type === 'help') {
      console.log(`[${requestId}] Handling HELP command`);
      responseMessage = generateHelpMessage();
      await getOrUpdateSession(phoneNumber, goipLine, 'help');
      await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
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
      
      // Check if there's a very recent result submission (within last 10 seconds)
      // This handles the case where STATUS arrives while RESULT is still processing
      let processingNote = '';
      if (!hasSubmitted) {
        const { data: recentSmsLogs } = await supabase
          .from('sms_logs')
          .select('created_at, message')
          .eq('phone_number', phoneNumber)
          .eq('direction', 'inbound')
          .gte('created_at', new Date(Date.now() - 10000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);
        
        const hasRecentResultSms = recentSmsLogs?.some(log => 
          log.message.toUpperCase().startsWith('R ')
        );
        
        if (hasRecentResultSms) {
          processingNote = '\\n\\n(If you just sent results, they may still be processing. Wait 30 seconds and try again.)';
        }
      }
      
      await getOrUpdateSession(phoneNumber, goipLine, 'status');
      responseMessage = generateStatusMessage(hasSubmitted, refId, status) + processingNote;
      await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
      return NextResponse.json({ status: 'success', type: 'status' });
    }
    
    if (parsed.type === 'result') {
      if (!parsed.isValid) {
        await getOrUpdateSession(phoneNumber, goipLine, 'result_error');
        responseMessage = generateErrorMessage(parsed.errors);
        await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
        return NextResponse.json({ status: 'error', errors: parsed.errors });
      }
      
      // Check for duplicate submission
      console.log(`[${requestId}] Checking for duplicate submission...`);
      const { data: existingResult, error: checkError } = await supabase
        .from('election_results')
        .select('reference_id, validation_status, submitted_at')
        .eq('agent_id', agent.id)
        .eq('polling_unit_code', agent.polling_unit_code)
        .single();
      
      if (existingResult && !checkError) {
        console.log(`[${requestId}] Duplicate detected! Existing ref: ${existingResult.reference_id}`);
        await getOrUpdateSession(phoneNumber, goipLine, 'result_duplicate');
        responseMessage = `You already submitted results (${existingResult.reference_id}) at ${new Date(existingResult.submitted_at).toLocaleTimeString()}. Status: ${existingResult.validation_status.toUpperCase()}.\n\nTo modify, contact your supervisor.`;
        await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
        return NextResponse.json({ 
          status: 'duplicate', 
          existing_ref: existingResult.reference_id,
          message: 'Duplicate submission prevented'
        });
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
        await getOrUpdateSession(phoneNumber, goipLine, 'result_db_error');
        responseMessage = 'Error saving result. Please try again or contact support.';
        await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
        return NextResponse.json({ status: 'error', message: 'Database error', error: insertError.message });
      }
      
      console.log(`[${requestId}] Result saved successfully with ref: ${referenceId}`);
      await getOrUpdateSession(phoneNumber, goipLine, 'result_success');
      responseMessage = generateResultSuccess(referenceId, parsed);
      await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
      return NextResponse.json({ status: 'success', reference_id: referenceId });
    }
    
    if (parsed.type === 'incident') {
      if (!parsed.isValid) {
        await getOrUpdateSession(phoneNumber, goipLine, 'incident_error');
        responseMessage = generateErrorMessage(parsed.errors);
        await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
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
        await getOrUpdateSession(phoneNumber, goipLine, 'incident_db_error');
        responseMessage = 'Error saving incident. Please try again or contact support.';
      } else {
        await getOrUpdateSession(phoneNumber, goipLine, 'incident_success');
        responseMessage = generateIncidentConfirmation(referenceId, parsed.severity);
        
        // TODO: Send notifications to coordinators based on severity
      }
      
      await sendSMS(phoneNumber, responseMessage, requestId, preferredLine);
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
 * Get or update SMS session with line affinity
 */
async function getOrUpdateSession(
  phoneNumber: string,
  goipLine: string,
  messageType?: string
): Promise<string> {
  try {
    // Try to get existing session
    const { data: existingSession } = await supabase
      .from('sms_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    const now = new Date().toISOString();
    const messageCount = (existingSession?.session_data?.message_count || 0) + 1;
    
    const sessionData = {
      last_goip_line: goipLine,
      last_contacted_at: now,
      message_count: messageCount,
      last_message_type: messageType || 'unknown'
    };
    
    // Upsert session
    await supabase.from('sms_sessions').upsert({
      phone_number: phoneNumber,
      session_data: sessionData,
      last_activity: now
    }, {
      onConflict: 'phone_number'
    });
    
    return goipLine;
  } catch (error) {
    console.error('Error managing SMS session:', error);
    // Return the provided line as fallback
    return goipLine;
  }
}

/**
 * Get the preferred line for sending response (line affinity)
 */
async function getPreferredLine(phoneNumber: string, currentLine: string): Promise<string> {
  try {
    const { data: session } = await supabase
      .from('sms_sessions')
      .select('session_data')
      .eq('phone_number', phoneNumber)
      .single();
    
    // Use session's last line if available, otherwise use current line
    const preferredLine = session?.session_data?.last_goip_line || currentLine;
    console.log(`[Line Affinity] Phone: ${phoneNumber}, Preferred: ${preferredLine}, Current: ${currentLine}`);
    return preferredLine;
  } catch (error) {
    console.error('Error getting preferred line:', error);
    return currentLine;
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
 * Send SMS via DBL SMS Server with line affinity support
 */
async function sendSMS(
  phoneNumber: string, 
  message: string, 
  requestId?: string, 
  preferredLine?: string
): Promise<boolean> {
  const logPrefix = requestId ? `[${requestId}]` : '';
  console.log(`${logPrefix} Sending SMS to ${phoneNumber} (keeping in local format)`);
  if (preferredLine) {
    console.log(`${logPrefix} Using preferred line: ${preferredLine}`);
  }
  
  try {
    // Send SMS via DBL API using LOCAL format (08066137843)
    // DBL SMS server expects local Nigerian format, not international
    // Use preferred line if provided (for line affinity)
    const response = await sendSMSViaDbl(phoneNumber, message, {
      goip_line: preferredLine
    });
    
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
        goip_line: preferredLine,
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
        goip_line: preferredLine,
        request_id: requestId
      }
    });
    
    return false;
  }
}
