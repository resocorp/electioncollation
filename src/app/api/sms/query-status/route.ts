import { NextRequest, NextResponse } from 'next/server';
import { queryDblSmsStatus } from '@/lib/dbl-sms';

/**
 * Query SMS Transmission Status via DBL SMS Server
 * GET /api/sms/query-status?taskID=5689
 * 
 * Query the delivery status of a specific SMS task
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskID = searchParams.get('taskID');
    
    if (!taskID) {
      return NextResponse.json(
        { error: 'taskID parameter is required' },
        { status: 400 }
      );
    }
    
    const statuses = await queryDblSmsStatus(taskID);
    
    if (statuses.length === 0) {
      return NextResponse.json(
        { error: 'No status found for the given taskID' },
        { status: 404 }
      );
    }
    
    // Format the response
    const formattedStatuses = statuses.map(status => ({
      taskID: status.taskID,
      line: status.goip_line,
      status: status.send,
      hasReceipt: status.receipt === '1',
      errorCode: status.err_code,
      timestamp: new Date().toISOString()
    }));
    
    return NextResponse.json({
      taskID,
      count: formattedStatuses.length,
      statuses: formattedStatuses
    });
    
  } catch (error) {
    console.error('Error querying SMS status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to query SMS status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
