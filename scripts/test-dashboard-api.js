/**
 * Test script for dashboard API endpoints
 * Run with: node scripts/test-dashboard-api.js
 */

const BASE_URL = 'http://localhost:3000';

async function testDashboardStats() {
  console.log('\n🧪 Testing /api/dashboard/stats...');
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/stats`);
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response Data:');
    console.log('  - Expected Total PUs:', data.expectedTotalPUs);
    console.log('  - Profiled Agents:', data.profiledAgents);
    console.log('  - Profiling %:', data.profilingPercentage);
    console.log('  - Submitted Count:', data.submittedCount);
    console.log('  - Validated Count:', data.validatedCount);
    console.log('  - Pending Count:', data.pendingCount);
    console.log('  - Submission %:', data.submissionPercentage);
    console.log('  - Total Incidents:', data.totalIncidents);
    console.log('  - Investigating:', data.investigatingIncidents);
    console.log('  - Resolved:', data.resolvedIncidents);
    console.log('  - Total Votes:', data.totalVotes);
    
    if (data.partyVotes) {
      console.log('  - Party Votes:', JSON.stringify(data.partyVotes, null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testLatestResults() {
  console.log('\n🧪 Testing /api/dashboard/latest-results...');
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/latest-results?limit=5`);
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response Data:');
    console.log('  - Results Count:', data.count);
    
    if (data.results && data.results.length > 0) {
      console.log('\n  Latest Results:');
      data.results.forEach((result, index) => {
        console.log(`\n  Result ${index + 1}:`);
        console.log('    - Polling Unit:', result.pollingUnit);
        console.log('    - Location:', `${result.ward}, ${result.lga}`);
        console.log('    - Total Votes:', result.totalVotes);
        console.log('    - Validated At:', new Date(result.validatedAt).toLocaleString());
        console.log('    - Agent:', result.agentName);
        console.log('    - Party Votes:', JSON.stringify(result.partyVotes, null, 6));
      });
    } else {
      console.log('  ℹ️  No validated results yet');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Dashboard API Tests...');
  console.log('📍 Base URL:', BASE_URL);
  console.log('⏰ Time:', new Date().toLocaleString());
  
  await testDashboardStats();
  await testLatestResults();
  
  console.log('\n✨ Tests completed!\n');
}

// Run tests
runTests().catch(console.error);
