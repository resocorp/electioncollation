/**
 * Hook for loading and caching electoral map data
 * Implements parallel batch loading with IndexedDB caching
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import {
  cachePollingUnits,
  getCachedPollingUnits,
  cacheResults,
  getCachedResults,
} from '@/lib/indexed-db';
import {
  transformToGeoJSON,
  calculateBounds,
  getMapStatistics,
  type PollingUnit,
  type ElectionResult,
  type Party,
  type MapGeoJSON,
} from '@/lib/map-data-processor';

const BATCH_SIZE = 1000;

interface UseMapDataResult {
  geoJSON: MapGeoJSON | null;
  parties: Party[];
  bounds: [[number, number], [number, number]] | null;
  statistics: ReturnType<typeof getMapStatistics> | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  refetch: () => Promise<void>;
}

export function useMapData(): UseMapDataResult {
  const [geoJSON, setGeoJSON] = useState<MapGeoJSON | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [bounds, setBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [statistics, setStatistics] = useState<ReturnType<typeof getMapStatistics> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Load polling units in parallel batches
   */
  const loadPollingUnits = useCallback(async (): Promise<PollingUnit[]> => {
    // Try cache first
    const cached = await getCachedPollingUnits();
    if (cached) {
      console.log('✅ Loaded polling units from cache');
      setProgress(30);
      return cached;
    }

    console.log('📡 Fetching polling units from server...');
    const supabase = createClient();

    // Get total count first
    const { count } = await supabase
      .from('polling_units')
      .select('*', { count: 'exact', head: true });

    const totalUnits = count || 5720;
    const batchCount = Math.ceil(totalUnits / BATCH_SIZE);

    // Create parallel batch requests
    const batchPromises = Array.from({ length: batchCount }, (_, i) => {
      const start = i * BATCH_SIZE;
      const end = start + BATCH_SIZE - 1;

      return supabase
        .from('polling_units')
        .select('*')
        .range(start, end)
        .then((result: any) => {
          // Update progress as batches complete
          const completed = i + 1;
          const progressPercent = Math.floor((completed / batchCount) * 30);
          setProgress(progressPercent);
          return result;
        });
    });

    // Execute all batches in parallel
    const results = await Promise.all(batchPromises);

    // Combine all results
    const allUnits = results.flatMap((r: any) => r.data || []);

    // Cache for next time
    await cachePollingUnits(allUnits);

    console.log(`✅ Loaded ${allUnits.length} polling units`);
    return allUnits;
  }, []);

  /**
   * Load election results
   */
  const loadResults = useCallback(async (): Promise<ElectionResult[]> => {
    // Try cache first
    const cached = await getCachedResults();
    if (cached) {
      console.log('✅ Loaded results from cache');
      setProgress(60);
      return cached;
    }

    console.log('📡 Fetching results from server...');
    const supabase = createClient();

    const { data, error: resultsError } = await supabase
      .from('election_results')
      .select('*')
      .eq('validation_status', 'validated'); // Only validated results

    if (resultsError) {
      console.error('Failed to load results:', resultsError);
      return [];
    }

    // Cache results
    await cacheResults(data || []);

    setProgress(60);
    console.log(`✅ Loaded ${data?.length || 0} results`);
    return data || [];
  }, []);

  /**
   * Load parties
   */
  const loadParties = useCallback(async (): Promise<Party[]> => {
    const supabase = createClient();

    const { data, error: partiesError } = await supabase
      .from('parties')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (partiesError) {
      console.error('Failed to load parties:', partiesError);
      return [];
    }

    setProgress(70);
    console.log(`✅ Loaded ${data?.length || 0} parties`);
    return data || [];
  }, []);

  /**
   * Load all data and transform to GeoJSON
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      console.log('🚀 Starting data load...');

      // Load all data in parallel
      const [pollingUnits, results, partiesData] = await Promise.all([
        loadPollingUnits(),
        loadResults(),
        loadParties(),
      ]);

      setProgress(80);
      setParties(partiesData);

      // Transform to GeoJSON
      console.log('🔄 Transforming to GeoJSON...');
      const geoJSONData = transformToGeoJSON(pollingUnits, results, partiesData);
      setGeoJSON(geoJSONData);

      // Calculate bounds
      const mapBounds = calculateBounds(pollingUnits);
      setBounds(mapBounds);

      // Calculate statistics
      const stats = getMapStatistics(geoJSONData);
      setStatistics(stats);

      setProgress(100);
      console.log('✅ Map data ready!', stats);
    } catch (err) {
      console.error('Failed to load map data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  }, [loadPollingUnits, loadResults, loadParties]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    geoJSON,
    parties,
    bounds,
    statistics,
    isLoading,
    error,
    progress,
    refetch: loadData,
  };
}
