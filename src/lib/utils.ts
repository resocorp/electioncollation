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
