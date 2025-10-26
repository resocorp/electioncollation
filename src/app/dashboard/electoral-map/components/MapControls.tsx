/**
 * Map Controls Component
 * Toggle markers, heatmap, and filters
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Waves, RefreshCw } from 'lucide-react';

interface MapControlsProps {
  showMarkers: boolean;
  showHeatmap: boolean;
  onToggleMarkers: () => void;
  onToggleHeatmap: () => void;
  selectedLGA?: string;
  selectedWard?: string;
  onLGAChange: (lga: string) => void;
  onWardChange: (ward: string) => void;
  lgas: string[];
  wards: string[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function MapControls({
  showMarkers,
  showHeatmap,
  onToggleMarkers,
  onToggleHeatmap,
  selectedLGA,
  selectedWard,
  onLGAChange,
  onWardChange,
  lgas,
  wards,
  onRefresh,
  isRefreshing,
}: MapControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-3 max-w-xs">
      {/* View Controls */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          View Options
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={showHeatmap ? 'default' : 'outline'}
            onClick={onToggleHeatmap}
            className="flex-1"
          >
            <Waves className="w-4 h-4 mr-2" />
            Heatmap
          </Button>
          <Button
            size="sm"
            variant={showMarkers ? 'default' : 'outline'}
            onClick={onToggleMarkers}
            className="flex-1"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Markers
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Filters
        </h3>
        
        {/* LGA Filter */}
        <Select value={selectedLGA || 'all'} onValueChange={onLGAChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All LGAs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All LGAs</SelectItem>
            {lgas.map(lga => (
              <SelectItem key={lga} value={lga}>
                {lga}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ward Filter */}
        {selectedLGA && selectedLGA !== 'all' && (
          <Select value={selectedWard || 'all'} onValueChange={onWardChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {wards.map(ward => (
                <SelectItem key={ward} value={ward}>
                  {ward}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Refresh Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="w-full"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh Data
      </Button>
    </div>
  );
}
