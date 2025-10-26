/**
 * Database Connection Test Script
 * Run with: node scripts/test-database.js
 */

const https = require('https');

const SUPABASE_URL = 'https://ncftsabdnuwemcqnlzmr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yfqwdfHDBZGJ48k2viDaag_3onwq4BC';

console.log('🔍 Testing Supabase Connection...\n');

// Test 1: Check if tables exist
function testTablesExist() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ncftsabdnuwemcqnlzmr.supabase.co',
      path: '/rest/v1/agents?limit=1',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Database connection successful');
          console.log('✅ Agents table exists');
          resolve(true);
        } else {
          console.log('❌ Error:', res.statusCode, data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Connection error:', e.message);
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Count agents
function countAgents() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ncftsabdnuwemcqnlzmr.supabase.co',
      path: '/rest/v1/agents?select=count',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const count = res.headers['content-range']?.split('/')[1] || '0';
        console.log(`📊 Total agents in database: ${count}`);
        
        if (parseInt(count) > 0) {
          console.log('✅ Sample data loaded successfully');
        } else {
          console.log('⚠️  No agents found - you need to run seed-data.sql');
        }
        resolve(parseInt(count));
      });
    });

    req.on('error', (e) => {
      console.log('❌ Error counting agents:', e.message);
      resolve(0);
    });

    req.end();
  });
}

// Test 3: Check parties
function checkParties() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ncftsabdnuwemcqnlzmr.supabase.co',
      path: '/rest/v1/parties?select=acronym',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parties = JSON.parse(data);
          if (parties.length > 0) {
            console.log(`✅ Parties configured: ${parties.map(p => p.acronym).join(', ')}`);
          } else {
            console.log('⚠️  No parties found - run seed-data.sql');
          }
          resolve(parties.length);
        } catch (e) {
          console.log('❌ Error parsing parties:', e.message);
          resolve(0);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Error fetching parties:', e.message);
      resolve(0);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('════════════════════════════════════════');
  console.log('  DATABASE CONNECTION TEST');
  console.log('════════════════════════════════════════\n');

  const connected = await testTablesExist();
  
  if (!connected) {
    console.log('\n❌ FAILED: Could not connect to database');
    console.log('\n📝 ACTION REQUIRED:');
    console.log('1. Go to https://ncftsabdnuwemcqnlzmr.supabase.co');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of supabase/schema.sql');
    console.log('4. Run the contents of supabase/seed-data.sql');
    return;
  }

  console.log('');
  const agentCount = await countAgents();
  console.log('');
  const partyCount = await checkParties();

  console.log('\n════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('════════════════════════════════════════\n');

  if (agentCount >= 105 && partyCount >= 8) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n✨ Database is ready for testing');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Login: 2348000000000 / Admin123!');
    console.log('4. Test SMS Simulator\n');
  } else {
    console.log('⚠️  DATABASE SETUP INCOMPLETE\n');
    console.log('📝 ACTION REQUIRED:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run supabase/schema.sql (if not done)');
    console.log('3. Run supabase/seed-data.sql (if not done)');
    console.log('4. Run this test again: node scripts/test-database.js\n');
  }
}

runTests();
