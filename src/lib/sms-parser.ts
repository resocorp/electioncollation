// SMS Parser for Election Result Submission and Incident Reporting

export interface ParsedResultSMS {
  type: 'result';
  partyVotes: Record<string, number>;
  totalVotes: number;
  isValid: boolean;
  errors: string[];
}

export interface ParsedIncidentSMS {
  type: 'incident';
  description: string;
  incidentType: 'vote_buying' | 'violence' | 'result_manipulation' | 'intimidation' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isValid: boolean;
  errors: string[];
}

export interface ParsedStatusSMS {
  type: 'status';
}

export interface ParsedHelpSMS {
  type: 'help';
}

export type ParsedSMS = ParsedResultSMS | ParsedIncidentSMS | ParsedStatusSMS | ParsedHelpSMS;

// Valid party acronyms for Anambra Election
const VALID_PARTIES = ['APC', 'PDP', 'APGA', 'LP', 'NNPP', 'ADC', 'YPP', 'SDP'];

// Incident keywords mapping
const INCIDENT_KEYWORDS = {
  vote_buying: ['vote buying', 'vote-buying', 'buying votes', 'cash', 'money', 'bribe'],
  violence: ['violence', 'fighting', 'attack', 'assault', 'gunshot', 'weapon', 'threat'],
  result_manipulation: ['rigging', 'manipulation', 'fake', 'falsify', 'alter'],
  intimidation: ['intimidation', 'intimidate', 'harass', 'scare', 'threaten'],
};

const CRITICAL_KEYWORDS = ['gunshot', 'weapon', 'kidnap', 'death', 'murder', 'serious injury'];

/**
 * Parse incoming SMS message
 */
export function parseSMS(message: string): ParsedSMS {
  const trimmed = message.trim().toUpperCase();
  
  // Check for STATUS command
  if (trimmed === 'STATUS') {
    return { type: 'status' };
  }
  
  // Check for HELP command
  if (trimmed === 'HELP' || trimmed === 'MENU') {
    return { type: 'help' };
  }
  
  // Check for RESULT submission (starts with R)
  if (trimmed.startsWith('R ')) {
    return parseResultSMS(trimmed.substring(2));
  }
  
  // Check for INCIDENT report (starts with I)
  if (trimmed.startsWith('I ')) {
    return parseIncidentSMS(message.substring(2)); // Use original case for description
  }
  
  // Invalid format
  return {
    type: 'result',
    partyVotes: {},
    totalVotes: 0,
    isValid: false,
    errors: ['Invalid format. Send HELP for instructions.'],
  };
}

/**
 * Parse result SMS (format: R APGA:450 APC:320 PDP:280 LP:150)
 */
function parseResultSMS(content: string): ParsedResultSMS {
  const errors: string[] = [];
  const partyVotes: Record<string, number> = {};
  
  // Split by space to get party:votes pairs
  const parts = content.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return {
      type: 'result',
      partyVotes: {},
      totalVotes: 0,
      isValid: false,
      errors: ['No party results provided. Format: R APGA:450 APC:320'],
    };
  }
  
  for (const part of parts) {
    if (!part.includes(':')) {
      errors.push(`Invalid format: "${part}". Use PARTY:VOTES format.`);
      continue;
    }
    
    const [party, votesStr] = part.split(':');
    const partyUpper = party.trim().toUpperCase();
    
    // Validate party
    if (!VALID_PARTIES.includes(partyUpper)) {
      errors.push(`Unknown party: ${party}. Valid parties: ${VALID_PARTIES.join(', ')}`);
      continue;
    }
    
    // Validate votes
    const votes = parseInt(votesStr, 10);
    if (isNaN(votes) || votes < 0) {
      errors.push(`Invalid vote count for ${party}: "${votesStr}"`);
      continue;
    }
    
    // Check for duplicate
    if (partyVotes[partyUpper] !== undefined) {
      errors.push(`Duplicate entry for ${party}`);
      continue;
    }
    
    partyVotes[partyUpper] = votes;
  }
  
  const totalVotes = Object.values(partyVotes).reduce((sum, votes) => sum + votes, 0);
  
  // Must have at least 2 parties
  if (Object.keys(partyVotes).length < 2 && errors.length === 0) {
    errors.push('Please provide results for at least 2 parties');
  }
  
  return {
    type: 'result',
    partyVotes,
    totalVotes,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse incident SMS (format: I Vote buying at polling unit entrance)
 */
function parseIncidentSMS(description: string): ParsedIncidentSMS {
  const errors: string[] = [];
  const trimmed = description.trim();
  
  if (trimmed.length < 10) {
    errors.push('Description too short. Please provide at least 10 characters.');
  }
  
  if (trimmed.length > 500) {
    errors.push('Description too long. Maximum 500 characters.');
  }
  
  // Detect incident type
  const lowerDesc = trimmed.toLowerCase();
  let incidentType: ParsedIncidentSMS['incidentType'] = 'general';
  let severity: ParsedIncidentSMS['severity'] = 'medium';
  
  for (const [type, keywords] of Object.entries(INCIDENT_KEYWORDS)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      incidentType = type as ParsedIncidentSMS['incidentType'];
      break;
    }
  }
  
  // Check for critical keywords
  if (CRITICAL_KEYWORDS.some(keyword => lowerDesc.includes(keyword))) {
    severity = 'critical';
  } else if (incidentType === 'violence') {
    severity = 'high';
  } else if (incidentType === 'vote_buying' || incidentType === 'result_manipulation') {
    severity = 'high';
  }
  
  return {
    type: 'incident',
    description: trimmed,
    incidentType,
    severity,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate confirmation message for result submission
 */
export function generateResultConfirmation(parsed: ParsedResultSMS): string {
  const breakdown = Object.entries(parsed.partyVotes)
    .map(([party, votes]) => `${party}:${votes}`)
    .join(' ');
  
  return `Confirm:\n${breakdown}\nTotal: ${parsed.totalVotes}\n\nReply YES to submit or NO to cancel.`;
}

/**
 * Generate success message for result submission
 */
export function generateResultSuccess(referenceId: string, parsed: ParsedResultSMS): string {
  const breakdown = Object.entries(parsed.partyVotes)
    .map(([party, votes]) => `${party}:${votes}`)
    .join(' ');
  
  return `✓ Result submitted!\n${breakdown}\nTotal: ${parsed.totalVotes}\nRef: ${referenceId}\n\nC&CC will validate shortly.`;
}

/**
 * Generate error message
 */
export function generateErrorMessage(errors: string[]): string {
  return `Error:\n${errors.join('\n')}\n\nSend HELP for format guide.`;
}

/**
 * Generate help message
 */
export function generateHelpMessage(): string {
  return `Election SMS Commands:

RESULTS:
R APGA:450 APC:320 PDP:280 LP:150
(Submitted immediately, no confirmation needed)

INCIDENT:
I [description of incident]

STATUS:
Check your submission status

Valid parties: ${VALID_PARTIES.join(', ')}`;
}

/**
 * Generate incident confirmation message
 */
export function generateIncidentConfirmation(referenceId: string, severity: string): string {
  return `✓ Incident reported!\nRef: ${referenceId}\nSeverity: ${severity}\n\nYour report has been escalated to coordinators.`;
}

/**
 * Generate status response
 */
export function generateStatusMessage(hasSubmitted: boolean, referenceId?: string, status?: string): string {
  if (!hasSubmitted) {
    return `No results submitted yet.\n\nSend: R APGA:450 APC:320 ... to submit results.`;
  }
  
  return `Your submission:\nRef: ${referenceId}\nStatus: ${status}\n\nThank you for your service!`;
}
