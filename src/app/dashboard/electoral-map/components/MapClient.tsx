/**
 * Electoral Map Client Component
 * Displays real-time election results with diffusion effect
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { useMapData } from '@/hooks/use-map-data';
import { Party } from '@/lib/map-data-processor';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapClientProps {
  showMarkers: boolean;
  showHeatmap: boolean;
  selectedLGA?: string;
  selectedWard?: string;
}

export default function MapClient({
  showMarkers,
  showHeatmap,
  selectedLGA,
  selectedWard,
}: MapClientProps) {
  const mapRef = useRef<MapRef>(null);
  const { geoJSON, parties, bounds, isLoading, error } = useMapData();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fit bounds when data loads
  useEffect(() => {
    if (mapRef.current && bounds && geoJSON) {
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        duration: 1000,
      });
    }
  }, [bounds, geoJSON]);

  // Filter GeoJSON by LGA/Ward
  const filteredGeoJSON = geoJSON ? {
    ...geoJSON,
    features: geoJSON.features.filter(feature => {
      if (selectedLGA && feature.properties.lga !== selectedLGA) return false;
      if (selectedWard && feature.properties.ward !== selectedWard) return false;
      return true;
    }),
  } : null;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8">
          <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            Failed to load map data
          </p>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !filteredGeoJSON) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading electoral map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 6.9,
          latitude: 6.2,
          zoom: 8,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onLoad={() => setMapLoaded(true)}
      >
        {mapLoaded && filteredGeoJSON && (
          <>
            {/* Data Source */}
            <Source
              id="polling-units"
              type="geojson"
              data={filteredGeoJSON}
            >
              {/* Heatmap Layers - One per party */}
              {showHeatmap && parties.map(party => (
                <Layer
                  key={`heatmap-${party.acronym}`}
                  id={`heatmap-${party.acronym}`}
                  type="heatmap"
                  source="polling-units"
                  filter={['==', ['get', 'winning_party'], party.acronym]}
                  paint={{
                    // Heatmap weight based on vote margin
                    'heatmap-weight': [
                      'interpolate',
                      ['linear'],
                      ['get', 'vote_margin_percentage'],
                      0, 0,
                      100, 1,
                    ],
                    // Heatmap intensity increases with zoom
                    'heatmap-intensity': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      0, 1,
                      12, 3,
                    ],
                    // Color gradient for this party
                    'heatmap-color': [
                      'interpolate',
                      ['linear'],
                      ['heatmap-density'],
                      0, 'rgba(0,0,0,0)',
                      0.2, hexToRgba(party.color, 0.3),
                      0.4, hexToRgba(party.color, 0.5),
                      0.6, hexToRgba(party.color, 0.7),
                      1, hexToRgba(party.color, 0.9),
                    ],
                    // Heatmap radius
                    'heatmap-radius': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      0, 3,
                      12, 30,
                    ],
                    // Fade out at high zoom levels
                    'heatmap-opacity': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      7, 0.8,
                      14, 0.4,
                    ],
                  }}
                />
              ))}

              {/* Circle Markers */}
              {showMarkers && (
                <>
                  {/* Circles with results */}
                  <Layer
                    id="markers-with-results"
                    type="circle"
                    source="polling-units"
                    filter={['==', ['get', 'result_received'], true]}
                    paint={{
                      'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8, 3,
                        12, 6,
                        16, 10,
                      ],
                      'circle-color': ['get', 'winning_party_color'],
                      'circle-opacity': 0.8,
                      'circle-stroke-width': 1,
                      'circle-stroke-color': '#ffffff',
                    }}
                  />

                  {/* Circles without results (gray) */}
                  <Layer
                    id="markers-no-results"
                    type="circle"
                    source="polling-units"
                    filter={['==', ['get', 'result_received'], false]}
                    paint={{
                      'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8, 2,
                        12, 4,
                        16, 6,
                      ],
                      'circle-color': '#9ca3af',
                      'circle-opacity': 0.5,
                      'circle-stroke-width': 1,
                      'circle-stroke-color': '#ffffff',
                    }}
                  />
                </>
              )}
            </Source>
          </>
        )}
      </Map>
    </div>
  );
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
