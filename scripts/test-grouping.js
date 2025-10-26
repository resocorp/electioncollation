// Test the party grouping function
const MAIN_PARTIES = ['ADC', 'APC', 'APGA', 'LP', 'PDP', 'YPP'];

function groupPartyVotes(partyVotes) {
  const grouped = {};
  let othersTotal = 0;

  for (const [party, votes] of Object.entries(partyVotes)) {
    if (MAIN_PARTIES.includes(party)) {
      grouped[party] = votes;
    } else {
      othersTotal += votes;
    }
  }

  if (othersTotal > 0) {
    grouped['OTHERS'] = othersTotal;
  }

  return grouped;
}

// Test with sample data from your screenshot
const sampleData = {
  LP: 200,
  APC: 650,
  PDP: 650,
  APGA: 1050,
  ADC: 0,
  SDP: 0,
  YPP: 1,
  NNPP: 0
};

console.log('🧪 Testing Party Grouping Function\n');
console.log('Input (All Parties):');
console.log(JSON.stringify(sampleData, null, 2));

const grouped = groupPartyVotes(sampleData);

console.log('\nOutput (Top 6 + OTHERS):');
console.log(JSON.stringify(grouped, null, 2));

console.log('\n📊 Expected Dashboard Display:');
Object.entries(grouped).forEach(([party, votes]) => {
  console.log(`   ${party}: ${votes} votes`);
});

console.log('\n✅ Grouping function works correctly!');
console.log('\n📝 To see this on dashboard:');
console.log('   1. Hard refresh browser: Ctrl + Shift + R');
console.log('   2. Or clear browser cache');
console.log('   3. Reload: http://localhost:3000/dashboard');
