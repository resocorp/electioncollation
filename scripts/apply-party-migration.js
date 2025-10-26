// Apply Party Migration - Add all 16 parties to database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const parties = [
  // Main Parties (Top 6)
  { acronym: 'ADC', full_name: 'African Democratic Congress', color: '#228B22', display_order: 1, is_active: true },
  { acronym: 'APC', full_name: 'All Progressives Congress', color: '#0066CC', display_order: 2, is_active: true },
  { acronym: 'APGA', full_name: 'All Progressives Grand Alliance', color: '#006600', display_order: 3, is_active: true },
  { acronym: 'LP', full_name: 'Labour Party', color: '#DC143C', display_order: 4, is_active: true },
  { acronym: 'PDP', full_name: 'Peoples Democratic Party', color: '#FF0000', display_order: 5, is_active: true },
  { acronym: 'YPP', full_name: 'Young Progressives Party', color: '#4169E1', display_order: 6, is_active: true },
  // Other Registered Parties
  { acronym: 'AA', full_name: 'Action Alliance', color: '#800080', display_order: 7, is_active: true },
  { acronym: 'ADP', full_name: 'Action Democratic Party', color: '#FFA500', display_order: 8, is_active: true },
  { acronym: 'AP', full_name: 'Accord Party', color: '#008080', display_order: 9, is_active: true },
  { acronym: 'APM', full_name: 'Allied Peoples Movement', color: '#FF1493', display_order: 10, is_active: true },
  { acronym: 'BP', full_name: 'Boot Party', color: '#8B4513', display_order: 11, is_active: true },
  { acronym: 'NNPP', full_name: 'New Nigeria Peoples Party', color: '#FF6600', display_order: 12, is_active: true },
  { acronym: 'NRM', full_name: 'National Rescue Movement', color: '#00CED1', display_order: 13, is_active: true },
  { acronym: 'PRP', full_name: "People's Redemption Party", color: '#9370DB', display_order: 14, is_active: true },
  { acronym: 'SDP', full_name: 'Social Democratic Party', color: '#FFD700', display_order: 15, is_active: true },
  { acronym: 'ZLP', full_name: 'Zenith Labour Party', color: '#20B2AA', display_order: 16, is_active: true },
];

async function applyMigration() {
  console.log('🚀 Starting party migration...\n');

  try {
    // Check current parties
    const { data: existingParties, error: fetchError } = await supabase
      .from('parties')
      .select('acronym');

    if (fetchError) {
      console.error('❌ Error fetching existing parties:', fetchError.message);
      process.exit(1);
    }

    console.log(`📊 Current parties in database: ${existingParties?.length || 0}`);
    
    if (existingParties) {
      console.log('   Existing:', existingParties.map(p => p.acronym).join(', '));
    }

    console.log('\n🔄 Upserting all 16 parties...\n');

    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (const party of parties) {
      const { data, error } = await supabase
        .from('parties')
        .upsert(party, { onConflict: 'acronym' })
        .select();

      if (error) {
        console.error(`   ❌ ${party.acronym}: ${error.message}`);
        errorCount++;
      } else {
        const isNew = !existingParties?.find(p => p.acronym === party.acronym);
        if (isNew) {
          console.log(`   ✅ ${party.acronym}: ${party.full_name} (NEW)`);
          successCount++;
        } else {
          console.log(`   🔄 ${party.acronym}: ${party.full_name} (UPDATED)`);
          updateCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ New parties added:     ${successCount}`);
    console.log(`🔄 Existing parties updated: ${updateCount}`);
    console.log(`❌ Errors:                ${errorCount}`);
    console.log(`📦 Total parties:         ${successCount + updateCount}`);

    // Verify final count
    const { data: finalParties, error: verifyError } = await supabase
      .from('parties')
      .select('acronym, full_name, display_order')
      .order('display_order');

    if (verifyError) {
      console.error('\n❌ Error verifying parties:', verifyError.message);
    } else {
      console.log('\n✅ VERIFICATION: All parties in database:');
      console.log('='.repeat(60));
      
      console.log('\n🎯 Main Parties (Top 6):');
      finalParties?.slice(0, 6).forEach(p => {
        console.log(`   ${p.display_order}. ${p.acronym} - ${p.full_name}`);
      });

      console.log('\n📋 Other Parties:');
      finalParties?.slice(6).forEach(p => {
        console.log(`   ${p.display_order}. ${p.acronym} - ${p.full_name}`);
      });

      console.log('\n' + '='.repeat(60));
      console.log(`✅ Total: ${finalParties?.length || 0} parties configured`);
    }

    if (errorCount === 0) {
      console.log('\n🎉 MIGRATION COMPLETE! All parties successfully configured.');
      console.log('\n📝 Next Steps:');
      console.log('   1. Restart your dev server: npm run dev');
      console.log('   2. Test SMS submission with partial results');
      console.log('   3. Check dashboard displays top 6 + OTHERS');
      console.log('\n📚 See APPLY_PARTY_UPDATES.md for testing guide');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review above.');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

applyMigration();
