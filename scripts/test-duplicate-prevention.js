/**
 * Test Script: Duplicate Prevention
 * Tests that agents cannot submit results twice for the same polling unit
 * 
 * Usage: node scripts/test-duplicate-prevention.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function simulateIncomingSMS(phone, message, goipLine = 'goip-10101') {
  const response = await fetch(`${BASE_URL}/api/sms/goip/incoming`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      goip_line: goipLine,
      from_number: phone,
      content: message,
      recv_time: new Date().toISOString()
    })
  });

  const data = await response.json();
  return data;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDuplicatePrevention() {
  console.log('🧪 Testing Duplicate Submission Prevention\n');
  console.log('=' .repeat(60));

  // Test agent (make sure this exists in your database)
  const testAgent = {
    phone: '08011111101',
    line: 'goip-10101',
    pollingUnit: 'TEST-PU-001'
  };

  console.log(`\n📋 Test Agent: ${testAgent.phone}`);
  console.log(`   Polling Unit: ${testAgent.pollingUnit}`);
  console.log('-'.repeat(60));

  // Test 1: First submission (should succeed)
  console.log('\n1️⃣ Test: First result submission');
  const resultMessage = 'R APGA:450 APC:320 PDP:280 LP:150';
  console.log(`   Message: "${resultMessage}"`);
  
  const firstResponse = await simulateIncomingSMS(testAgent.phone, resultMessage, testAgent.line);
  console.log(`   Response:`, JSON.stringify(firstResponse, null, 2));
  
  if (firstResponse.status === 'success') {
    console.log(`   ✅ PASS: First submission accepted`);
    console.log(`   📝 Reference ID: ${firstResponse.reference_id}`);
  } else {
    console.log(`   ⚠️  Note: Submission may have already existed`);
  }

  await sleep(2000);

  // Test 2: Duplicate submission (should be rejected)
  console.log('\n2️⃣ Test: Duplicate submission (same results)');
  const secondResponse = await simulateIncomingSMS(testAgent.phone, resultMessage, testAgent.line);
  console.log(`   Response:`, JSON.stringify(secondResponse, null, 2));
  
  if (secondResponse.status === 'duplicate') {
    console.log(`   ✅ PASS: Duplicate detected and prevented`);
    console.log(`   📝 Existing ref: ${secondResponse.existing_ref}`);
  } else {
    console.log(`   ❌ FAIL: Duplicate was NOT prevented!`);
  }

  await sleep(2000);

  // Test 3: Different results (should still be rejected)
  console.log('\n3️⃣ Test: Different results, same polling unit');
  const differentMessage = 'R APGA:500 APC:300 PDP:250 LP:100';
  console.log(`   Message: "${differentMessage}"`);
  
  const thirdResponse = await simulateIncomingSMS(testAgent.phone, differentMessage, testAgent.line);
  console.log(`   Response:`, JSON.stringify(thirdResponse, null, 2));
  
  if (thirdResponse.status === 'duplicate') {
    console.log(`   ✅ PASS: Still prevented (correct behavior)`);
    console.log(`   📝 System correctly blocks any re-submission`);
  } else if (thirdResponse.status === 'error') {
    console.log(`   ✅ PASS: Database constraint prevented duplicate`);
  } else {
    console.log(`   ❌ FAIL: Should have been blocked!`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Duplicate Prevention Tests Complete!\n');
  console.log('📊 To verify results:');
  console.log('   1. Check that only ONE result exists for this agent');
  console.log('   2. Check sms_logs for duplicate prevention messages');
  console.log('\nSQL Query to verify:');
  console.log(`
  -- Check results for test agent
  SELECT reference_id, polling_unit_code, party_votes, 
         total_votes, submitted_at, validation_status
  FROM election_results
  WHERE agent_id = (
    SELECT id FROM agents WHERE phone_number = '${testAgent.phone}'
  )
  ORDER BY submitted_at DESC;
  `);
}

// Run tests
testDuplicatePrevention().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
