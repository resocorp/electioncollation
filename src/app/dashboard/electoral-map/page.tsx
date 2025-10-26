/**
 * Electoral Map Page
 * Real-time visualization of election results across Anambra State
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMapData } from '@/hooks/use-map-data';
import { useRealtimeResults } from '@/hooks/use-realtime-results';
import { ElectionResult } from '@/lib/map-data-processor';
import MapControls from './components/MapControls';
import MapLegend from './components/MapLegend';

// Dynamic import to avoid SSR issues with Mapbox
const MapClient = dynamic(() => import('./components/MapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

export default function ElectoralMapPage() {
  const { geoJSON, parties, isLoading, refetch } = useMapData();
  const [showMarkers, setShowMarkers] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedLGA, setSelectedLGA] = useState<string>();
  const [selectedWard, setSelectedWard] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  // Handle real-time result updates
  const handleResultUpdate = useCallback((result: ElectionResult) => {
    console.log('📊 New result received:', result.polling_unit_code);
    // Trigger a refresh to update the map
    refetch();
  }, [refetch]);

  // Subscribe to real-time updates
  useRealtimeResults({
    onResultUpdate: handleResultUpdate,
    enabled: realtimeEnabled,
  });

  // Extract unique LGAs and Wards from data
  const { lgas, wards } = useMemo(() => {
    if (!geoJSON) return { lgas: [], wards: [] };

    const lgaSet = new Set<string>();
    const wardSet = new Set<string>();

    geoJSON.features.forEach(feature => {
      lgaSet.add(feature.properties.lga);
      if (!selectedLGA || feature.properties.lga === selectedLGA) {
        wardSet.add(feature.properties.ward);
      }
    });

    return {
      lgas: Array.from(lgaSet).sort(),
      wards: Array.from(wardSet).sort(),
    };
  }, [geoJSON, selectedLGA]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Handle LGA change
  const handleLGAChange = (lga: string) => {
    if (lga === 'all') {
      setSelectedLGA(undefined);
      setSelectedWard(undefined);
    } else {
      setSelectedLGA(lga);
      setSelectedWard(undefined);
    }
  };

  // Handle Ward change
  const handleWardChange = (ward: string) => {
    if (ward === 'all') {
      setSelectedWard(undefined);
    } else {
      setSelectedWard(ward);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Electoral Map
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Real-time visualization of election results across Anambra State
        </p>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {!isLoading && (
          <>
            <MapClient
              showMarkers={showMarkers}
              showHeatmap={showHeatmap}
              selectedLGA={selectedLGA}
              selectedWard={selectedWard}
            />

            <MapControls
              showMarkers={showMarkers}
              showHeatmap={showHeatmap}
              onToggleMarkers={() => setShowMarkers(!showMarkers)}
              onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
              selectedLGA={selectedLGA}
              selectedWard={selectedWard}
              onLGAChange={handleLGAChange}
              onWardChange={handleWardChange}
              lgas={lgas}
              wards={wards}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />

            <MapLegend parties={parties} geoJSON={geoJSON} />
          </>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Loading electoral map...
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Preparing 5,720 polling units
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
