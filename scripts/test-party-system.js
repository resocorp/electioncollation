// Test Party System - Verify all 16 parties and partial results
require('dotenv').config({ path: '.env.local' });

const testCases = [
  {
    name: 'Partial Result - 1 Party',
    sms: 'R APC:320',
    expected: { parties: 1, valid: true }
  },
  {
    name: 'Partial Result - 2 Main Parties',
    sms: 'R APC:320 PDP:380',
    expected: { parties: 2, valid: true }
  },
  {
    name: 'Partial Result - 4 Main Parties',
    sms: 'R ADC:450 APC:320 APGA:500 LP:280',
    expected: { parties: 4, valid: true }
  },
  {
    name: 'Full Main Parties (Top 6)',
    sms: 'R ADC:450 APC:320 APGA:500 LP:280 PDP:380 YPP:150',
    expected: { parties: 6, valid: true }
  },
  {
    name: 'Other Parties Only',
    sms: 'R AA:20 BP:10 NRM:15',
    expected: { parties: 3, valid: true }
  },
  {
    name: 'Mixed Main and Other Parties',
    sms: 'R APC:320 PDP:380 AA:20 BP:10',
    expected: { parties: 4, valid: true }
  },
  {
    name: 'All 16 Parties',
    sms: 'R ADC:100 APC:200 APGA:300 LP:150 PDP:250 YPP:80 AA:20 ADP:15 AP:10 APM:5 BP:3 NNPP:25 NRM:8 PRP:12 SDP:18 ZLP:7',
    expected: { parties: 16, valid: true }
  },
  {
    name: 'Invalid Party',
    sms: 'R XYZ:100',
    expected: { parties: 0, valid: false }
  },
  {
    name: 'Mixed Valid and Invalid',
    sms: 'R APC:320 XYZ:100',
    expected: { parties: 1, valid: false }
  }
];

console.log('🧪 PARTY SYSTEM TEST SUITE\n');
console.log('='.repeat(70));

// Import the SMS parser
const { parseSMS } = require('../src/lib/sms-parser.ts');

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log('   SMS: ' + test.sms);
  
  try {
    const result = parseSMS(test.sms);
    
    if (result.type === 'result') {
      const partyCount = Object.keys(result.partyVotes).length;
      const isValid = result.isValid;
      
      console.log(`   Result: ${partyCount} parties, Valid: ${isValid}`);
      
      if (partyCount > 0) {
        console.log('   Parties:', Object.keys(result.partyVotes).join(', '));
        console.log('   Total Votes:', result.totalVotes);
      }
      
      if (result.errors.length > 0) {
        console.log('   Errors:', result.errors.join('; '));
      }
      
      // Check if result matches expected
      const passed = partyCount === test.expected.parties && isValid === test.expected.valid;
      
      if (passed) {
        console.log('   ✅ PASS');
        passCount++;
      } else {
        console.log(`   ❌ FAIL - Expected ${test.expected.parties} parties, valid=${test.expected.valid}`);
        failCount++;
      }
    } else {
      console.log('   ❌ FAIL - Not a result type');
      failCount++;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
    failCount++;
  }
});

console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${passCount}/${testCases.length}`);
console.log(`❌ Failed: ${failCount}/${testCases.length}`);

if (failCount === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Party system is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the results above.');
}

console.log('\n📝 Next: Test in browser');
console.log('   1. Open: http://localhost:3000/dashboard/sms-simulator');
console.log('   2. Send test SMS messages');
console.log('   3. Check dashboard displays top 6 + OTHERS');
