import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format phone number to LOCAL Nigerian format (0xxxxxxxxxx) for database storage
 * Converts: 2348066137843 → 08066137843
 * Converts: +2348066137843 → 08066137843
 * Keeps: 08066137843 → 08066137843
 */
export function formatPhoneNumber(phone: string): string {
  // Normalize to local Nigerian format (0xxxxxxxxxx) to match database storage
  let cleaned = phone.replace(/\D/g, '');
  
  console.log(`[formatPhoneNumber] Input: "${phone}" → Cleaned: "${cleaned}" (length: ${cleaned.length})`);
  
  // Convert international format (234xxxxxxxxxx) to local format (0xxxxxxxxxx)
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    cleaned = '0' + cleaned.substring(3);
    console.log(`[formatPhoneNumber] Converted from international (13 chars): ${cleaned}`);
  }
  // Convert international with + (+234xxxxxxxxxx) to local format
  else if (cleaned.startsWith('234') && cleaned.length > 10) {
    cleaned = '0' + cleaned.substring(3);
    console.log(`[formatPhoneNumber] Converted from international (>10 chars): ${cleaned}`);
  }
  // If already starts with 0, keep it as is
  else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Already in correct format
    console.log(`[formatPhoneNumber] Already in local format: ${cleaned}`);
    cleaned = cleaned;
  }
  // If no prefix, assume local and add 0
  else if (!cleaned.startsWith('0') && !cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
    console.log(`[formatPhoneNumber] Added 0 prefix: ${cleaned}`);
  }
  
  console.log(`[formatPhoneNumber] Final result: ${cleaned}`);
  return cleaned;
}

/**
 * Format phone number to INTERNATIONAL format for sending SMS via DBL
 * Converts: 08066137843 → 2348066137843
 * Converts: 8066137843 → 2348066137843
 * Keeps: 2348066137843 → 2348066137843
 */
export function formatPhoneNumberForSending(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 234
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.substring(1);
  }
  // If no prefix and 10 digits, add 234
  else if (!cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '234' + cleaned;
  }
  // If already starts with 234, keep as is
  else if (cleaned.startsWith('234')) {
    // Already in international format
    cleaned = cleaned;
  }
  
  return cleaned;
}

/**
 * Generate abbreviated code from text (e.g., "Awka North" -> "AWN")
 */
function generateAbbreviation(text: string, maxLength: number = 3): string {
  // Remove special characters and extra spaces
  const cleaned = text.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
  
  // Split into words
  const words = cleaned.split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first N characters
    return words[0].substring(0, maxLength);
  } else if (words.length === 2) {
    // Two words: take first 2 chars from first word + first char from second
    return (words[0].substring(0, 2) + words[1].substring(0, 1)).substring(0, maxLength);
  } else {
    // Multiple words: take first char from each word
    return words.map(w => w[0]).join('').substring(0, maxLength);
  }
}

/**
 * Generate human-readable reference ID
 * Format: {PREFIX}-{LGA}-{WARD}-{SEQ}
 * Example: INC-AWN-TW-001, EL-AWN-TW-042
 */
export async function generateReadableReferenceId(
  prefix: string,
  lga: string,
  ward: string,
  supabaseClient: any
): Promise<string> {
  const lgaAbbr = generateAbbreviation(lga, 3);
  const wardAbbr = generateAbbreviation(ward, 2);
  
  // Determine table based on prefix
  const table = prefix === 'INC' ? 'incident_reports' : 'election_results';
  
  // Get count of existing records with same LGA/Ward for this type
  const { count, error } = await supabaseClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('lga', lga)
    .eq('ward', ward);
  
  if (error) {
    console.error('Error getting reference count:', error);
    // Fallback to timestamp-based if query fails
    return generateReferenceId(prefix);
  }
  
  // Next sequence number (count + 1)
  const seqNum = ((count || 0) + 1).toString().padStart(3, '0');
  
  return `${prefix}-${lgaAbbr}-${wardAbbr}-${seqNum}`;
}

/**
 * Legacy timestamp-based reference ID generator (fallback)
 */
export function generateReferenceId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
