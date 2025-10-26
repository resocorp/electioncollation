/**
 * Test Phone Number Formatting
 * Run with: node scripts/test-phone-format.js
 */

function formatPhoneNumber(phone) {
  // Normalize to local Nigerian format (0xxxxxxxxxx) to match database storage
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert international format (234xxxxxxxxxx) to local format (0xxxxxxxxxx)
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    cleaned = '0' + cleaned.substring(3);
  }
  // Convert international with + (+234xxxxxxxxxx) to local format
  else if (cleaned.startsWith('234') && cleaned.length > 10) {
    cleaned = '0' + cleaned.substring(3);
  }
  // If already starts with 0, keep it as is
  else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Already in correct format
    cleaned = cleaned;
  }
  // If no prefix, assume local and add 0
  else if (!cleaned.startsWith('0') && !cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
}

function formatPhoneNumberForSending(phone) {
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

// Test cases
const testCases = [
  '08066137843',
  '2348066137843',
  '+2348066137843',
  '8066137843',
  '234 806 613 7843',
  '+234 (0) 806-613-7843'
];

console.log('='.repeat(80));
console.log('Phone Number Format Testing');
console.log('='.repeat(80));
console.log();

testCases.forEach(testCase => {
  const localFormat = formatPhoneNumber(testCase);
  const internationalFormat = formatPhoneNumberForSending(testCase);
  
  console.log(`Input:         "${testCase}"`);
  console.log(`  → Local:     ${localFormat}`);
  console.log(`  → Intl:      ${internationalFormat}`);
  console.log(`  ✓ DB Lookup: ${localFormat === '08066137843' ? 'PASS' : 'FAIL'}`);
  console.log(`  ✓ DBL API:   ${internationalFormat === '2348066137843' ? 'PASS' : 'FAIL'}`);
  console.log();
});

console.log('='.repeat(80));
console.log('Summary:');
console.log('='.repeat(80));
console.log();
console.log('✓ All inputs should convert to:');
console.log('  - Local format (for DB):    08066137843');
console.log('  - International (for DBL):  2348066137843');
console.log();
console.log('Database Schema:');
console.log('  - agents.phone_number:      08066137843');
console.log('  - sms_logs.phone_number:    08066137843');
console.log();
console.log('DBL API:');
console.log('  - Incoming from_number:     2348066137843 → converted to 08066137843');
console.log('  - Outgoing to number:       08066137843 → converted to 2348066137843');
console.log();
console.log('='.repeat(80));
