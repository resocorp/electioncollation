/**
 * Hook for real-time election results updates
 * Subscribes to Supabase realtime changes
 */

'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ElectionResult } from '@/lib/map-data-processor';

interface UseRealtimeResultsProps {
  onResultUpdate: (result: ElectionResult) => void;
  enabled?: boolean;
}

export function useRealtimeResults({ onResultUpdate, enabled = true }: UseRealtimeResultsProps) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    console.log('🔴 Subscribing to real-time results...');

    const channel = supabase
      .channel('election_results_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'election_results',
          filter: 'validation_status=eq.validated',
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const result = payload.new as ElectionResult;
            onResultUpdate(result);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('🔴 Unsubscribing from real-time results');
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // Only re-subscribe if enabled changes
}
