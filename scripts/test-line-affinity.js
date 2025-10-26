/**
 * Test Script: Line Affinity
 * Tests that responses come from the same GoIP line that received the message
 * 
 * Usage: node scripts/test-line-affinity.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test agents (make sure these exist in your database)
const TEST_AGENTS = [
  { phone: '08011111101', line: 'goip-10101', name: 'Agent 1' },
  { phone: '08011111102', line: 'goip-10102', name: 'Agent 2' },
  { phone: '08011111103', line: 'goip-10103', name: 'Agent 3' }
];

async function simulateIncomingSMS(phone, message, goipLine) {
  console.log(`\n📨 Simulating SMS from ${phone} via ${goipLine}`);
  console.log(`   Message: "${message}"`);
  
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

async function checkSession(phone) {
  // This would query your database to check the session
  console.log(`   ℹ️  Session should show: last_goip_line = "${goipLine}"`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLineAffinity() {
  console.log('🧪 Testing Line Affinity Implementation\n');
  console.log('=' .repeat(60));

  for (const agent of TEST_AGENTS) {
    console.log(`\n📋 Testing ${agent.name} (${agent.phone})`);
    console.log('-'.repeat(60));

    // Test 1: Send HELP command
    console.log('\n1️⃣ Test: HELP command');
    const helpResponse = await simulateIncomingSMS(agent.phone, 'HELP', agent.line);
    console.log(`   ✅ Response:`, helpResponse.status);
    console.log(`   📝 Expected: Response sent via ${agent.line}`);
    
    await sleep(1000);

    // Test 2: Send STATUS query
    console.log('\n2️⃣ Test: STATUS query');
    const statusResponse = await simulateIncomingSMS(agent.phone, 'STATUS', agent.line);
    console.log(`   ✅ Response:`, statusResponse.status);
    console.log(`   📝 Expected: Response sent via ${agent.line}`);

    await sleep(1000);

    // Test 3: Send from DIFFERENT line (should still use first line)
    console.log('\n3️⃣ Test: Message from different line');
    const differentLine = agent.line === 'goip-10101' ? 'goip-10102' : 'goip-10101';
    const statusResponse2 = await simulateIncomingSMS(agent.phone, 'STATUS', differentLine);
    console.log(`   ✅ Response:`, statusResponse2.status);
    console.log(`   📝 Expected: Response STILL sent via ${agent.line} (original line)`);

    await sleep(2000);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Line Affinity Tests Complete!\n');
  console.log('📊 To verify results:');
  console.log('   1. Check application logs for "Using line XXX for responses"');
  console.log('   2. Check sms_logs table for outbound messages');
  console.log('   3. Check sms_sessions table for line assignments');
  console.log('\nSQL Queries to verify:');
  console.log(`
  -- Check sessions
  SELECT phone_number, session_data->>'last_goip_line' as assigned_line
  FROM sms_sessions
  WHERE phone_number IN ('${TEST_AGENTS.map(a => a.phone).join("', '")}');

  -- Check outbound SMS
  SELECT phone_number, metadata->>'goip_line' as used_line, message, created_at
  FROM sms_logs
  WHERE direction = 'outbound'
    AND phone_number IN ('${TEST_AGENTS.map(a => a.phone).join("', '")}')
  ORDER BY created_at DESC;
  `);
}

// Run tests
testLineAffinity().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
