/**
 * Transform database data into GeoJSON format for Mapbox
 */

export interface PollingUnit {
  id: string;
  polling_unit_code: string;
  polling_unit_name: string;
  ward: string;
  lga: string;
  state: string;
  latitude: number;
  longitude: number;
  registered_voters: number;
}

export interface ElectionResult {
  id: string;
  polling_unit_code: string;
  party_votes: Record<string, number>;
  total_votes: number;
  submitted_at: string;
  validation_status: string;
}

export interface Party {
  id: string;
  acronym: string;
  full_name: string;
  color: string;
  display_order: number;
}

export interface MapFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    pu_code: string;
    pu_name: string;
    ward: string;
    lga: string;
    winning_party: string | null;
    winning_party_color: string | null;
    total_votes: number;
    vote_margin: number;
    vote_margin_percentage: number;
    results: Record<string, number>;
    result_received: boolean;
    timestamp: string | null;
    registered_voters: number;
  };
}

export interface MapGeoJSON {
  type: 'FeatureCollection';
  features: MapFeature[];
}

/**
 * Calculate winning party and margin from results
 */
function calculateWinningParty(partyVotes: Record<string, number>, parties: Party[]) {
  const entries = Object.entries(partyVotes);
  
  if (entries.length === 0) {
    return {
      winning_party: null,
      winning_party_color: null,
      vote_margin: 0,
      vote_margin_percentage: 0,
    };
  }

  // Sort by votes descending
  entries.sort((a, b) => b[1] - a[1]);
  
  const [winner, winnerVotes] = entries[0];
  const [, runnerUpVotes] = entries[1] || [null, 0];
  
  const totalVotes = entries.reduce((sum, [, votes]) => sum + votes, 0);
  const margin = winnerVotes - runnerUpVotes;
  const marginPercentage = totalVotes > 0 ? (margin / totalVotes) * 100 : 0;
  
  // Find party color
  const party = parties.find(p => p.acronym === winner);
  
  return {
    winning_party: winner,
    winning_party_color: party?.color || '#808080',
    vote_margin: margin,
    vote_margin_percentage: marginPercentage,
  };
}

/**
 * Transform polling units and results into GeoJSON
 */
export function transformToGeoJSON(
  pollingUnits: PollingUnit[],
  results: ElectionResult[],
  parties: Party[]
): MapGeoJSON {
  console.log(`🔄 Processing ${pollingUnits.length} polling units, ${results.length} results, ${parties.length} parties`);
  
  // Create a map of results by polling unit code for fast lookup
  const resultsMap = new Map<string, ElectionResult>();
  results.forEach(result => {
    resultsMap.set(result.polling_unit_code, result);
  });

  console.log(`📊 Results map has ${resultsMap.size} entries`);
  if (results.length > 0) {
    console.log('Sample result:', results[0]);
  }

  const features: MapFeature[] = pollingUnits
    .filter(unit => unit.latitude && unit.longitude) // Only units with GPS coordinates
    .map(unit => {
      const result = resultsMap.get(unit.polling_unit_code);
      
      let properties: MapFeature['properties'];
      
      if (result) {
        const winningInfo = calculateWinningParty(result.party_votes, parties);
        
        properties = {
          id: unit.id,
          pu_code: unit.polling_unit_code,
          pu_name: unit.polling_unit_name,
          ward: unit.ward,
          lga: unit.lga,
          winning_party: winningInfo.winning_party,
          winning_party_color: winningInfo.winning_party_color,
          total_votes: result.total_votes,
          vote_margin: winningInfo.vote_margin,
          vote_margin_percentage: winningInfo.vote_margin_percentage,
          results: result.party_votes,
          result_received: true,
          timestamp: result.submitted_at,
          registered_voters: unit.registered_voters,
        };
      } else {
        // No result yet
        properties = {
          id: unit.id,
          pu_code: unit.polling_unit_code,
          pu_name: unit.polling_unit_name,
          ward: unit.ward,
          lga: unit.lga,
          winning_party: null,
          winning_party_color: null,
          total_votes: 0,
          vote_margin: 0,
          vote_margin_percentage: 0,
          results: {},
          result_received: false,
          timestamp: null,
          registered_voters: unit.registered_voters,
        };
      }

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [unit.longitude, unit.latitude],
        },
        properties,
      };
    });

  const featuresWithResults = features.filter(f => f.properties.result_received);
  console.log(`✅ Created ${features.length} features, ${featuresWithResults.length} with results`);
  if (featuresWithResults.length > 0) {
    console.log('Sample feature with result:', featuresWithResults[0].properties);
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Calculate map bounds from polling units
 */
export function calculateBounds(pollingUnits: PollingUnit[]): [[number, number], [number, number]] | null {
  const validUnits = pollingUnits.filter(u => u.latitude && u.longitude);
  
  if (validUnits.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  validUnits.forEach(unit => {
    minLat = Math.min(minLat, unit.latitude);
    maxLat = Math.max(maxLat, unit.latitude);
    minLng = Math.min(minLng, unit.longitude);
    maxLng = Math.max(maxLng, unit.longitude);
  });

  // Add padding (5%)
  const latPadding = (maxLat - minLat) * 0.05;
  const lngPadding = (maxLng - minLng) * 0.05;

  return [
    [minLng - lngPadding, minLat - latPadding], // Southwest
    [maxLng + lngPadding, maxLat + latPadding], // Northeast
  ];
}

/**
 * Get statistics from GeoJSON data
 */
export function getMapStatistics(geoJSON: MapGeoJSON) {
  const total = geoJSON.features.length;
  const withResults = geoJSON.features.filter(f => f.properties.result_received).length;
  const pending = total - withResults;
  
  // Count by party
  const partyCount: Record<string, number> = {};
  geoJSON.features.forEach(feature => {
    if (feature.properties.winning_party) {
      partyCount[feature.properties.winning_party] = 
        (partyCount[feature.properties.winning_party] || 0) + 1;
    }
  });

  // Total votes
  const totalVotes = geoJSON.features.reduce(
    (sum, f) => sum + f.properties.total_votes, 
    0
  );

  return {
    total_units: total,
    results_received: withResults,
    results_pending: pending,
    completion_percentage: total > 0 ? (withResults / total) * 100 : 0,
    party_wins: partyCount,
    total_votes: totalVotes,
  };
}
