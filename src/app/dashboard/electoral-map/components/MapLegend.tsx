/**
 * Map Legend Component
 * Shows party colors and statistics
 */

'use client';

import { Party } from '@/lib/map-data-processor';
import { getMapStatistics } from '@/lib/map-data-processor';
import type { MapGeoJSON } from '@/lib/map-data-processor';

interface MapLegendProps {
  parties: Party[];
  geoJSON: MapGeoJSON | null;
}

export default function MapLegend({ parties, geoJSON }: MapLegendProps) {
  if (!geoJSON) return null;

  const stats = getMapStatistics(geoJSON);

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
      {/* Statistics */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Results Summary
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Units:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {stats.total_units.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Results Received:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {stats.results_received.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Pending:</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              {stats.results_pending.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Completion:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {stats.completion_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Total Votes:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {stats.total_votes.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Party Legend */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Party Wins
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {parties
            .filter(party => stats.party_wins[party.acronym] > 0)
            .sort((a, b) => 
              (stats.party_wins[b.acronym] || 0) - (stats.party_wins[a.acronym] || 0)
            )
            .map(party => {
              const wins = stats.party_wins[party.acronym] || 0;
              const percentage = stats.results_received > 0
                ? (wins / stats.results_received) * 100
                : 0;

              return (
                <div key={party.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: party.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {party.acronym}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-2">
                        {wins}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: party.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* No Results Message */}
      {stats.results_received === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Awaiting results...
          </p>
        </div>
      )}
    </div>
  );
}
