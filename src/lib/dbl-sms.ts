/**
 * DBL SMS Server Integration
 * Handles communication with DBL's SMS Server API
 */

interface DBLSendRequest {
  auth: {
    username: string;
    password: string;
  };
  provider?: string;
  goip_line?: string;
  number: string;
  content: string;
}

interface DBLSendResponse {
  result: 'ACCEPT' | 'REJECT';
  taskID?: string;
  reason?: string;
}

interface DBLStatusQuery {
  auth: {
    username: string;
    password: string;
  };
  taskID: string;
}

interface DBLStatusResponse {
  taskID: string;
  goip_line: string;
  send: 'succeeded' | 'failed' | 'unsend' | 'sending';
  receipt?: string;
  err_code?: string;
}

interface DBLLineStatus {
  goip_line: string;
  online: '0' | '1';
  reg: 'LOGIN' | 'LOGOUT' | '';
  remain_sms: string;
  day_remain_sms: string;
}

/**
 * Get DBL SMS Server configuration from environment
 */
export function getDBLConfig() {
  const serverIP = process.env.DBL_SMS_SERVER_IP;
  const serverPort = process.env.DBL_SMS_SERVER_PORT || '80';
  const username = process.env.DBL_SMS_USERNAME;
  const password = process.env.DBL_SMS_PASSWORD;
  const provider = process.env.DBL_SMS_PROVIDER;
  const line = process.env.DBL_SMS_LINE;

  if (!serverIP || !username || !password) {
    throw new Error('DBL SMS Server configuration missing. Check environment variables.');
  }

  const baseURL = `http://${serverIP}:${serverPort}`;

  return {
    baseURL,
    username,
    password,
    provider,
    line
  };
}

/**
 * Send SMS via DBL SMS Server
 * @param phoneNumber Recipient phone number (can be multiple, comma-separated)
 * @param message SMS content
 * @param options Optional provider or line specification
 */
export async function sendSMSViaDbl(
  phoneNumber: string,
  message: string,
  options?: { provider?: string; goip_line?: string }
): Promise<DBLSendResponse> {
  try {
    const config = getDBLConfig();
    
    const requestBody: DBLSendRequest = {
      auth: {
        username: config.username,
        password: config.password
      },
      number: phoneNumber,
      content: message
    };

    // Add optional parameters
    if (options?.provider || config.provider) {
      requestBody.provider = options?.provider || config.provider;
    }
    if (options?.goip_line || config.line) {
      requestBody.goip_line = options?.goip_line || config.line;
    }

    const response = await fetch(`${config.baseURL}/goip/sendsms/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DBLSendResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending SMS via DBL:', error);
    return {
      result: 'REJECT',
      reason: error instanceof Error ? error.message : 'unknown'
    };
  }
}

/**
 * Query SMS transmission status
 * @param taskID Task ID returned from send request (can include recipient number)
 */
export async function queryDblSmsStatus(
  taskID: string
): Promise<DBLStatusResponse[]> {
  try {
    const config = getDBLConfig();
    
    const requestBody: DBLStatusQuery = {
      auth: {
        username: config.username,
        password: config.password
      },
      taskID
    };

    const response = await fetch(`${config.baseURL}/goip/querysms/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DBLStatusResponse[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error querying SMS status:', error);
    return [];
  }
}

/**
 * Query all GoIP line statuses
 */
export async function queryDblLineStatus(): Promise<DBLLineStatus[]> {
  try {
    const config = getDBLConfig();
    
    const requestBody = {
      auth: {
        username: config.username,
        password: config.password
      }
    };

    const response = await fetch(`${config.baseURL}/goip/querylines/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DBLLineStatus[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error querying line status:', error);
    return [];
  }
}

/**
 * Get error message from DBL error code
 * Based on Appendix A CMS ERROR Codes
 */
export function getDBLErrorMessage(errorCode: string): string {
  const errorMap: Record<string, string> = {
    '1': 'Unassigned (unallocated) number',
    '8': 'Operator determined barring',
    '10': 'Call barred',
    '17': 'Network failure',
    '21': 'Short message transfer rejected',
    '22': 'Memory capacity exceeded',
    '27': 'Destination out of service',
    '28': 'Unidentified subscriber',
    '29': 'Facility rejected',
    '30': 'Unknown Subscriber',
    '38': 'Network out of order',
    '41': 'Temporary failure',
    '42': 'Congestion',
    '47': 'Resources unavailable, unspecified',
    '50': 'Requested facility not subscribed',
    '69': 'Requested facility not implemented',
    '81': 'Invalid short message reference value',
    '95': 'Invalid message, unspecified',
    '96': 'Invalid mandatory information',
    '97': 'Message type non-existent or not implemented',
    '98': 'Message not compatible with short message protocol state',
    '99': 'Information element non-existent or not implemented',
    '111': 'Protocol error, unspecified',
    '127': 'Interworking unspecified',
    '208': 'SIM SMS storage full',
    '300': 'ME failure',
    '310': 'SIM not inserted',
    '311': 'SIM PIN required',
    '312': 'SIM PUK required',
    '313': 'SIM failure',
    '314': 'SIM busy',
    '320': 'Memory failure',
    '322': 'Memory full',
    '330': 'SMSC address unknown',
    '331': 'No network service',
    '332': 'Network timeout'
  };

  return errorMap[errorCode] || `Unknown error (code: ${errorCode})`;
}

/**
 * Format DBL incoming SMS webhook data
 */
export interface DBLIncomingSMS {
  goip_line: string;
  from_number: string;
  content: string;
  recv_time: string;
}

/**
 * Validate DBL incoming SMS webhook
 */
export function validateDBLIncomingSMS(data: any): DBLIncomingSMS | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  if (!data.from_number || !data.content) {
    return null;
  }

  return {
    goip_line: data.goip_line || 'unknown',
    from_number: data.from_number,
    content: data.content,
    recv_time: data.recv_time || new Date().toISOString()
  };
}
