/**
 * Import Polling Units from Google Sheets to Supabase
 * 
 * Google Sheets URL: https://docs.google.com/spreadsheets/d/1-f5rlmkix9IcMiz_iIgtomgzBadyGdLoAsoZt7m1sd8/edit?gid=1436370438#gid=1436370438
 * 
 * Steps:
 * 1. Export the Google Sheet as CSV
 * 2. Place it in the scripts folder as 'anambra-polling-units.csv'
 * 3. Run: npm run import-polling-units
 * 
 * Expected CSV format:
 * STATE,LGA,WARD,POLLING_UNIT_CODE,POLLING_UNIT_NAME,LATITUDE,LONGITUDE,REGISTERED_VOTERS
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PollingUnit {
  state: string;
  lga: string;
  ward: string;
  polling_unit_code: string;
  polling_unit_name: string;
  latitude: number | null;
  longitude: number | null;
  registered_voters: number;
}

async function parseCSV(csvPath: string): Promise<PollingUnit[]> {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  console.log('CSV Headers:', headers);

  const pollingUnits: PollingUnit[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length < 6) continue; // Need at least State, LGA, Ward, Code, Name, Lat, Lng

    // Map column names (handles both formats)
    const stateIdx = headers.findIndex(h => h.toLowerCase().includes('state'));
    const lgaIdx = headers.findIndex(h => h.toLowerCase().includes('local government') || h.toLowerCase() === 'lga');
    const wardIdx = headers.findIndex(h => h.toLowerCase().includes('ward'));
    const puCodeIdx = headers.findIndex(h => h.toLowerCase().includes('polling unit code') || h.toLowerCase().includes('pu code'));
    const puNameIdx = headers.findIndex(h => h.toLowerCase().includes('polling unit') && !h.toLowerCase().includes('code'));
    const latIdx = headers.findIndex(h => h.toLowerCase().includes('latitude') || h.toLowerCase() === 'lat');
    const lngIdx = headers.findIndex(h => h.toLowerCase().includes('longitude') || h.toLowerCase() === 'lng');

    if (stateIdx < 0 || lgaIdx < 0 || wardIdx < 0 || puCodeIdx < 0 || puNameIdx < 0) {
      console.warn(`Skipping row ${i + 1}: Missing required columns`);
      continue;
    }

    const lat = latIdx >= 0 && values[latIdx] ? parseFloat(values[latIdx]) : null;
    const lng = lngIdx >= 0 && values[lngIdx] ? parseFloat(values[lngIdx]) : null;

    // Clean up state and LGA names (remove prefixes like "04 - ")
    let state = values[stateIdx];
    let lga = values[lgaIdx];
    let ward = values[wardIdx];
    
    // Remove number prefixes (e.g., "04 - ANAMBRA" -> "ANAMBRA")
    state = state.replace(/^\d+\s*-\s*/, '').trim();
    lga = lga.replace(/^\d+\s*-\s*/, '').trim();
    ward = ward.replace(/^\d+\s*-\s*/, '').trim();

    // Generate polling unit code if it's just a number
    let puCode = values[puCodeIdx];
    if (/^\d+$/.test(puCode)) {
      // Format: LGA_WARD_CODE (e.g., AGUATA_ACHINA-I_001)
      const lgaCode = lga.substring(0, 6).toUpperCase().replace(/\s+/g, '');
      const wardCode = ward.replace(/\s+/g, '-').toUpperCase();
      puCode = `${lgaCode}_${wardCode}_${puCode.padStart(3, '0')}`;
    }

    pollingUnits.push({
      state: state,
      lga: lga,
      ward: ward,
      polling_unit_code: puCode,
      polling_unit_name: values[puNameIdx],
      latitude: lat && !isNaN(lat) ? lat : null,
      longitude: lng && !isNaN(lng) ? lng : null,
      registered_voters: 0 // Not in this CSV
    });
  }

  return pollingUnits;
}

async function importPollingUnits(pollingUnits: PollingUnit[]) {
  console.log(`\nImporting ${pollingUnits.length} polling units...`);

  let successCount = 0;
  let errorCount = 0;

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < pollingUnits.length; i += batchSize) {
    const batch = pollingUnits.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('polling_units')
      .upsert(batch, { onConflict: 'polling_unit_code' });

    if (error) {
      console.error(`Error importing batch ${i / batchSize + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✓ Imported batch ${i / batchSize + 1} (${successCount}/${pollingUnits.length})`);
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${pollingUnits.length}`);
}

async function main() {
  console.log('=== Polling Units Import Tool ===\n');

  // Check for CSV file - try multiple possible filenames
  const possibleFiles = [
    'anambra-polling-units.csv',
    'Coordinates of all_LGA_WARD_PU_5720 - All PU.csv',
  ];

  let csvPath: string | null = null;
  for (const filename of possibleFiles) {
    const testPath = path.join(process.cwd(), 'scripts', filename);
    if (fs.existsSync(testPath)) {
      csvPath = testPath;
      break;
    }
  }
  
  if (!csvPath) {
    console.error('❌ CSV file not found!');
    console.log('\nPlease place one of these files in the scripts folder:');
    possibleFiles.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }

  console.log(`✓ Found CSV file: ${path.basename(csvPath)}\n`);

  try {
    // Parse CSV
    const pollingUnits = await parseCSV(csvPath);
    console.log(`✓ Parsed ${pollingUnits.length} polling units from CSV`);

    // Show sample
    console.log('\nSample data:');
    console.log(JSON.stringify(pollingUnits[0], null, 2));

    // Import to Supabase
    await importPollingUnits(pollingUnits);

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
