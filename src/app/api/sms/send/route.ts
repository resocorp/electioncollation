import { NextRequest, NextResponse } from 'next/server';
import { sendSMSViaDbl } from '@/lib/dbl-sms';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * Send SMS via DBL SMS Server
 * POST /api/sms/send
 * 
 * Request body:
 * {
 *   "phoneNumber": "08066137843" or "2348066137843",
 *   "message": "Your message here",
 *   "provider": "optional",
 *   "goip_line": "optional"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message, provider, goip_line } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Convert to local format for database storage AND sending
    const localNumber = formatPhoneNumber(phoneNumber);
    
    console.log(`Sending SMS to: ${localNumber} (local format only)`);

    // Send SMS via DBL using LOCAL format (08066137843)
    // DBL SMS server expects local Nigerian format, not international
    const response = await sendSMSViaDbl(localNumber, message, {
      provider,
      goip_line
    });

    // Log the SMS using local format
    await supabase.from('sms_logs').insert({
      phone_number: localNumber, // Store in local format (0xxxxxxxxxx)
      direction: 'outbound',
      message: message,
      status: response.result === 'ACCEPT' ? 'sent' : 'failed',
      metadata: {
        dbl_result: response.result,
        dbl_task_id: response.taskID,
        dbl_reason: response.reason,
        sent_to_number: localNumber, // DBL received local format
        provider,
        goip_line
      }
    });

    if (response.result === 'REJECT') {
      return NextResponse.json(
        { 
          error: 'SMS rejected by DBL server',
          reason: response.reason,
          result: response.result
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result: response.result,
      taskID: response.taskID,
      message: 'SMS sent successfully'
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
