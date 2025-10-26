/**
 * Integration Test for Readable Reference IDs
 * Tests the actual database integration and sequence generation
 * 
 * Run: node scripts/test-reference-integration.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Copy of the abbreviation function
function generateAbbreviation(text, maxLength = 3) {
  const cleaned = text.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
  const words = cleaned.split(/\s+/);
  
  if (words.length === 1) {
    return words[0].substring(0, maxLength);
  } else if (words.length === 2) {
    return (words[0].substring(0, 2) + words[1].substring(0, 1)).substring(0, maxLength);
  } else {
    return words.map(w => w[0]).join('').substring(0, maxLength);
  }
}

// Copy of the reference ID generation function
async function generateReadableReferenceId(prefix, lga, ward, supabaseClient) {
  const lgaAbbr = generateAbbreviation(lga, 3);
  const wardAbbr = generateAbbreviation(ward, 2);
  
  const table = prefix === 'INC' ? 'incident_reports' : 'election_results';
  
  const { count, error } = await supabaseClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('lga', lga)
    .eq('ward', ward);
  
  if (error) {
    console.error('Error getting reference count:', error);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }
  
  const seqNum = ((count || 0) + 1).toString().padStart(3, '0');
  return `${prefix}-${lgaAbbr}-${wardAbbr}-${seqNum}`;
}

async function testReferenceIdGeneration() {
  console.log('=== Reference ID Integration Test ===\n');
  
  try {
    // Test 1: Check incident reports
    console.log('📊 Test 1: Checking existing incident reports...');
    const { data: incidents, error: incError } = await supabase
      .from('incident_reports')
      .select('reference_id, lga, ward')
      .order('reported_at', { ascending: false })
      .limit(5);
    
    if (incError) {
      console.error('❌ Error fetching incidents:', incError.message);
    } else {
      console.log(`✓ Found ${incidents?.length || 0} recent incidents`);
      if (incidents && incidents.length > 0) {
        console.log('\nRecent incident reference IDs:');
        incidents.forEach(inc => {
          console.log(`  ${inc.reference_id} (${inc.lga} / ${inc.ward})`);
        });
      }
    }
    
    // Test 2: Check election results
    console.log('\n📊 Test 2: Checking existing election results...');
    const { data: results, error: resError } = await supabase
      .from('election_results')
      .select('reference_id, lga, ward')
      .order('submitted_at', { ascending: false })
      .limit(5);
    
    if (resError) {
      console.error('❌ Error fetching results:', resError.message);
    } else {
      console.log(`✓ Found ${results?.length || 0} recent results`);
      if (results && results.length > 0) {
        console.log('\nRecent election result reference IDs:');
        results.forEach(res => {
          console.log(`  ${res.reference_id} (${res.lga} / ${res.ward})`);
        });
      }
    }
    
    // Test 3: Generate sample reference IDs
    console.log('\n📊 Test 3: Generating sample reference IDs...');
    
    // Get a real LGA/Ward from agents
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('lga, ward')
      .limit(1)
      .single();
    
    if (agentError || !agents) {
      console.log('⚠️  No agents found, using test data');
      const testLga = 'Awka North';
      const testWard = 'Test Ward';
      
      const incRef = await generateReadableReferenceId('INC', testLga, testWard, supabase);
      const elRef = await generateReadableReferenceId('EL', testLga, testWard, supabase);
      
      console.log(`\nGenerated IDs for ${testLga} / ${testWard}:`);
      console.log(`  Incident: ${incRef}`);
      console.log(`  Election: ${elRef}`);
    } else {
      const incRef = await generateReadableReferenceId('INC', agents.lga, agents.ward, supabase);
      const elRef = await generateReadableReferenceId('EL', agents.lga, agents.ward, supabase);
      
      console.log(`\nGenerated IDs for ${agents.lga} / ${agents.ward}:`);
      console.log(`  Incident: ${incRef}`);
      console.log(`  Election: ${elRef}`);
    }
    
    // Test 4: Check for mixed format (old vs new)
    console.log('\n📊 Test 4: Analyzing reference ID formats...');
    
    const { data: allIncidents } = await supabase
      .from('incident_reports')
      .select('reference_id');
    
    const { data: allResults } = await supabase
      .from('election_results')
      .select('reference_id');
    
    const incidentFormats = {
      readable: 0,
      timestamp: 0
    };
    
    const resultFormats = {
      readable: 0,
      timestamp: 0
    };
    
    if (allIncidents) {
      allIncidents.forEach(inc => {
        if (inc.reference_id.includes('-')) {
          incidentFormats.readable++;
        } else {
          incidentFormats.timestamp++;
        }
      });
    }
    
    if (allResults) {
      allResults.forEach(res => {
        if (res.reference_id.includes('-')) {
          resultFormats.readable++;
        } else {
          resultFormats.timestamp++;
        }
      });
    }
    
    console.log('\nIncident Reports:');
    console.log(`  Readable format: ${incidentFormats.readable}`);
    console.log(`  Timestamp format: ${incidentFormats.timestamp}`);
    console.log(`  Total: ${incidentFormats.readable + incidentFormats.timestamp}`);
    
    console.log('\nElection Results:');
    console.log(`  Readable format: ${resultFormats.readable}`);
    console.log(`  Timestamp format: ${resultFormats.timestamp}`);
    console.log(`  Total: ${resultFormats.readable + resultFormats.timestamp}`);
    
    // Test 5: Verify uniqueness
    console.log('\n📊 Test 5: Checking reference ID uniqueness...');
    
    const { data: incDuplicates } = await supabase
      .from('incident_reports')
      .select('reference_id')
      .then(({ data }) => {
        if (!data) return { data: [] };
        const refIds = data.map(d => d.reference_id);
        const duplicates = refIds.filter((item, index) => refIds.indexOf(item) !== index);
        return { data: duplicates };
      });
    
    const { data: resDuplicates } = await supabase
      .from('election_results')
      .select('reference_id')
      .then(({ data }) => {
        if (!data) return { data: [] };
        const refIds = data.map(d => d.reference_id);
        const duplicates = refIds.filter((item, index) => refIds.indexOf(item) !== index);
        return { data: duplicates };
      });
    
    if (incDuplicates && incDuplicates.length > 0) {
      console.log(`❌ Found ${incDuplicates.length} duplicate incident reference IDs`);
      console.log('Duplicates:', incDuplicates);
    } else {
      console.log('✓ All incident reference IDs are unique');
    }
    
    if (resDuplicates && resDuplicates.length > 0) {
      console.log(`❌ Found ${resDuplicates.length} duplicate election result reference IDs`);
      console.log('Duplicates:', resDuplicates);
    } else {
      console.log('✓ All election result reference IDs are unique');
    }
    
    console.log('\n✅ Integration test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testReferenceIdGeneration();
