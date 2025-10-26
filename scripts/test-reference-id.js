/**
 * Test script for new readable reference ID format
 * 
 * New format: {PREFIX}-{LGA_ABBR}-{WARD_ABBR}-{SEQ}
 * Examples:
 *   INC-AWN-TW-001 (Incident - Awka North - Test Ward - 001)
 *   EL-AWN-TW-042 (Election - Awka North - Test Ward - 042)
 * 
 * Run: node scripts/test-reference-id.js
 */

// Test abbreviation function
function generateAbbreviation(text, maxLength = 3) {
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

console.log('=== Reference ID Abbreviation Tests ===\n');

// Test cases
const testCases = [
  { input: 'Awka North', expected: 'AWN', maxLen: 3 },
  { input: 'Awka South', expected: 'AWS', maxLen: 3 },
  { input: 'Aguata', expected: 'AGU', maxLen: 3 },
  { input: 'Onitsha North', expected: 'ONI', maxLen: 3 },
  { input: 'Test Ward', expected: 'TW', maxLen: 2 },
  { input: 'Central', expected: 'CE', maxLen: 2 },
  { input: 'Ward One Two Three', expected: 'WO', maxLen: 2 },
  { input: 'ACHINA-I', expected: 'AC', maxLen: 2 },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = generateAbbreviation(test.input, test.maxLen);
  const status = result === test.expected ? '✓ PASS' : '✗ FAIL';
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status} - "${test.input}" → "${result}" (expected: "${test.expected}")`);
});

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

// Generate sample reference IDs
console.log('\n=== Sample Reference IDs ===\n');

const samples = [
  { prefix: 'INC', lga: 'Awka North', ward: 'Test Ward', seq: 1 },
  { prefix: 'INC', lga: 'Awka North', ward: 'Test Ward', seq: 15 },
  { prefix: 'INC', lga: 'Onitsha North', ward: 'Central', seq: 42 },
  { prefix: 'EL', lga: 'Aguata', ward: 'Achina-I', seq: 5 },
  { prefix: 'EL', lga: 'Awka South', ward: 'Amawbia', seq: 123 },
];

samples.forEach(sample => {
  const lgaAbbr = generateAbbreviation(sample.lga, 3);
  const wardAbbr = generateAbbreviation(sample.ward, 2);
  const seqNum = sample.seq.toString().padStart(3, '0');
  const refId = `${sample.prefix}-${lgaAbbr}-${wardAbbr}-${seqNum}`;
  
  console.log(`${refId.padEnd(18)} (${sample.lga} / ${sample.ward})`);
});

console.log('\n=== Benefits ===');
console.log('✓ Human-readable and easier to communicate over phone/SMS');
console.log('✓ Geographic context visible (LGA and Ward)');
console.log('✓ Sequential numbering per location for tracking');
console.log('✓ Shorter than timestamp-based IDs');
console.log('✓ Pattern: INC-{LGA:3}-{WARD:2}-{SEQ:3}');
